from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.api.deps import get_current_user
from app.models.course import Course, Module, Lesson
from app.schemas.course import ModuleCreate, ModuleResponse, ModuleUpdate, LessonCreate, LessonResponse, LessonUpdate

router = APIRouter(prefix="/courses", tags=["Course Content"])


async def require_course_manager(course_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    course = (await db.execute(select(Course).where(Course.id == course_id))).scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user.role.name in {"super_admin", "admin"}:
        return current_user
    if current_user.role.name != "tutor" or course.tutor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user


@router.get("/{course_id}/modules", response_model=list[ModuleResponse])
async def list_modules(course_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(require_course_manager)):
    course = (await db.execute(select(Course).where(Course.id == course_id))).scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    result = await db.execute(select(Module).where(Module.course_id == course_id).order_by(Module.position))
    modules = result.scalars().all()
    return [ModuleResponse.model_validate(module) for module in modules]


@router.post("/{course_id}/modules", response_model=ModuleResponse, status_code=201)
async def create_module(course_id: str, payload: ModuleCreate, db: AsyncSession = Depends(get_db), current_user=Depends(require_course_manager)):
    course = (await db.execute(select(Course).where(Course.id == course_id))).scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    module = Module(course_id=course_id, title=payload.title, position=payload.position)
    db.add(module)
    await db.commit()
    await db.refresh(module)
    return ModuleResponse.model_validate(module)


@router.put("/{course_id}/modules/{module_id}", response_model=ModuleResponse)
async def update_module(course_id: str, module_id: str, payload: ModuleUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(require_course_manager)):
    module = (await db.execute(select(Module).where(Module.id == module_id, Module.course_id == course_id))).scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(module, field, value)
    await db.commit()
    await db.refresh(module)
    return ModuleResponse.model_validate(module)


@router.delete("/{course_id}/modules/{module_id}", status_code=204)
async def delete_module(course_id: str, module_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(require_course_manager)):
    module = (await db.execute(select(Module).where(Module.id == module_id, Module.course_id == course_id))).scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    await db.delete(module)
    await db.commit()


@router.post("/{course_id}/modules/{module_id}/lessons", response_model=LessonResponse, status_code=201)
async def create_lesson(course_id: str, module_id: str, payload: LessonCreate, db: AsyncSession = Depends(get_db), current_user=Depends(require_course_manager)):
    module = (await db.execute(select(Module).where(Module.id == module_id, Module.course_id == course_id))).scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    lesson = Lesson(module_id=module_id, title=payload.title, content=payload.content, position=payload.position, duration_min=payload.duration_min, is_preview=payload.is_preview)
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return LessonResponse.model_validate(lesson)


@router.put("/{course_id}/modules/{module_id}/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(course_id: str, module_id: str, lesson_id: str, payload: LessonUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(require_course_manager)):
    lesson = (await db.execute(select(Lesson).where(Lesson.id == lesson_id, Lesson.module_id == module_id))).scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)
    await db.commit()
    await db.refresh(lesson)
    return LessonResponse.model_validate(lesson)


@router.delete("/{course_id}/modules/{module_id}/lessons/{lesson_id}", status_code=204)
async def delete_lesson(course_id: str, module_id: str, lesson_id: str, db: AsyncSession = Depends(get_db), current_user=Depends(require_course_manager)):
    lesson = (await db.execute(select(Lesson).where(Lesson.id == lesson_id, Lesson.module_id == module_id))).scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    await db.delete(lesson)
    await db.commit()
