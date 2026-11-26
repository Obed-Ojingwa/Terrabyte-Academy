from uuid import uuid4
import mimetypes

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import get_current_user, require_admin
from app.database import get_db
from app.models.course import Lesson, Material
from app.services.course_access_service import require_course_access
from app.services.storage_service import StorageService

router = APIRouter(prefix="/storage", tags=["Storage"])
optional_bearer = HTTPBearer(auto_error=False)
MAX_COURSE_THUMBNAIL_SIZE = 5 * 1024 * 1024
COURSE_THUMBNAIL_FORMATS = {
    "image/jpeg": (".jpg", lambda content: content.startswith(b"\xff\xd8\xff")),
    "image/png": (".png", lambda content: content.startswith(b"\x89PNG\r\n\x1a\n")),
    "image/webp": (
        ".webp",
        lambda content: len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP",
    ),
}


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


@router.post("/course-thumbnail")
async def upload_course_thumbnail(
    file: UploadFile = File(...),
    current_user=Depends(require_admin),
):
    content_type = (file.content_type or "").lower()
    image_format = COURSE_THUMBNAIL_FORMATS.get(content_type)
    if image_format is None:
        raise HTTPException(status_code=415, detail="Course thumbnails must be JPEG, PNG, or WebP images")

    contents = await file.read(MAX_COURSE_THUMBNAIL_SIZE + 1)
    if len(contents) > MAX_COURSE_THUMBNAIL_SIZE:
        raise HTTPException(status_code=413, detail="Course thumbnails must be 5 MB or smaller")
    if not contents or not image_format[1](contents):
        raise HTTPException(status_code=415, detail="The uploaded file does not match its image type")

    key = f"course-thumbnails/{current_user.id}/{uuid4().hex}{image_format[0]}"
    try:
        storage = StorageService()
        storage.upload_file(key, contents, content_type)
        url = storage.get_public_url(key)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to upload course thumbnail") from exc

    return {"key": key, "url": url}


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
