from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.certificate import Certificate
from app.schemas.lms import CertificateResponse

router = APIRouter(prefix="/certificates", tags=["Certificates"])

@router.get("/me", response_model=list[CertificateResponse])
async def my_certificates(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certificate).where(Certificate.student_id == current_user.id))
    certs = result.scalars().all()
    return certs

@router.get("/verify/{cert_number}", response_model=CertificateResponse)
async def verify_certificate(cert_number: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certificate).where(Certificate.certificate_number == cert_number))
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found or invalid")
    return cert

@router.post("/request")
async def request_certificate(course_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    import uuid as _uuid
    cert_number = f"TBA-{_uuid.uuid4().hex[:10].upper()}"
    cert = Certificate(student_id=current_user.id, course_id=course_id, certificate_number=cert_number, status="pending")
    db.add(cert)
    await db.commit()
    return {"message": "Certificate request submitted", "certificate_number": cert_number}

@router.put("/{cert_id}/approve")
async def approve_certificate(cert_id: str, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    result = await db.execute(select(Certificate).where(Certificate.id == cert_id))
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    cert.status = "issued"
    cert.issued_at = datetime.utcnow()
    await db.commit()
    return {"message": "Certificate approved and issued"}
