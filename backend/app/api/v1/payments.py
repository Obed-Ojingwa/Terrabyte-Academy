from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.api.deps import get_current_user, require_admin
from app.config import settings
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/initialize")
async def initialize_payment(course_id: str, mode: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await PaymentService(db).initialize_payment(course_id, mode, current_user)

@router.post("/verify/{reference}")
async def verify_payment(reference: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await PaymentService(db).verify_payment(reference, current_user)

@router.get("/callback")
async def payment_callback(reference: str | None = Query(None)):
    if not reference:
        raise HTTPException(status_code=400, detail="Payment reference is required")
    redirect_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/public/payments/verify?reference={reference}"
    return RedirectResponse(url=redirect_url)

@router.get("/callback/{reference}")
async def payment_callback_path(reference: str):
    redirect_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/public/payments/verify?reference={reference}"
    return RedirectResponse(url=redirect_url)

@router.post("/webhook")
async def payment_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    return await PaymentService(db).handle_webhook(request)

@router.get("/history")
async def payment_history(current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    return await PaymentService(db).get_all_payments()
