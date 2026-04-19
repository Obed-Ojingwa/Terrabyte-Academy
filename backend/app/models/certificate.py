import uuid
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.database import Base


class Certificate(Base):
    __tablename__ = "certificates"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id"))
    certificate_number: Mapped[str] = mapped_column(String(100), unique=True)
    s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    requested_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    issued_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    student: Mapped["User"] = relationship(foreign_keys=[student_id])
    course: Mapped["Course"] = relationship(foreign_keys=[course_id])
