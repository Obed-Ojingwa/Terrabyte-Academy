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


class MaterialResponse(BaseModel):
    id: UUID
    lesson_id: UUID
    title: str
    type: str
    s3_key: str
    url: str
    is_downloadable: bool
    size_bytes: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CourseLessonSummary(BaseModel):
    id: UUID
    title: str
    position: int
    duration_min: Optional[int] = None
    is_preview: bool = False
    is_completed: bool = False
    materials: List[MaterialResponse] = []

    model_config = ConfigDict(from_attributes=True)


class CourseModuleSummary(BaseModel):
    id: UUID
    title: str
    position: int
    lessons: List[CourseLessonSummary] = []

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
    tutor_id: Optional[UUID] = None


class MaterialResponse(BaseModel):
    id: UUID
    lesson_id: UUID
    title: str
    type: str
    s3_key: str
    url: str
    is_downloadable: bool
    size_bytes: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MaterialUpdate(BaseModel):
    title: Optional[str] = None
    is_downloadable: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


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
    modules: Optional[List[CourseModuleSummary]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ModuleCreate(BaseModel):
    title: str
    position: int = 0


class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    position: Optional[int] = None


class ModuleResponse(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    position: int
    lessons: List["LessonResponse"] = []

    model_config = ConfigDict(from_attributes=True)


class LessonCreate(BaseModel):
    title: str
    content: Optional[str] = None
    position: int = 0
    duration_min: Optional[int] = None
    is_preview: bool = False


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    position: Optional[int] = None
    duration_min: Optional[int] = None
    is_preview: Optional[bool] = None


class LessonResponse(BaseModel):
    id: UUID
    module_id: UUID
    title: str
    content: Optional[str] = None
    position: int
    duration_min: Optional[int] = None
    is_preview: bool
    is_completed: Optional[bool] = False
    materials: List[MaterialResponse] = []

    model_config = ConfigDict(from_attributes=True)


class CourseListResponse(BaseModel):
    items: List[CourseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
