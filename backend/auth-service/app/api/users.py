import base64

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.database import get_db
from app.models.user import User
from app.models.connection import Connection, ConnectionStatus
from app.models.follow import Follow
from app.schemas.user import UserResponse, UserUpdate, PasswordChange, PublicProfileResponse
from app.utils.security import get_current_user, hash_password, verify_password

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.add(current_user)
    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.post("/me/change-password")
async def change_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    db.add(current_user)
    return {"message": "Password updated successfully"}


@router.get("/profile/{user_id}", response_model=PublicProfileResponse)
async def get_public_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Connection count (accepted connections in either direction)
    conn_count_result = await db.execute(
        select(func.count()).select_from(Connection).where(
            and_(
                Connection.status == ConnectionStatus.ACCEPTED,
                (Connection.sender_id == user_id) | (Connection.receiver_id == user_id),
            )
        )
    )
    connection_count = conn_count_result.scalar() or 0

    # Follower count
    follower_count_result = await db.execute(
        select(func.count()).select_from(Follow).where(Follow.following_id == user_id)
    )
    follower_count = follower_count_result.scalar() or 0

    return PublicProfileResponse(
        id=user.id,
        full_name=user.full_name,
        headline=user.headline,
        avatar_url=user.avatar_url,
        company_name=user.company_name,
        role=user.role,
        skills=user.skills,
        education=user.education,
        current_experience=user.current_experience,
        location=user.location,
        bio=user.bio,
        linkedin_url=user.linkedin_url,
        github_url=user.github_url,
        portfolio_url=user.portfolio_url,
        connection_count=connection_count,
        follower_count=follower_count,
    )


@router.get("/people")
async def discover_people(
    q: str = "",
    role: str = "",
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Browse and search for users to connect with."""
    from app.models.user import UserRole
    query = select(User).where(
        User.id != current_user.id,
        User.status == "active",
        User.role != UserRole.SUPERADMIN,
    )

    if q:
        query = query.where(
            (User.full_name.ilike(f"%{q}%"))
            | (User.headline.ilike(f"%{q}%"))
            | (User.company_name.ilike(f"%{q}%"))
        )
    if role and role in ("employee", "employer"):
        query = query.where(User.role == role)

    query = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role.value if hasattr(u.role, "value") else u.role,
            "headline": u.headline,
            "avatar_url": u.avatar_url,
            "company_name": u.company_name,
            "location": u.location,
            "skills": u.skills or [],
        }
        for u in users
    ]


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload profile photo. Max 2MB, images only."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 2MB")

    b64 = base64.b64encode(content).decode()
    data_uri = f"data:{file.content_type};base64,{b64}"

    current_user.avatar_url = data_uri
    return {"avatar_url": data_uri}


@router.post("/me/banner")
async def upload_banner(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload profile banner. Max 3MB, images only."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    content = await file.read()
    if len(content) > 3 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 3MB")

    b64 = base64.b64encode(content).decode()
    data_uri = f"data:{file.content_type};base64,{b64}"

    current_user.banner_url = data_uri
    return {"banner_url": data_uri}


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
