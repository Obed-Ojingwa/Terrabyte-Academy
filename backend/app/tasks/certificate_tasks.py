import io
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.services.storage_service import StorageService
from app.tasks.celery_app import celery_app


@celery_app.task
def generate_and_upload_certificate(student_id: str, course_id: str, cert_number: str):
    from app.database import SessionLocal
    from app.models.certificate import Certificate
    from app.models.course import Course
    from app.models.settings import CertificateTemplate
    from app.models.user import User

    db = SessionLocal()
    try:
        cert = db.query(Certificate).filter(Certificate.certificate_number == cert_number).first()
        user = db.query(User).filter(User.id == student_id).first()
        course = db.query(Course).filter(Course.id == course_id).first()
        if not cert or not user or not course:
            return {"status": "failed", "reason": "missing_record"}

        template = db.query(CertificateTemplate).order_by(CertificateTemplate.created_at.asc()).first()
        title = (template.title if template and template.title else "Certificate of Completion") if template else "Certificate of Completion"
        subtitle = (template.subtitle if template and template.subtitle else "This certifies that")
        issuer_left = (template.issuer_left if template and template.issuer_left else "Training Coordinator")
        issuer_right = (template.issuer_right if template and template.issuer_right else "CEO")
        company_name = (template.company_name if template and template.company_name else "Terrabyte Academy")

        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        pdf.setTitle(f"Certificate for {course.title}")
        pdf.setFont("Helvetica-Bold", 24)
        pdf.drawCentredString(306, 720, title)
        pdf.setFont("Helvetica", 14)
        pdf.drawCentredString(306, 680, subtitle)
        pdf.setFont("Helvetica-Bold", 20)
        pdf.drawCentredString(306, 640, f"{user.first_name} {user.last_name}")
        pdf.setFont("Helvetica", 14)
        pdf.drawCentredString(306, 600, f"has successfully completed the course \"{course.title}\"")
        pdf.drawCentredString(306, 560, f"Certificate Number: {cert_number}")
        pdf.drawCentredString(306, 520, f"Issued on: {datetime.utcnow().strftime('%Y-%m-%d')}")
        pdf.drawCentredString(210, 90, issuer_left)
        pdf.drawCentredString(420, 90, issuer_right)
        pdf.setFont("Helvetica-Oblique", 10)
        pdf.drawCentredString(306, 55, company_name)
        pdf.save()

        storage = StorageService()
        key = f"certificates/{cert_number}.pdf"
        storage.upload_file(key, buffer.getvalue(), "application/pdf")

        cert.s3_key = key
        cert.status = "issued"
        cert.issued_at = datetime.utcnow()
        db.commit()
        return {"status": "ok", "s3_key": cert.s3_key, "url": storage.get_public_url(key)}
    finally:
        db.close()
