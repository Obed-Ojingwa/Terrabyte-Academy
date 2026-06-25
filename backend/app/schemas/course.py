from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class CourseTutorSummary(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float = 0
    mode: str
    category: Optional[str] = None
    level: Optional[str] = None
    duration_weeks: Optional[int] = None
    tutor_id: Optional[UUID] = None


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    mode: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    duration_weeks: Optional[int] = None
    is_published: Optional[bool] = None


class CourseResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    description: Optional[str]
    thumbnail_url: Optional[str]
    price: float
    mode: str
    category: Optional[str]
    level: Optional[str]
    duration_weeks: Optional[int]
    is_published: bool
    tutor: Optional[CourseTutorSummary] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CourseListResponse(BaseModel):
    items: List[CourseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
