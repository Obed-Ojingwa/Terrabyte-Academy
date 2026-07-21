from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from uuid import UUID

from app.api.deps import get_current_user
from app.database import get_db
from app.models.forum import ForumReply, ForumThread
from app.schemas.forum import ForumReplyCreate, ForumReplyResponse, ForumThreadCreate, ForumThreadResponse

router = APIRouter(prefix="/forum", tags=["Forum"])


@router.get("/threads", response_model=list[ForumThreadResponse])
async def list_threads(
    course_id: UUID = Query(None, description="Filter by course ID"),
    is_question: bool = Query(None, description="Filter by question threads"),
    db: AsyncSession = Depends(get_db),
):
    query = select(ForumThread).options(joinedload(ForumThread.replies))
    if course_id is not None:
        query = query.where(ForumThread.course_id == course_id)
    if is_question is not None:
        query = query.where(ForumThread.is_question == is_question)
    query = query.order_by(ForumThread.is_pinned.desc(), ForumThread.created_at.desc())
    result = await db.execute(query)
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