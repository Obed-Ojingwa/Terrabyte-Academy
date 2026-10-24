from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PaymentReportRequest(BaseModel):
    course_id: UUID
    reference: str | None = Field(default=None, max_length=255)
    message: str | None = Field(default=None, max_length=2000)

    model_config = ConfigDict(extra="forbid")


class PaymentReviewRequest(BaseModel):
    decision: Literal["approve", "reject"]
    message: str | None = Field(default=None, max_length=2000)

    model_config = ConfigDict(extra="forbid")
