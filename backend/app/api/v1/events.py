from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.api.deps import require_admin
from app.models.event import Event
from app.schemas.content import EventCreate, EventResponse, EventUpdate
from app.core.cache import TTLCache
from app.models.course import Course
from app.api.deps import get_current_user, require_tutor

router = APIRouter(prefix="/events", tags=["Events"])
_events_cache = TTLCache(ttl_seconds=60)


@router.get("/", response_model=list[EventResponse])
async def list_events(db: AsyncSession = Depends(get_db)):
    cached = _events_cache.get("events:list")
    if cached is not None:
        return cached
    result = await db.execute(select(Event).order_by(Event.start_date))
    events = result.scalars().all()
    _events_cache.set("events:list", events)
    return events


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: str, db: AsyncSession = Depends(get_db)):
    cached = _events_cache.get(f"events:{event_id}")
    if cached is not None:
        return cached
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    _events_cache.set(f"events:{event_id}", event)
    return event


@router.post("/", response_model=EventResponse, status_code=201)
async def create_event(payload: EventCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Allow admins and tutors to create events. If course_id provided, ensure tutor is assigned to course.
    if payload.course_id is not None:
        course_result = await db.execute(select(Course).where(Course.id == payload.course_id))
        course = course_result.scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        if current_user.role.name not in {"super_admin", "admin"}:
            if current_user.role.name != "tutor" or course.tutor_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to create event for this course")

    if current_user.role.name in {"super_admin", "admin"}:
        created_by = current_user.id
    else:
        # tutors create events for their courses
        created_by = current_user.id

    event = Event(**payload.model_dump(), created_by=created_by)
    db.add(event)
    await db.commit()
    await db.refresh(event)
    # invalidate cache
    _events_cache.delete("events:list")
    return event


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, payload: EventUpdate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # authorization: admins can update all; tutors can update events tied to their course
    if current_user.role.name not in {"super_admin", "admin"}:
        if current_user.role.name != "tutor":
            raise HTTPException(status_code=403, detail="Not authorized")
        if event.course_id is None:
            raise HTTPException(status_code=403, detail="Not authorized to update this event")
        course_result = await db.execute(select(Course).where(Course.id == event.course_id))
        course = course_result.scalar_one_or_none()
        if not course or course.tutor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    await db.commit()
    await db.refresh(event)
    _events_cache.delete("events:list")
    return event


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: str, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
