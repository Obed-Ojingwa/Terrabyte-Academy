from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from app.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.certificate import Certificate
from app.models.enrollment import Enrollment, LessonProgress
from app.models.course import Course, Module
from app.models.user import User
from app.schemas.lms import CertificateResponse, CertificateVerificationResponse
from app.tasks.certificate_tasks import generate_and_upload_certificate
from app.services.storage_service import StorageService
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

@router.get("/verify/{cert_number}", response_model=CertificateVerificationResponse)
async def verify_certificate(cert_number: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Certificate)
        .options(joinedload(Certificate.student), joinedload(Certificate.course))
        .where(Certificate.certificate_number == cert_number, Certificate.status == "issued")
    )
    cert = result.scalar_one_or_none()
    if not cert or not cert.s3_key or not cert.issued_at:
        raise HTTPException(status_code=404, detail="Certificate not found or invalid")
    recipient_name = cert.recipient_name or cert.student.certificate_name or f"{cert.student.first_name} {cert.student.last_name}"
    return CertificateVerificationResponse(
        certificate_number=cert.certificate_number,
        recipient_name=recipient_name,
        course_title=cert.course.title,
        issued_at=cert.issued_at,
        status="issued",
    )

@router.post("/request")
async def request_certificate(course_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.certificate_name:
        raise HTTPException(status_code=400, detail="Add your preferred certificate name to your profile before requesting a certificate")
    existing = (await db.execute(select(Certificate).where(Certificate.student_id == current_user.id, Certificate.course_id == course_id))).scalar_one_or_none()
    if existing:
        return {"message": "Certificate request already exists", "certificate_number": existing.certificate_number}

    enrollment = (
        await db.execute(
            select(Enrollment)
            .options(selectinload(Enrollment.course).selectinload(Course.modules).selectinload(Module.lessons))
            .where(Enrollment.student_id == current_user.id, Enrollment.course_id == course_id)
        )
    ).scalar_one_or_none()
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
    result = await db.execute(select(Certificate).where(Certificate.id == cert_id).with_for_update())
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if cert.status == "issued" and cert.s3_key:
        return {"message": "Certificate is already issued", "certificate_number": cert.certificate_number}
    if cert.status == "generating":
        return {"message": "Certificate generation is already in progress", "certificate_number": cert.certificate_number}
    student_result = await db.execute(select(User).where(User.id == cert.student_id))
    student = student_result.scalar_one_or_none()
    if not student or not student.certificate_name:
        raise HTTPException(status_code=400, detail="The student must save a preferred certificate name before issuance")
    cert.recipient_name = student.certificate_name
    cert.status = "generating"
    await db.commit()
    try:
        generate_and_upload_certificate.delay(str(cert.student_id), str(cert.course_id), cert.certificate_number)
    except Exception as exc:
        cert.status = "failed"
        await db.commit()
        raise HTTPException(status_code=503, detail="Certificate generation could not be queued; retry issuance") from exc
    return {"message": "Certificate approved and generation started", "certificate_number": cert.certificate_number, "status": cert.status}


@router.get("/{cert_id}/download")
async def download_certificate(cert_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certificate).where(Certificate.id == cert_id))
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    is_admin = current_user.role.name in {"admin", "super_admin"}
    if not is_admin and cert.student_id != current_user.id:
        raise HTTPException(status_code=404, detail="Certificate not found")
    if cert.status != "issued" or not cert.s3_key:
        raise HTTPException(status_code=409, detail="Certificate PDF is not ready")
    try:
        pdf_bytes = StorageService().download_file(cert.s3_key)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Certificate PDF is unavailable") from exc
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{cert.certificate_number}.pdf"'},
    )
