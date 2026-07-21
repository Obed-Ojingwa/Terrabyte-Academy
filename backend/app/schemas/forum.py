from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ForumReplyResponse(BaseModel):
    id: UUID
    body: str
    created_at: datetime
    author_id: UUID

    model_config = ConfigDict(from_attributes=True)


class ForumThreadResponse(BaseModel):
    id: UUID
    title: str
    body: str
    course_id: Optional[UUID] = None
    author_id: UUID
    is_pinned: bool
    is_closed: bool
    is_question: bool = False
    created_at: datetime
    updated_at: datetime
    replies: list[ForumReplyResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ForumThreadCreate(BaseModel):
    title: str
    body: str
    course_id: Optional[UUID] = None
    is_question: bool = False


class ForumReplyCreate(BaseModel):
    body: str
