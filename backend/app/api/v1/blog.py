from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.blog import BlogPost
from app.schemas.content import BlogPostCreate, BlogPostResponse, BlogPostUpdate
from app.core.cache import TTLCache

router = APIRouter(prefix="/blog", tags=["Blog"])
_blog_cache = TTLCache(ttl_seconds=60)


@router.get("/", response_model=list[BlogPostResponse])
async def list_posts(db: AsyncSession = Depends(get_db)):
    cached = _blog_cache.get("blog:list")
    if cached is not None:
        return cached
    result = await db.execute(select(BlogPost).options(joinedload(BlogPost.author)).where(BlogPost.is_published == True).order_by(BlogPost.published_at.desc()))
    posts = result.scalars().all()
    _blog_cache.set("blog:list", posts)
    return posts


@router.get("/{slug}", response_model=BlogPostResponse)
async def get_post(slug: str, db: AsyncSession = Depends(get_db)):
    cached = _blog_cache.get(f"blog:{slug}")
    if cached is not None:
        return cached
    result = await db.execute(select(BlogPost).options(joinedload(BlogPost.author)).where(BlogPost.slug == slug))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    _blog_cache.set(f"blog:{slug}", post)
    return post


@router.post("/", response_model=BlogPostResponse, status_code=201)
async def create_post(payload: BlogPostCreate, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    post = BlogPost(**payload.model_dump(), author_id=current_user.id)
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


@router.put("/{slug}", response_model=BlogPostResponse)
async def update_post(slug: str, payload: BlogPostUpdate, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    await db.commit()
    await db.refresh(post)
    return post


@router.delete("/{slug}", status_code=204)
async def delete_post(slug: str, current_user=Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.delete(post)
    await db.commit()
