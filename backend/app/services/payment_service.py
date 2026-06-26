import hashlib
import hmac
import uuid
from datetime import datetime

import httpx
from fastapi import HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.cache import TTLCache
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.payment import Payment
from app.services.notification_service import NotificationService


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.base = "https://api.paystack.co"
        self.headers = {"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}", "Content-Type": "application/json"}
        self._cache = TTLCache(ttl_seconds=300)

    def build_payment_payload(self, course_id: str, mode: str, user_id: str, email: str, amount: int):
        reference = f"TBA-{uuid.uuid4().hex[:12].upper()}"
        return {
            "email": email,
            "amount": int(amount * 100),
            "reference": reference,
            "metadata": {"course_id": str(course_id), "student_id": str(user_id), "mode": mode},
        }

    async def initialize_payment(self, course_id: str, mode: str, user):
        course = (await self.db.execute(select(Course).where(Course.id == course_id))).scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        amount = float(course.price) if course.price is not None else 0.0
        payload = self.build_payment_payload(str(course.id), mode, str(user.id), user.email, amount)

        if not settings.PAYSTACK_SECRET_KEY:
            payment = Payment(
                student_id=user.id,
                course_id=course.id,
                amount=amount,
                gateway="paystack",
                gateway_ref=payload["reference"],
                status="pending",
                metadata_={"mode": mode, "course_id": str(course.id)},
            )
            self.db.add(payment)
            await self.db.commit()
            return {"authorization_url": None, "reference": payload["reference"], "message": "Paystack credentials are not configured yet; a local payment reference was created."}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(f"{self.base}/transaction/initialize", json=payload, headers=self.headers)
            data = resp.json()
        except Exception:
            data = {"status": False, "message": "Gateway unavailable"}

        if not data.get("status"):
            payment = Payment(
                student_id=user.id,
                course_id=course.id,
                amount=amount,
                gateway="paystack",
                gateway_ref=payload["reference"],
                status="pending",
                metadata_={"mode": mode, "course_id": str(course.id)},
            )
            self.db.add(payment)
            await self.db.commit()
            return {"authorization_url": None, "reference": payment.gateway_ref, "message": data.get("message") or "Payment gateway unavailable; payment record created for follow-up."}

        return {"authorization_url": data["data"]["authorization_url"], "reference": data["data"]["reference"]}

    async def verify_payment(self, reference: str, user):
        cached = self._cache.get(f"payment:{reference}")
        if cached is not None:
            return cached

        existing_payment = (await self.db.execute(select(Payment).where(Payment.gateway_ref == reference))).scalar_one_or_none()
        if existing_payment and existing_payment.status == "success":
            self._cache.set(f"payment:{reference}", {"message": "Payment already processed."})
            return {"message": "Payment already processed."}

        if not settings.PAYSTACK_SECRET_KEY:
            response = {"message": "Paystack verification skipped because credentials are not configured."}
            self._cache.set(f"payment:{reference}", response)
            return response

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self.base}/transaction/verify/{reference}", headers=self.headers)
            data = resp.json()
        except Exception:
            data = {"status": False}

        if not data.get("status") or data.get("data", {}).get("status") != "success":
            raise HTTPException(status_code=400, detail="Payment not successful")

        meta = data["data"].get("metadata", {})
        course_id = meta.get("course_id")
        course = (await self.db.execute(select(Course).where(Course.id == course_id))).scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        payment = existing_payment or Payment(
            student_id=user.id,
            course_id=course.id,
            amount=data["data"]["amount"] / 100,
            gateway="paystack",
            gateway_ref=reference,
            status="success",
            paid_at=datetime.utcnow(),
            metadata_={"mode": meta.get("mode", "online"), "course_id": str(course.id)},
        )
        if not existing_payment:
            self.db.add(payment)
        else:
            existing_payment.status = "success"
            existing_payment.paid_at = datetime.utcnow()
            existing_payment.metadata_ = {**(existing_payment.metadata_ or {}), "mode": meta.get("mode", "online")}

        existing = (await self.db.execute(select(Enrollment).where(Enrollment.student_id == user.id, Enrollment.course_id == course.id))).scalar_one_or_none()
        if not existing:
            enrollment = Enrollment(student_id=user.id, course_id=course.id, mode=meta.get("mode", "online"), status="active")
            self.db.add(enrollment)

        await self.db.commit()
        await NotificationService(self.db).notify_enrollment(user.id, course.title)
        response = {"message": "Payment verified. Enrollment activated."}
        self._cache.set(f"payment:{reference}", response)
        return response

    async def handle_webhook(self, request: Request):
        body = await request.body()
        signature = request.headers.get("x-paystack-signature", "")
        if not settings.PAYSTACK_SECRET_KEY:
            return {"status": "skipped", "message": "Webhook skipped because credentials are not configured."}
        expected = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), body, hashlib.sha512).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

        payload = await request.json()
        event = payload.get("event")
        data = payload.get("data", {})
        if event != "charge.success" and data.get("status") != "success":
            return {"status": "ignored", "message": "Unhandled event"}

        reference = data.get("reference")
        if reference:
            payment = (await self.db.execute(select(Payment).where(Payment.gateway_ref == reference))).scalar_one_or_none()
            if payment:
                payment.status = "success"
                payment.paid_at = datetime.utcnow()
                payment.metadata_ = {**(payment.metadata_ or {}), "webhook": True}
                await self.db.commit()

        return {"status": "processed"}

    async def get_all_payments(self):
        result = await self.db.execute(select(Payment).order_by(Payment.created_at.desc()))
        payments = result.scalars().all()
        return {"items": [{"id": str(p.id), "amount": float(p.amount), "currency": p.currency, "status": p.status, "gateway_ref": p.gateway_ref, "created_at": p.created_at} for p in payments]}
