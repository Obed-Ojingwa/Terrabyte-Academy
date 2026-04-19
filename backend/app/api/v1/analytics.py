from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.api.deps import get_current_user, require_admin
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/student/stats")
async def student_stats(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await AnalyticsService(db).get_student_stats(str(current_user.id))

@router.get("/admin")
async def admin_stats(current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    return await AnalyticsService(db).get_admin_stats()
