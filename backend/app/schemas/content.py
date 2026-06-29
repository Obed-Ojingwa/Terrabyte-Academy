from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class BlogPostResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_url: Optional[str] = None
    category: Optional[str] = None
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BlogPostCreate(BaseModel):
    title: str
    slug: str
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_url: Optional[str] = None
    category: Optional[str] = None
    is_published: bool = False


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_url: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None


class EventResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    link: Optional[str] = None
    is_online: bool
    created_by: Optional[UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    link: Optional[str] = None
    is_online: bool = True


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    link: Optional[str] = None
    is_online: Optional[bool] = None
