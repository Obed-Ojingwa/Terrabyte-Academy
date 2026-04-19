from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


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
    created_at: datetime

    class Config:
        from_attributes = True


class CourseListResponse(BaseModel):
    items: List[CourseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
