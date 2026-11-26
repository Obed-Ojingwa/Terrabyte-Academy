from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


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


class CourseOutlineModule(BaseModel):
    title: str
    topics: List[str] = Field(default_factory=list)


class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float = 0
    mode: str
    category: Optional[str] = None
    level: Optional[str] = None
    duration_weeks: Optional[int] = Field(default=None, ge=1)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    requirements: List[str] = Field(default_factory=list)
    learning_outcomes: List[str] = Field(default_factory=list)
    topics: List[str] = Field(default_factory=list)
    course_outline: List[CourseOutlineModule] = Field(default_factory=list)
    is_published: bool = False
    thumbnail_url: Optional[str] = None
    tutor_id: Optional[UUID] = None


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    mode: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    duration_weeks: Optional[int] = Field(default=None, ge=1)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    requirements: Optional[List[str]] = None
    learning_outcomes: Optional[List[str]] = None
    topics: Optional[List[str]] = None
    course_outline: Optional[List[CourseOutlineModule]] = None
    is_published: Optional[bool] = None
    thumbnail_url: Optional[str] = None
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
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    requirements: List[str] = Field(default_factory=list)
    learning_outcomes: List[str] = Field(default_factory=list)
    topics: List[str] = Field(default_factory=list)
    course_outline: List[CourseOutlineModule] = Field(default_factory=list)
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
