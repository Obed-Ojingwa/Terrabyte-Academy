from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.services.storage_service import StorageService

router = APIRouter(prefix="/storage", tags=["Storage"])


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
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"key": key, "url": storage.get_public_url(key)}
