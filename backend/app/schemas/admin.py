from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr


class AssignTutorPayload(BaseModel):
    tutor_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


class TutorSummary(BaseModel):
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str

    model_config = ConfigDict(from_attributes=True)


class CourseTutorAssignmentResponse(BaseModel):
    course_id: UUID
    tutor: Optional[TutorSummary] = None

    model_config = ConfigDict(from_attributes=True)


class LessonMaterialSummary(BaseModel):
    id: UUID
    title: str
    type: str
    s3_key: str
    url: str
    is_downloadable: bool
    size_bytes: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CourseMaterialResponse(BaseModel):
    lesson_id: UUID
    lesson_title: str
    materials: List[LessonMaterialSummary] = []

    model_config = ConfigDict(from_attributes=True)


class StudentCourseProgress(BaseModel):
    course_id: UUID
    course_title: str
    enrollment_status: str
    progress_percent: int
    lessons_completed: int
    total_lessons: int
    enrolled_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StudentProgressResponse(BaseModel):
    student_id: UUID
    student_name: str
    progress: List[StudentCourseProgress] = []

    model_config = ConfigDict(from_attributes=True)


class CourseStudentProgress(BaseModel):
    student_id: UUID
    student_name: str
    enrollment_status: str
    progress_percent: int
    lessons_completed: int
    total_lessons: int
    enrolled_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
