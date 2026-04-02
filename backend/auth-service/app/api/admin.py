from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, AdminUserUpdate
from app.utils.security import require_roles

router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles(UserRole.SUPERADMIN)),
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if status:
        query = query.where(User.status == status)
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    payload: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles(UserRole.SUPERADMIN)),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles(UserRole.SUPERADMIN)),
):
    total = await db.execute(select(func.count(User.id)))
    employers = await db.execute(select(func.count(User.id)).where(User.role == UserRole.EMPLOYER))
    employees = await db.execute(select(func.count(User.id)).where(User.role == UserRole.EMPLOYEE))
    return {
        "total_users": total.scalar(),
        "total_employers": employers.scalar(),
        "total_employees": employees.scalar(),
    }
