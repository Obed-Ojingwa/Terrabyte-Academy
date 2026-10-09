import io
import logging
from pathlib import Path
from datetime import datetime
from urllib.parse import urlencode

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

from app.services.storage_service import StorageService
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

CERTIFICATE_ASSET_DIR = Path(__file__).resolve().parents[2] / "assets" / "certificates"
CERTIFICATE_ARTWORK = CERTIFICATE_ASSET_DIR / "certificate_template.jpeg"
CERTIFICATE_SIGNATURE = CERTIFICATE_ASSET_DIR / "terrabyte_signature.png"


def _draw_centered_fit(pdf, text: str, center_x: float, baseline: float, max_width: float, font: str, size: int, min_size: int = 10) -> None:
    while size > min_size and stringWidth(text, font, size) > max_width:
        size -= 1
    pdf.setFont(font, size)
    pdf.drawCentredString(center_x, baseline, text)


def render_certificate_pdf(
    recipient_name: str,
    course_title: str,
    certificate_number: str,
    issued_at: datetime,
    verification_url: str,
) -> bytes:
    artwork = ImageReader(str(CERTIFICATE_ARTWORK))
    artwork_width, artwork_height = artwork.getSize()
    page_width = 792.0
    page_height = page_width * artwork_height / artwork_width
    pdf_buffer = io.BytesIO()
    pdf = canvas.Canvas(pdf_buffer, pagesize=(page_width, page_height), pageCompression=0)
    pdf.setTitle(f"Terrabyte Academy Certificate {certificate_number}")
    pdf.setSubject(f"Certificate verification: {verification_url}")
    pdf.drawImage(artwork, 0, 0, width=page_width, height=page_height)

    _draw_centered_fit(pdf, recipient_name, page_width * 0.5, page_height * 0.415, page_width * 0.66, "Helvetica-Bold", 28, 12)
    _draw_centered_fit(pdf, course_title, page_width * 0.5, page_height * 0.29, page_width * 0.72, "Helvetica", 18, 10)
    _draw_centered_fit(pdf, issued_at.strftime("%d %B %Y"), page_width * 0.25, page_height * 0.14, page_width * 0.22, "Helvetica-Bold", 12, 9)

    signature = ImageReader(str(CERTIFICATE_SIGNATURE))
    signature_width, signature_height = signature.getSize()
    max_signature_width = page_width * 0.18
    max_signature_height = page_height * 0.105
    signature_scale = min(max_signature_width / signature_width, max_signature_height / signature_height)
    rendered_signature_width = signature_width * signature_scale
    rendered_signature_height = signature_height * signature_scale
    pdf.drawImage(
        signature,
        page_width * 0.75 - rendered_signature_width / 2,
        page_height * 0.135,
        width=rendered_signature_width,
        height=rendered_signature_height,
        mask="auto",
    )

    qr_code = QrCodeWidget(verification_url)
    bounds = qr_code.getBounds()
    qr_size = page_width * 0.12
    qr_scale = qr_size / max(bounds[2] - bounds[0], bounds[3] - bounds[1])
    qr_drawing = Drawing(qr_size, qr_size)
    qr_drawing.add(qr_code)
    qr_drawing.scale(qr_scale, qr_scale)
    renderPDF.draw(qr_drawing, pdf, page_width * 0.84, page_height * 0.735)
    _draw_centered_fit(pdf, certificate_number, page_width * 0.90, page_height * 0.71, page_width * 0.16, "Helvetica-Bold", 8, 6)

    pdf.save()
    return pdf_buffer.getvalue()


@celery_app.task
def generate_and_upload_certificate(student_id: str, course_id: str, cert_number: str):
    from app.database import SessionLocal
    from app.models.certificate import Certificate
    from app.models.course import Course
    from app.models.notification import Notification
    from app.models.user import User

    db = SessionLocal()
    try:
        cert = db.query(Certificate).filter(Certificate.certificate_number == cert_number).with_for_update().first()
        user = db.query(User).filter(User.id == student_id).first()
        course = db.query(Course).filter(Course.id == course_id).first()
        if not cert or not user or not course:
            if cert:
                cert.status = "failed"
                db.commit()
            return {"status": "failed", "reason": "missing_record"}
        if cert.status == "issued" and cert.s3_key:
            return {"status": "ok", "s3_key": cert.s3_key, "already_issued": True}
        recipient_name = cert.recipient_name or user.certificate_name
        if not recipient_name:
            cert.status = "failed"
            db.commit()
            return {"status": "failed", "reason": "missing_certificate_name"}

        issued_at = datetime.utcnow()
        verification_url = "https://www.terrabyte.ng/public/verify-certificate?" + urlencode({"serial": cert_number})
        pdf_bytes = render_certificate_pdf(
            recipient_name=recipient_name,
            course_title=course.title,
            certificate_number=cert_number,
            issued_at=issued_at,
            verification_url=verification_url,
        )

        storage = StorageService()
        key = f"certificates/{cert_number}.pdf"
        storage.upload_file(key, pdf_bytes, "application/pdf")

        cert.s3_key = key
        cert.status = "issued"
        cert.issued_at = issued_at
        db.add(Notification(
            user_id=cert.student_id,
            title="Certificate ready",
            body="Your certificate has been issued and is now available to download.",
            type="certificate",
            link="/dashboard/student/certificates",
        ))
        db.commit()
        return {"status": "ok", "s3_key": cert.s3_key}
    except Exception:
        db.rollback()
        logger.exception("Certificate generation failed", extra={"certificate_number": cert_number})
        cert = db.query(Certificate).filter(Certificate.certificate_number == cert_number).first()
        if cert and cert.status != "issued":
            cert.status = "failed"
            db.commit()
        return {"status": "failed", "reason": "generation_error"}
    finally:
        db.close()
