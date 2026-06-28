from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.certificate import Certificate
from app.models.enrollment import Enrollment, LessonProgress
from app.schemas.lms import CertificateResponse
from app.tasks.certificate_tasks import generate_and_upload_certificate
from app.services.notification_service import NotificationService
from datetime import datetime

router = APIRouter(prefix="/certificates", tags=["Certificates"])

@router.get("/", response_model=list[CertificateResponse])
async def list_certificates(
    status: str | None = Query(None),
    current_user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(Certificate).options(joinedload(Certificate.student), joinedload(Certificate.course))
    if status:
        query = query.where(Certificate.status == status)
    result = await db.execute(query.order_by(Certificate.requested_at.desc()))
    return result.scalars().all()

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
    existing = (await db.execute(select(Certificate).where(Certificate.student_id == current_user.id, Certificate.course_id == course_id))).scalar_one_or_none()
    if existing:
        return {"message": "Certificate request already exists", "certificate_number": existing.certificate_number}

    enrollment = (await db.execute(select(Enrollment).where(Enrollment.student_id == current_user.id, Enrollment.course_id == course_id))).scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=400, detail="You must be enrolled in the course to request a certificate")

    lesson_ids = [lesson.id for module in enrollment.course.modules for lesson in module.lessons] if getattr(enrollment.course, "modules", None) else []
    if lesson_ids:
        progress_rows = (
            await db.execute(select(LessonProgress).where(LessonProgress.student_id == current_user.id, LessonProgress.lesson_id.in_(lesson_ids)))
        ).scalars().all()
        if any(not progress.is_completed for progress in progress_rows) or len(progress_rows) < len(lesson_ids):
            raise HTTPException(status_code=400, detail="Complete all lessons before requesting a certificate")

    if enrollment.status != "completed":
        enrollment.status = "completed"
        enrollment.completed_at = datetime.utcnow()
        await db.commit()

    import uuid as _uuid
    cert_number = f"TBA-{_uuid.uuid4().hex[:10].upper()}"
    cert = Certificate(student_id=current_user.id, course_id=course_id, certificate_number=cert_number, status="pending", requested_at=datetime.utcnow())
    db.add(cert)
    await db.commit()
    await db.refresh(cert)
    return {"message": "Certificate request submitted", "certificate_number": cert.certificate_number}

@router.put("/{cert_id}/approve")
async def approve_certificate(cert_id: str, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certificate).where(Certificate.id == cert_id))
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    cert.status = "issued"
    cert.issued_at = datetime.utcnow()
    await db.commit()
    await NotificationService(db).notify_certificate_issued(cert.student_id, cert.course_id)
    generate_and_upload_certificate.delay(str(cert.student_id), str(cert.course_id), cert.certificate_number)
    return {"message": "Certificate approved and issued", "certificate_number": cert.certificate_number}
