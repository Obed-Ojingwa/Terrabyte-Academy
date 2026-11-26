import hashlib
import hmac
import uuid
from datetime import datetime

import httpx
from fastapi import HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.config import settings
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import PaymentReportRequest, PaymentReviewRequest
from app.services.notification_service import NotificationService


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.base = "https://api.paystack.co"
        self.headers = {"Authorization": f"******", "Content-Type": "application/json"}

    def build_payment_payload(self, course_id: str, mode: str, user_id: str, email: str, amount: int):
        reference = f"TBA-{uuid.uuid4().hex[:12].upper()}"
        callback_url = f"{settings.BACKEND_BASE_URL.rstrip('/')}/api/v1/payments/callback"
        return {
            "email": email,
            "amount": int(amount * 100),
            "reference": reference,
            "callback_url": callback_url,
            "metadata": {"course_id": str(course_id), "student_id": str(user_id), "mode": mode},
        }

    async def _student_enrollment(self, course_id, user) -> Enrollment:
        enrollment = (
            await self.db.execute(
                select(Enrollment).where(
                    Enrollment.student_id == user.id,
                    Enrollment.course_id == course_id,
                )
            )
        ).scalar_one_or_none()
        if not enrollment:
            raise HTTPException(status_code=400, detail="Apply for this course before making a payment")
        if enrollment.status in {"active", "completed"}:
            raise HTTPException(status_code=409, detail="You already have access to this course")
        if enrollment.status != "pending":
            raise HTTPException(status_code=403, detail="Your course application must be approved before making a payment")
        return enrollment

    async def initialize_payment(self, course_id: str, mode: str, user):
        if user.role.name != "student":
            raise HTTPException(status_code=403, detail="Only students can pay for courses")
        course = (
            await self.db.execute(
                select(Course).where(Course.id == course_id, Course.is_published.is_(True))
            )
        ).scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        amount = float(course.price or 0)
        if amount <= 0:
            raise HTTPException(status_code=400, detail="This course does not require payment")

        enrollment = await self._student_enrollment(course.id, user)
        payload = self.build_payment_payload(str(course.id), mode, str(user.id), user.email, amount)
        payment_record = Payment(
            student_id=user.id,
            course_id=course.id,
            enrollment_id=enrollment.id,
            amount=amount,
            gateway="paystack",
            gateway_ref=payload["reference"],
            status="pending",
            metadata_={"mode": mode, "course_id": str(course.id)},
        )
        self.db.add(payment_record)
        await self.db.commit()

        if not settings.PAYSTACK_SECRET_KEY:
            return {
                "authorization_url": None,
                "reference": payload["reference"],
                "message": "Online payment is unavailable. Use the payment-report option after completing a transfer.",
            }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base}/transaction/initialize",
                    json=payload,
                    headers=self.headers,
                )
            data = response.json()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=503, detail="Payment provider is unavailable. You can report a bank transfer instead.") from exc

        if not data.get("status"):
            raise HTTPException(
                status_code=503,
                detail=data.get("message") or "Payment could not be initialized. You can report a bank transfer instead.",
            )
        return {"authorization_url": data["data"]["authorization_url"], "reference": data["data"]["reference"]}

    async def report_payment(self, payload: PaymentReportRequest, user):
        if user.role.name != "student":
            raise HTTPException(status_code=403, detail="Only students can report course payments")
        course = (
            await self.db.execute(
                select(Course).where(Course.id == payload.course_id, Course.is_published.is_(True))
            )
        ).scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if float(course.price or 0) <= 0:
            raise HTTPException(status_code=400, detail="This course does not require payment")
        enrollment = await self._student_enrollment(course.id, user)

        payment = None
        if payload.reference:
            payment = (
                await self.db.execute(
                    select(Payment).where(
                        Payment.gateway_ref == payload.reference,
                        Payment.student_id == user.id,
                        Payment.course_id == course.id,
                    )
                )
            ).scalar_one_or_none()
            if not payment:
                raise HTTPException(status_code=404, detail="Payment reference not found for this course")
            if payment.status == "success":
                raise HTTPException(status_code=409, detail="This payment has already been confirmed")
            if payment.status == "reported":
                raise HTTPException(status_code=409, detail="This payment is already awaiting admin review")
        else:
            payment = Payment(
                student_id=user.id,
                course_id=course.id,
                enrollment_id=enrollment.id,
                amount=course.price,
                currency="NGN",
                gateway="manual",
                status="reported",
            )
            self.db.add(payment)

        payment.status = "reported"
        payment.enrollment_id = enrollment.id
        payment.metadata_ = {
            **(payment.metadata_ or {}),
            "mode": enrollment.mode,
            "course_id": str(course.id),
            "student_message": (payload.message or "").strip(),
            "reported_at": datetime.utcnow().isoformat(),
        }
        await self.db.commit()
        await NotificationService(self.db).notify_admins(
            "Student reported a course payment",
            f"{user.first_name} {user.last_name} reported a payment for {course.title}. Review the payment to grant course access.",
        )
        return {
            "id": str(payment.id),
            "status": payment.status,
            "message": "Payment report sent to the admin team. Course access remains locked until it is approved.",
        }

    async def review_payment(self, payment_id: str, payload: PaymentReviewRequest, reviewer):
        payment = (
            await self.db.execute(
                select(Payment)
                .options(joinedload(Payment.student), joinedload(Payment.course))
                .where(Payment.id == payment_id)
                .with_for_update()
            )
        ).scalar_one_or_none()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        if payment.status == "success":
            return {"id": str(payment.id), "status": payment.status, "message": "Payment is already approved"}
        if payment.status != "reported":
            raise HTTPException(status_code=409, detail="Only reported payments can be reviewed")

        enrollment = (
            await self.db.execute(
                select(Enrollment).where(
                    Enrollment.id == payment.enrollment_id,
                    Enrollment.student_id == payment.student_id,
                    Enrollment.course_id == payment.course_id,
                )
            )
        ).scalar_one_or_none()
        if not enrollment:
            raise HTTPException(status_code=409, detail="The course application for this payment no longer exists")
        if enrollment.status not in {"pending", "active", "completed"}:
            raise HTTPException(status_code=409, detail="The course application must be approved before payment can grant access")

        message = (payload.message or "").strip()
        if payload.decision == "approve":
            payment.status = "success"
            payment.paid_at = datetime.utcnow()
            enrollment.status = "active"
            await self.db.commit()
            await NotificationService(self.db).notify_enrollment(
                str(payment.student_id),
                payment.course.title,
            )
            return {"id": str(payment.id), "status": payment.status, "message": "Payment approved; course access granted"}

        payment.status = "rejected"
        payment.metadata_ = {**(payment.metadata_ or {}), "review_message": message}
        await self.db.commit()
        await NotificationService(self.db).create(
            user_id=str(payment.student_id),
            title="Payment report needs attention",
            body=message or f"Your payment report for {payment.course.title} could not be approved. Please contact the admin team.",
            type="payment",
            link="/dashboard/student",
        )
        return {"id": str(payment.id), "status": payment.status, "message": "Payment report rejected"}

    async def _activate_verified_payment(self, payment: Payment, amount_subunit: int | None = None):
        if payment.status not in {"pending", "reported", "success"}:
            raise HTTPException(status_code=409, detail="This payment cannot be automatically verified")
        if amount_subunit is None or int(float(payment.amount) * 100) != amount_subunit:
            raise HTTPException(status_code=400, detail="Payment amount does not match the course price")
        if not payment.student_id or not payment.course_id:
            raise HTTPException(status_code=400, detail="Payment is missing student or course information")
        enrollment_query = select(Enrollment).where(
            Enrollment.student_id == payment.student_id,
            Enrollment.course_id == payment.course_id,
        )
        if payment.enrollment_id:
            enrollment_query = enrollment_query.where(Enrollment.id == payment.enrollment_id)
        enrollment = (await self.db.execute(enrollment_query)).scalar_one_or_none()
        if not enrollment:
            raise HTTPException(status_code=409, detail="The course application for this payment no longer exists")
        if enrollment.status not in {"pending", "active", "completed"}:
            raise HTTPException(status_code=409, detail="The course application must be approved before payment can grant access")

        already_confirmed = payment.status == "success"
        if not already_confirmed:
            payment.status = "success"
            payment.paid_at = datetime.utcnow()
        access_was_locked = enrollment.status not in {"active", "completed"}
        enrollment.status = "active"
        await self.db.commit()
        if not already_confirmed:
            await NotificationService(self.db).notify_enrollment(str(payment.student_id), payment.course.title)
            await NotificationService(self.db).notify_admins(
                "Course payment confirmed",
                f"Payment for {payment.course.title} by {payment.student.first_name} {payment.student.last_name} was confirmed automatically.",
            )
        return not already_confirmed or access_was_locked

    async def verify_payment(self, reference: str, user):
        payment = (
            await self.db.execute(
                select(Payment)
                .options(joinedload(Payment.course), joinedload(Payment.student))
                .where(Payment.gateway_ref == reference)
            )
        ).scalar_one_or_none()
        if not payment or payment.student_id != user.id:
            raise HTTPException(status_code=404, detail="Payment not found")
        if payment.status == "success":
            return {"message": "Payment already processed."}
        if payment.gateway != "paystack" or payment.status != "pending":
            raise HTTPException(status_code=409, detail="This payment cannot be verified through Paystack")
        if not settings.PAYSTACK_SECRET_KEY:
            raise HTTPException(status_code=503, detail="Payment verification is unavailable. Contact the admin team.")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base}/transaction/verify/{reference}",
                    headers=self.headers,
                )
            data = response.json()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=503, detail="Payment provider is unavailable") from exc
        transaction = data.get("data", {})
        if not data.get("status") or transaction.get("status") != "success":
            raise HTTPException(status_code=400, detail="Payment not successful")
        if transaction.get("currency") and transaction["currency"] != payment.currency:
            raise HTTPException(status_code=400, detail="Payment currency does not match the course")
        await self._activate_verified_payment(payment, transaction.get("amount"))
        return {"message": "Payment verified. Course access is now active."}

    async def handle_webhook(self, request: Request):
        body = await request.body()
        signature = request.headers.get("x-paystack-signature")
        if not settings.PAYSTACK_SECRET_KEY:
            return {"status": "skipped", "message": "Webhook skipped because credentials are not configured."}
        if not signature:
            raise HTTPException(status_code=400, detail="Missing or invalid webhook signature")
        expected = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), body, hashlib.sha512).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise HTTPException(status_code=400, detail="Missing or invalid webhook signature")

        payload = await request.json()
        transaction = payload.get("data", {})
        if payload.get("event") != "charge.success" or transaction.get("status") != "success":
            return {"status": "ignored", "message": "Unhandled event"}

        reference = transaction.get("reference")
        if not reference:
            return {"status": "ignored", "message": "Payment reference is missing"}
        payment = (
            await self.db.execute(
                select(Payment)
                .options(joinedload(Payment.course), joinedload(Payment.student))
                .where(Payment.gateway_ref == reference)
            )
        ).scalar_one_or_none()
        if not payment:
            return {"status": "ignored", "message": "Payment reference was not found"}
        if transaction.get("currency") and transaction["currency"] != payment.currency:
            raise HTTPException(status_code=400, detail="Payment currency does not match the course")
        activated = await self._activate_verified_payment(payment, transaction.get("amount"))
        return {"status": "processed" if activated else "already_processed"}

    async def get_student_payments(self, user):
        result = await self.db.execute(
            select(Payment)
            .options(joinedload(Payment.course), joinedload(Payment.student))
            .where(Payment.student_id == user.id)
            .order_by(Payment.created_at.desc())
        )
        return {"items": [self._payment_response(payment) for payment in result.unique().scalars().all()]}

    @staticmethod
    def _payment_response(payment: Payment):
        return {
            "id": str(payment.id),
            "student_id": str(payment.student_id) if payment.student_id else None,
            "student_name": (
                f"{payment.student.first_name} {payment.student.last_name}"
                if payment.student else None
            ),
            "student_email": payment.student.email if payment.student else None,
            "course_id": str(payment.course_id) if payment.course_id else None,
            "course_title": payment.course.title if payment.course else None,
            "enrollment_id": str(payment.enrollment_id) if payment.enrollment_id else None,
            "amount": float(payment.amount),
            "currency": payment.currency,
            "gateway": payment.gateway,
            "gateway_ref": payment.gateway_ref,
            "status": payment.status,
            "message": (payment.metadata_ or {}).get("student_message"),
            "review_message": (payment.metadata_ or {}).get("review_message"),
            "created_at": payment.created_at,
            "paid_at": payment.paid_at,
        }

    async def get_all_payments(self):
        result = await self.db.execute(
            select(Payment)
            .options(joinedload(Payment.student), joinedload(Payment.course))
            .order_by(Payment.created_at.desc())
        )
        payments = result.unique().scalars().all()
        return {"items": [self._payment_response(payment) for payment in payments]}
