from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.event import Event

router = APIRouter(prefix="/events", tags=["Events"])

@router.get("/")
async def list_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).order_by(Event.start_date))
    events = result.scalars().all()
    return {"items": [{"id": str(e.id), "title": e.title, "type": e.type, "start_date": e.start_date, "end_date": e.end_date, "is_online": e.is_online, "link": e.link, "location": e.location} for e in events]}
