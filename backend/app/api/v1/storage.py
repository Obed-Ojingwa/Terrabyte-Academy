import mimetypes

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import get_current_user
from app.database import get_db
from app.models.course import Lesson, Material
from app.services.course_access_service import require_course_access
from app.services.storage_service import StorageService

router = APIRouter(prefix="/storage", tags=["Storage"])
optional_bearer = HTTPBearer(auto_error=False)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    storage = StorageService()
    key = f"uploads/{current_user.id}/{file.filename}"
    try:
        contents = await file.read()
        storage.upload_file(key, contents, file.content_type)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to upload file") from exc
    return {"key": key, "url": storage.get_public_url(key)}


@router.get("/{storage_key:path}")
async def serve_storage_file(
    storage_key: str,
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: AsyncSession = Depends(get_db),
):
    normalized_key = storage_key.lstrip("/")
    if normalized_key.startswith("materials/"):
        if credentials is None:
            raise HTTPException(status_code=401, detail="Authentication required")
        current_user = await get_current_user(credentials, db)
        material = (
            await db.execute(
                select(Material)
                .where(Material.s3_key == normalized_key)
                .options(joinedload(Material.lesson).joinedload(Lesson.module))
            )
        ).scalar_one_or_none()
        if not material:
            raise HTTPException(status_code=404, detail="Course material not found")
        await require_course_access(db, current_user, material.lesson.module.course_id)

    try:
        contents = StorageService().download_file(normalized_key)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="File not found") from exc
    return Response(
        content=contents,
        media_type=mimetypes.guess_type(normalized_key)[0] or "application/octet-stream",
    )
