import hmac
import hashlib
import httpx
from fastapi import HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.payment import Payment
from app.models.enrollment import Enrollment


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.base = "https://api.paystack.co"
        self.headers = {"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}", "Content-Type": "application/json"}

    async def initialize_payment(self, course_id: str, mode: str, user):
        from app.models.course import Course
        course = (await self.db.execute(select(Course).where(Course.id == course_id))).scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{self.base}/transaction/initialize", json={"email": user.email, "amount": int(course.price * 100), "metadata": {"course_id": str(course_id), "student_id": str(user.id), "mode": mode}}, headers=self.headers)
        data = resp.json()
        if not data.get("status"):
            raise HTTPException(status_code=400, detail="Payment initialization failed")
        return {"authorization_url": data["data"]["authorization_url"], "reference": data["data"]["reference"]}

    async def verify_payment(self, reference: str, user):
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base}/transaction/verify/{reference}", headers=self.headers)
        data = resp.json()
        if not data.get("status") or data["data"]["status"] != "success":
            raise HTTPException(status_code=400, detail="Payment not successful")
        meta = data["data"]["metadata"]
        payment = Payment(student_id=user.id, course_id=meta["course_id"], amount=data["data"]["amount"] / 100, gateway="paystack", gateway_ref=reference, status="success")
        self.db.add(payment)
        enrollment = Enrollment(student_id=user.id, course_id=meta["course_id"], mode=meta["mode"], status="active")
        self.db.add(enrollment)
        await self.db.commit()
        return {"message": "Payment verified. Enrollment activated."}

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
