from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.follow import Follow
from app.utils.security import get_current_user

router = APIRouter()


class FollowUserResponse(BaseModel):
    follow_id: str
    user_id: str
    full_name: str
    email: str
    headline: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FollowStatusResponse(BaseModel):
    is_following: bool


class FollowCountResponse(BaseModel):
    follower_count: int
    following_count: int


@router.post("/{user_id}")
async def follow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    # Check target user exists
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already following
    result = await db.execute(
        select(Follow).where(
            and_(Follow.follower_id == current_user.id, Follow.following_id == user_id)
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Already following this user")

    follow = Follow(
        follower_id=current_user.id,
        following_id=user_id,
    )
    db.add(follow)
    await db.flush()
    return {"message": "Successfully followed user", "follow_id": follow.id}


@router.delete("/{user_id}")
async def unfollow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Follow).where(
            and_(Follow.follower_id == current_user.id, Follow.following_id == user_id)
        )
    )
    follow = result.scalar_one_or_none()
    if not follow:
        raise HTTPException(status_code=404, detail="Not following this user")

    await db.delete(follow)
    await db.flush()
    return {"message": "Successfully unfollowed user"}


@router.get("/following", response_model=list[FollowUserResponse])
async def list_following(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Follow.id.label("follow_id"),
            User.id.label("user_id"),
            User.full_name,
            User.email,
            User.headline,
            User.avatar_url,
            Follow.created_at,
        )
        .join(User, User.id == Follow.following_id)
        .where(Follow.follower_id == current_user.id)
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        FollowUserResponse(
            follow_id=row.follow_id,
            user_id=row.user_id,
            full_name=row.full_name,
            email=row.email,
            headline=row.headline,
            avatar_url=row.avatar_url,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.get("/followers", response_model=list[FollowUserResponse])
async def list_followers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Follow.id.label("follow_id"),
            User.id.label("user_id"),
            User.full_name,
            User.email,
            User.headline,
            User.avatar_url,
            Follow.created_at,
        )
        .join(User, User.id == Follow.follower_id)
        .where(Follow.following_id == current_user.id)
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        FollowUserResponse(
            follow_id=row.follow_id,
            user_id=row.user_id,
            full_name=row.full_name,
            email=row.email,
            headline=row.headline,
            avatar_url=row.avatar_url,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.get("/status/{user_id}", response_model=FollowStatusResponse)
async def get_follow_status(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Follow).where(
            and_(Follow.follower_id == current_user.id, Follow.following_id == user_id)
        )
    )
    follow = result.scalar_one_or_none()
    return FollowStatusResponse(is_following=follow is not None)


@router.get("/count/{user_id}", response_model=FollowCountResponse)
async def get_follow_counts(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Follower count
    result = await db.execute(
        select(func.count()).select_from(Follow).where(Follow.following_id == user_id)
    )
    follower_count = result.scalar() or 0

    # Following count
    result = await db.execute(
        select(func.count()).select_from(Follow).where(Follow.follower_id == user_id)
    )
    following_count = result.scalar() or 0

    return FollowCountResponse(follower_count=follower_count, following_count=following_count)
