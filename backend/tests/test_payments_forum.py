import asyncio

from app.services.payment_service import PaymentService


class FakeDB:
    def __init__(self):
        self.added = []

    async def execute(self, query):
        class Result:
            def scalar_one_or_none(self):
                return None

            def scalars(self):
                class Items:
                    def all(self):
                        return []

                return Items()

        return Result()

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        return None

    async def refresh(self, obj, *args, **kwargs):
        return None


def test_payment_service_builds_reference_and_payload():
    db = FakeDB()
    service = PaymentService(db)
    payload = service.build_payment_payload("course-1", "online", "user-1", "student@example.com", 5000)

    assert payload["amount"] == 500000
    assert payload["metadata"]["course_id"] == "course-1"
    assert payload["reference"].startswith("TBA-")
