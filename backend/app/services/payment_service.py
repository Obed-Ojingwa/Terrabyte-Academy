import hmac
import hashlib
import httpx
from fastapi import HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.payment import Payment
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.services.notification_service import NotificationService
from app.core.cache import TTLCache


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.base = "https://api.paystack.co"
        self.headers = {"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}", "Content-Type": "application/json"}
        self._cache = TTLCache(ttl_seconds=300)

    async def initialize_payment(self, course_id: str, mode: str, user):
        course = (await self.db.execute(select(Course).where(Course.id == course_id))).scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self.base}/transaction/initialize",
                    json={
                        "email": user.email,
                        "amount": int(float(course.price) * 100),
                        "metadata": {"course_id": str(course_id), "student_id": str(user.id), "mode": mode},
                    },
                    headers=self.headers,
                )
            data = resp.json()
        except Exception:
            data = {"status": False, "message": "Gateway unavailable"}
        if not data.get("status"):
            payment = Payment(student_id=user.id, course_id=course_id, amount=float(course.price), gateway="paystack", gateway_ref="local-fallback", status="pending")
            self.db.add(payment)
            await self.db.commit()
            return {"authorization_url": None, "reference": payment.gateway_ref, "message": "Payment gateway unavailable; payment record created for follow-up."}
        return {"authorization_url": data["data"]["authorization_url"], "reference": data["data"]["reference"]}

    async def verify_payment(self, reference: str, user):
        cached = self._cache.get(f"payment:{reference}")
        if cached is not None:
            return cached
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

        existing_payment = (await self.db.execute(select(Payment).where(Payment.gateway_ref == reference))).scalar_one_or_none()
        if existing_payment and existing_payment.status == "success":
            self._cache.set(f"payment:{reference}", {"message": "Payment already processed."})
            return {"message": "Payment already processed."}

        payment = Payment(student_id=user.id, course_id=course_id, amount=data["data"]["amount"] / 100, gateway="paystack", gateway_ref=reference, status="success")
        self.db.add(payment)
        existing = (await self.db.execute(select(Enrollment).where(Enrollment.student_id == user.id, Enrollment.course_id == course_id))).scalar_one_or_none()
        if not existing:
            enrollment = Enrollment(student_id=user.id, course_id=course_id, mode=meta.get("mode", "online"), status="active")
            self.db.add(enrollment)
        await self.db.commit()
        await NotificationService(self.db).notify_enrollment(user.id, course.title)
        response = {"message": "Payment verified. Enrollment activated."}
        self._cache.set(f"payment:{reference}", response)
        return response

    async def handle_webhook(self, request: Request):
        body = await request.body()
        signature = request.headers.get("x-paystack-signature", "")
        expected = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), body, hashlib.sha512).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
        return {"status": "processed"}

    async def get_all_payments(self):
        result = await self.db.execute(select(Payment).order_by(Payment.created_at.desc()))
        payments = result.scalars().all()
        return {"items": [{"id": str(p.id), "amount": float(p.amount), "currency": p.currency, "status": p.status, "gateway_ref": p.gateway_ref, "created_at": p.created_at} for p in payments]}
