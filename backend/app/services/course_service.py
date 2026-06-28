import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload
from fastapi import HTTPException
from app.models.course import Course, Module
from app.models.enrollment import Enrollment
from app.schemas.course import CourseCreate, CourseListResponse, CourseResponse, CourseUpdate
from app.core.cache import TTLCache


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text)


class CourseService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._cache = TTLCache(ttl_seconds=30)

    async def list_courses(self, search, category, mode, level, page, page_size) -> CourseListResponse:
        cache_key = f"courses:{search}:{category}:{mode}:{level}:{page}:{page_size}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        base_query = (
            select(Course)
            .options(joinedload(Course.tutor), joinedload(Course.modules).joinedload(Module.lessons))
            .where(Course.is_published == True)
        )
        if search:
            base_query = base_query.where(Course.title.ilike(f"%{search}%"))
        if category:
            base_query = base_query.where(Course.category == category)
        if mode:
            base_query = base_query.where(Course.mode == mode)
        if level:
            base_query = base_query.where(Course.level == level)

        count_query = select(func.count()).select_from(base_query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        paged_query = base_query.offset((page - 1) * page_size).limit(page_size)
        courses = (await self.db.execute(paged_query)).scalars().all()
        response = CourseListResponse(
            items=[CourseResponse.model_validate(c) for c in courses],
            total=total, page=page, page_size=page_size,
            total_pages=(total + page_size - 1) // page_size,
        )
        self._cache.set(cache_key, response)
        return response

    async def list_popular_courses(self, limit: int = 6) -> list[CourseResponse]:
        popular_query = (
            select(Course)
            .join(Enrollment, Enrollment.course_id == Course.id)
            .options(joinedload(Course.tutor))
            .where(Course.is_published == True)
            .group_by(Course.id)
            .order_by(func.count(Enrollment.id).desc(), Course.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(popular_query)
        courses = result.scalars().all()
        if not courses:
            fallback_query = (
                select(Course)
                .options(joinedload(Course.tutor))
                .where(Course.is_published == True)
                .order_by(Course.created_at.desc())
                .limit(limit)
            )
            result = await self.db.execute(fallback_query)
            courses = result.scalars().all()
        return [CourseResponse.model_validate(course) for course in courses]

    async def get_course(self, course_id: str) -> CourseResponse:
        result = await self.db.execute(
            select(Course)
            .options(joinedload(Course.tutor), joinedload(Course.modules).joinedload(Module.lessons))
            .where(Course.id == course_id)
        )
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
        if user.role.name not in {"super_admin", "admin"}:
            if user.role.name != "tutor" or course.tutor_id != user.id:
                raise HTTPException(status_code=403, detail="Not authorized")
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
