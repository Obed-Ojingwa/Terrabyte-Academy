import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import get_current_user
from app.database import get_db
from app.models.course import Lesson, Material
from app.schemas.course import MaterialResponse, MaterialUpdate
from app.services.storage_service import StorageService

router = APIRouter(prefix="/lesson-materials", tags=["Lesson Materials"])


async def require_tutor_for_lesson(lesson_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    lesson = (await db.execute(select(Lesson).where(Lesson.id == lesson_id).options(joinedload(Lesson.module).joinedload(Lesson.module.course)))).scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    course = lesson.module.course
    if current_user.role.name not in {"super_admin", "admin"}:
        if current_user.role.name != "tutor" or course.tutor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    return lesson


@router.post("/{lesson_id}", response_model=MaterialResponse, status_code=201)
async def upload_lesson_material(
    lesson_id: str,
    title: str = Form(""),
    is_downloadable: bool = Form(True),
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lesson = await require_tutor_for_lesson(lesson_id, current_user, db)
    storage = StorageService()
    key = f"materials/{lesson.module.course_id}/{lesson_id}/{uuid.uuid4().hex}_{file.filename}"
    try:
        contents = await file.read()
        storage.upload_file(key, contents, file.content_type)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to upload lesson material") from exc

    material = Material(
        lesson_id=lesson.id,
        title=title or file.filename,
        type=file.content_type or "application/octet-stream",
        s3_key=key,
        is_downloadable=is_downloadable,
        size_bytes=len(contents),
        created_at=datetime.utcnow(),
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)

    return MaterialResponse(
        id=material.id,
        lesson_id=material.lesson_id,
        title=material.title,
        type=material.type,
        s3_key=material.s3_key,
        url=storage.get_public_url(material.s3_key),
        is_downloadable=material.is_downloadable,
        size_bytes=material.size_bytes,
        created_at=material.created_at,
    )




@router.put("/{lesson_id}/{material_id}", response_model=MaterialResponse)
async def update_lesson_material(
    lesson_id: str,
    material_id: str,
    payload: MaterialUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lesson = await require_tutor_for_lesson(lesson_id, current_user, db)
    material = (await db.execute(select(Material).where(Material.id == material_id, Material.lesson_id == lesson.id))).scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if payload.title is not None:
        material.title = payload.title
    if payload.is_downloadable is not None:
        material.is_downloadable = payload.is_downloadable
    await db.commit()
    await db.refresh(material)
    storage = StorageService()
    return MaterialResponse(
        id=material.id,
        lesson_id=material.lesson_id,
        title=material.title,
        type=material.type,
        s3_key=material.s3_key,
        url=storage.get_public_url(material.s3_key),
        is_downloadable=material.is_downloadable,
        size_bytes=material.size_bytes,
        created_at=material.created_at,
    )


@router.delete("/{lesson_id}/{material_id}", status_code=204)
async def delete_lesson_material(lesson_id: str, material_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    lesson = await require_tutor_for_lesson(lesson_id, current_user, db)
    material = (await db.execute(select(Material).where(Material.id == material_id, Material.lesson_id == lesson.id))).scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    await db.delete(material)
    await db.commit()
