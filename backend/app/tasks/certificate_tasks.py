import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from app.tasks.celery_app import celery_app


@celery_app.task
def generate_and_upload_certificate(student_id: str, course_id: str, cert_number: str):
    from app.database import SessionLocal
    from app.models.certificate import Certificate
    from app.models.user import User
    from app.models.course import Course

    db = SessionLocal()
    try:
        cert = db.query(Certificate).filter(Certificate.certificate_number == cert_number).first()
        user = db.query(User).filter(User.id == student_id).first()
        course = db.query(Course).filter(Course.id == course_id).first()
        if not cert or not user or not course:
            return {"status": "failed", "reason": "missing_record"}

        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        pdf.setTitle(f"Certificate for {course.title}")
        pdf.setFont("Helvetica-Bold", 24)
        pdf.drawCentredString(306, 720, "Certificate of Completion")
        pdf.setFont("Helvetica", 14)
        pdf.drawCentredString(306, 680, f"This certifies that")
        pdf.setFont("Helvetica-Bold", 20)
        pdf.drawCentredString(306, 640, f"{user.first_name} {user.last_name}")
        pdf.setFont("Helvetica", 14)
        pdf.drawCentredString(306, 600, f"has successfully completed the course \"{course.title}\"")
        pdf.drawCentredString(306, 560, f"Certificate Number: {cert_number}")
        pdf.drawCentredString(306, 520, f"Issued on: {datetime.utcnow().strftime('%Y-%m-%d')}")
        pdf.setFont("Helvetica-Oblique", 10)
        pdf.drawCentredString(306, 90, "Terrabyte Academy")
        pdf.save()

        cert.s3_key = f"certificates/{cert_number}.pdf"
        cert.status = "issued"
        cert.issued_at = datetime.utcnow()
        db.commit()
        return {"status": "ok", "s3_key": cert.s3_key}
    finally:
        db.close()
