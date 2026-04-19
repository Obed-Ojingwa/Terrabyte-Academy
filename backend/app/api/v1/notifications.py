from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.api.deps import get_current_user
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/")
async def get_notifications(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(50))
    notifs = result.scalars().all()
    return {"items": [{"id": str(n.id), "title": n.title, "body": n.body, "type": n.type, "is_read": n.is_read, "link": n.link, "created_at": n.created_at} for n in notifs]}

@router.put("/{notif_id}/read")
async def mark_read(notif_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(update(Notification).where(Notification.id == notif_id, Notification.user_id == current_user.id).values(is_read=True))
    await db.commit()
    return {"message": "Marked as read"}

@router.put("/read-all/all")
async def mark_all_read(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(update(Notification).where(Notification.user_id == current_user.id).values(is_read=True))
    await db.commit()
    return {"message": "All notifications marked as read"}
