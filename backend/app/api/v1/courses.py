from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.api.deps import get_current_user, require_admin, require_tutor
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseListResponse
from app.services.course_service import CourseService

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.get("/", response_model=CourseListResponse)
async def list_courses(
    search: Optional[str] = None,
    category: Optional[str] = None,
    mode: Optional[str] = None,
    level: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await CourseService(db).list_courses(search, category, mode, level, page, page_size)

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str, db: AsyncSession = Depends(get_db)):
    return await CourseService(db).get_course(course_id)

@router.post("/", response_model=CourseResponse, status_code=201)
async def create_course(payload: CourseCreate, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    return await CourseService(db).create_course(payload, current_user)

@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(course_id: str, payload: CourseUpdate, current_user=Depends(require_tutor), db: AsyncSession = Depends(get_db)):
    return await CourseService(db).update_course(course_id, payload, current_user)

@router.delete("/{course_id}", status_code=204)
async def delete_course(course_id: str, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    await CourseService(db).delete_course(course_id, current_user)
