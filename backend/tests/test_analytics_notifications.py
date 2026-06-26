import asyncio

from app.services.analytics_service import AnalyticsService
from app.services.notification_service import NotificationService


class FakeResult:
    def __init__(self, value):
        self._value = value

    def scalar(self):
        return self._value

    def scalar_one_or_none(self):
        return self._value


class FakeDB:
    def __init__(self, values=None):
        self._values = list(values or [])
        self.added = []

    async def execute(self, query):
        if not self._values:
            return FakeResult(None)
        return FakeResult(self._values.pop(0))

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        return None


def test_admin_stats_include_revenue_series_and_recent_activity():
    db = FakeDB(["student", 42, 15, 2500000, 120, 8, 3, 4])
    stats = asyncio.run(AnalyticsService(db).get_admin_stats())

    assert stats["total_students"] == 42
    assert stats["total_courses"] == 15
    assert stats["total_revenue"] == 2500000.0
    assert stats["certificates_issued"] == 120
    assert len(stats["revenue_series"]) == 6
    assert stats["recent_activity"][0]["label"] == "New enrollments"


def test_student_stats_include_assignment_and_completion_breakdown():
    db = FakeDB([3, 2, 9, 4])
    stats = asyncio.run(AnalyticsService(db).get_student_stats("student-1"))

    assert stats["enrolled"] == 3
    assert stats["completed"] == 2
    assert stats["certificates"] == 9
    assert stats["assignments"] == 4
    assert stats["completion_rate"] == 67


def test_notification_service_creates_notification_helpers():
    db = FakeDB()
    service = NotificationService(db)

    notif = asyncio.run(service.create("user-1", "Welcome", "Welcome aboard", "system"))
    assert notif.title == "Welcome"
    assert notif.user_id == "user-1"

    enrollment_notice = asyncio.run(service.notify_enrollment("user-1", "Python Basics"))
    assert enrollment_notice.title == "Enrollment confirmed"
    assert enrollment_notice.body == "Your enrollment for Python Basics is now active."
    assert len(db.added) == 2
