from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.api.deps import require_admin
from app.models.blog import BlogPost

router = APIRouter(prefix="/blog", tags=["Blog"])

@router.get("/")
async def list_posts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BlogPost).where(BlogPost.is_published == True).order_by(BlogPost.published_at.desc()))
    posts = result.scalars().all()
    return {"items": [{"id": str(p.id), "title": p.title, "slug": p.slug, "excerpt": p.excerpt, "cover_url": p.cover_url, "category": p.category, "published_at": p.published_at} for p in posts]}

@router.get("/{slug}")
async def get_post(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"id": str(post.id), "title": post.title, "content": post.content, "cover_url": post.cover_url, "published_at": post.published_at}
