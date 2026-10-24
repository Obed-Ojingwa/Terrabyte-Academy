import asyncio
from types import SimpleNamespace
from uuid import uuid4

from app.models.payment import Payment
from app.schemas.payment import PaymentReportRequest, PaymentReviewRequest
from app.services.payment_service import PaymentService


class FakeResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value

    def scalars(self):
        class Values:
            def __init__(self, value):
                self.value = value

            def all(self):
                return self.value

        return Values(self.value)


class FakeDB:
    def __init__(self, *results):
        self.results = list(results)
        self.added = []
        self.committed = False

    async def execute(self, statement):
        return self.results.pop(0)

    def add(self, value):
        self.added.append(value)

    def add_all(self, values):
        self.added.extend(values)

    async def commit(self):
        self.committed = True


def test_student_payment_report_notifies_admin_and_does_not_unlock_course():
    student_id = uuid4()
    course_id = uuid4()
    enrollment = SimpleNamespace(id=uuid4(), status="pending", mode="online")
    course = SimpleNamespace(id=course_id, title="GIS", price=75000, is_published=True)
    student = SimpleNamespace(
        id=student_id,
        first_name="Alex",
        last_name="Student",
        role=SimpleNamespace(name="student"),
    )
    db = FakeDB(FakeResult(course), FakeResult(enrollment), FakeResult([]))

    result = asyncio.run(
        PaymentService(db).report_payment(
            PaymentReportRequest(course_id=course_id, message="Transferred this morning"),
            student,
        )
    )

    report = next(value for value in db.added if isinstance(value, Payment))
    assert result["status"] == "reported"
    assert report.gateway == "manual"
    assert report.status == "reported"
    assert report.metadata_["student_message"] == "Transferred this morning"
    assert enrollment.status == "pending"
    assert db.committed


def test_admin_approval_activates_course_application_and_payment():
    student_id = uuid4()
    course_id = uuid4()
    enrollment = SimpleNamespace(
        id=uuid4(),
        student_id=student_id,
        course_id=course_id,
        status="pending",
    )
    payment = Payment(
        student_id=student_id,
        course_id=course_id,
        enrollment_id=enrollment.id,
        amount=75000,
        gateway="manual",
        status="reported",
    )
    payment.id = uuid4()
    payment.course = SimpleNamespace(title="GIS")
    payment.student = SimpleNamespace(first_name="Alex", last_name="Student")
    db = FakeDB(FakeResult(payment), FakeResult(enrollment))

    result = asyncio.run(
        PaymentService(db).review_payment(
            str(payment.id),
            PaymentReviewRequest(decision="approve"),
            SimpleNamespace(id=uuid4()),
        )
    )

    assert result["status"] == "success"
    assert payment.status == "success"
    assert enrollment.status == "active"
    assert db.committed


def test_admin_rejection_keeps_application_locked():
    student_id = uuid4()
    course_id = uuid4()
    enrollment = SimpleNamespace(
        id=uuid4(),
        student_id=student_id,
        course_id=course_id,
        status="pending",
    )
    payment = Payment(
        student_id=student_id,
        course_id=course_id,
        enrollment_id=enrollment.id,
        amount=75000,
        gateway="manual",
        status="reported",
    )
    payment.id = uuid4()
    payment.course = SimpleNamespace(title="GIS")
    payment.student = SimpleNamespace(first_name="Alex", last_name="Student")
    db = FakeDB(FakeResult(payment), FakeResult(enrollment))

    result = asyncio.run(
        PaymentService(db).review_payment(
            str(payment.id),
            PaymentReviewRequest(decision="reject", message="Please send a valid receipt."),
            SimpleNamespace(id=uuid4()),
        )
    )

    assert result["status"] == "rejected"
    assert payment.status == "rejected"
    assert payment.metadata_["review_message"] == "Please send a valid receipt."
    assert enrollment.status == "pending"
