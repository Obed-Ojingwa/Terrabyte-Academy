from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import get_current_user
from app.database import get_db
from app.models.forum import ForumReply, ForumThread
from app.schemas.forum import ForumReplyCreate, ForumReplyResponse, ForumThreadCreate, ForumThreadResponse

router = APIRouter(prefix="/forum", tags=["Forum"])


@router.get("/threads", response_model=list[ForumThreadResponse])
async def list_threads(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ForumThread)
        .options(joinedload(ForumThread.replies))
        .order_by(ForumThread.is_pinned.desc(), ForumThread.created_at.desc())
    )
    return result.scalars().all()


@router.post("/threads", response_model=ForumThreadResponse, status_code=201)
async def create_thread(payload: ForumThreadCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    thread = ForumThread(**payload.model_dump(), author_id=current_user.id)
    db.add(thread)
    await db.commit()
    await db.refresh(thread)
    return thread


@router.post("/threads/{thread_id}/replies", response_model=ForumReplyResponse, status_code=201)
async def create_reply(thread_id: str, payload: ForumReplyCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ForumThread).where(ForumThread.id == thread_id))
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    reply = ForumReply(thread_id=thread.id, author_id=current_user.id, body=payload.body)
    db.add(reply)
    await db.commit()
    await db.refresh(reply)
    return reply
