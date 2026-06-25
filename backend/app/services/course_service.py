import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload
from fastapi import HTTPException
from app.models.course import Course
from app.schemas.course import CourseCreate, CourseListResponse, CourseResponse, CourseUpdate


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text)


class CourseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_courses(self, search, category, mode, level, page, page_size) -> CourseListResponse:
        query = select(Course).options(joinedload(Course.tutor)).where(Course.is_published == True)
        if search:
            query = query.where(Course.title.ilike(f"%{search}%"))
        if category:
            query = query.where(Course.category == category)
        if mode:
            query = query.where(Course.mode == mode)
        if level:
            query = query.where(Course.level == level)
        total = (await self.db.execute(select(func.count()).select_from(query.subquery()))).scalar()
        query = query.offset((page - 1) * page_size).limit(page_size)
        courses = (await self.db.execute(query)).scalars().all()
        return CourseListResponse(
            items=[CourseResponse.model_validate(c) for c in courses],
            total=total, page=page, page_size=page_size,
            total_pages=(total + page_size - 1) // page_size,
        )

    async def get_course(self, course_id: str) -> CourseResponse:
        result = await self.db.execute(select(Course).options(joinedload(Course.tutor)).where(Course.id == course_id))
        course = result.scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        return CourseResponse.model_validate(course)

    async def create_course(self, payload: CourseCreate, user) -> CourseResponse:
        slug = slugify(payload.title)
        count = (await self.db.execute(select(func.count()).where(Course.slug.like(f"{slug}%")))).scalar()
        if count:
            slug = f"{slug}-{count}"
        course = Course(**payload.model_dump(exclude={"tutor_id"}), slug=slug, created_by=user.id, tutor_id=payload.tutor_id)
        self.db.add(course)
        await self.db.commit()
        await self.db.refresh(course)
        if course.tutor_id:
            await self.db.refresh(course, attribute_names=["tutor"])
        return CourseResponse.model_validate(course)

    async def update_course(self, course_id: str, payload: CourseUpdate, user) -> CourseResponse:
        result = await self.db.execute(select(Course).options(joinedload(Course.tutor)).where(Course.id == course_id))
        course = result.scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(course, field, value)
        await self.db.commit()
        await self.db.refresh(course)
        if course.tutor_id:
            await self.db.refresh(course, attribute_names=["tutor"])
        return CourseResponse.model_validate(course)

    async def delete_course(self, course_id: str, user):
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        course = result.scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        await self.db.delete(course)
        await self.db.commit()
