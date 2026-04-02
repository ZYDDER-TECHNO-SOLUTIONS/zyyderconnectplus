from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from starlette.requests import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
import re
import secrets
import string

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, TokenResponse, RefreshTokenRequest, UserResponse
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from app.utils.email_service import send_welcome_email, send_reset_email

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r'[A-Z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    if not re.search(r'[0-9]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character")


def generate_random_password(length: int = 12) -> str:
    """Generate a strong random password."""
    chars = string.ascii_letters + string.digits + "!@#$%&*"
    while True:
        pwd = ''.join(secrets.choice(chars) for _ in range(length))
        # Ensure it meets validation rules
        if (re.search(r'[A-Z]', pwd) and re.search(r'[a-z]', pwd)
                and re.search(r'[0-9]', pwd) and re.search(r'[!@#$%&*]', pwd)):
            return pwd


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("3/minute")
async def register(request: Request, payload: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate random password
    raw_password = generate_random_password()

    user = User(
        email=payload.email,
        hashed_password=hash_password(raw_password),
        full_name=payload.full_name,
        role=payload.role,
        company_name=payload.company_name,
        phone=payload.phone,
        must_change_password=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    # Send welcome email with generated credentials
    await send_welcome_email(user.full_name, user.email, raw_password, user.role.value)

    return user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, payload: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check account lockout
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(status_code=403, detail="Account temporarily locked")

    if not verify_password(payload.password, user.hashed_password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is not active")

    # Reset lockout on successful login
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()

    token_data = {"sub": user.id, "email": user.email, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        must_change_password=user.must_change_password,
        user=user,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    decoded = decode_token(payload.refresh_token)
    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == decoded["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token_data = {"sub": user.id, "email": user.email, "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=user,
    )


@router.post("/set-first-password")
@limiter.limit("5/minute")
async def set_first_password(request: Request, payload: dict, db: AsyncSession = Depends(get_db)):
    """First-time password setup. User provides email, temp password, and new password."""
    email = payload.get("email", "")
    temp_password = payload.get("temp_password", "")
    new_password = payload.get("new_password", "")

    if not email or not temp_password or not new_password:
        raise HTTPException(status_code=400, detail="Email, temporary password, and new password are required")

    validate_password(new_password)

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(temp_password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or temporary password")

    if not user.must_change_password:
        raise HTTPException(status_code=400, detail="Password has already been set")

    user.hashed_password = hash_password(new_password)
    user.must_change_password = False

    token_data = {"sub": user.id, "email": user.email, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, payload: dict, db: AsyncSession = Depends(get_db)):
    """Send a password reset code to the user's email."""
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If an account with that email exists, a reset code has been sent."}

    # Generate 6-digit code
    reset_code = ''.join(secrets.choice(string.digits) for _ in range(6))
    user.reset_token = reset_code
    user.reset_token_expires = datetime.utcnow() + timedelta(minutes=15)

    await send_reset_email(user.full_name, user.email, reset_code)
    return {"message": "If an account with that email exists, a reset code has been sent."}


@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(request: Request, payload: dict, db: AsyncSession = Depends(get_db)):
    """Reset password using the code sent via email."""
    email = payload.get("email", "").strip().lower()
    code = payload.get("code", "").strip()
    new_password = payload.get("new_password", "")

    if not email or not code or not new_password:
        raise HTTPException(status_code=400, detail="Email, code, and new password are required")

    validate_password(new_password)

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not user.reset_token or user.reset_token != code:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    user.must_change_password = False
    user.failed_login_attempts = 0
    user.locked_until = None

    return {"message": "Password has been reset successfully. You can now log in."}


@router.post("/google")
async def google_auth(request: Request, payload: dict, db: AsyncSession = Depends(get_db)):
    """Sign in or sign up with Google. Expects {credential: <google_id_token>, role?: 'employee'|'employer'}."""
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    from app.config import settings
    from app.models.user import UserRole, UserStatus

    credential = payload.get("credential", "")
    role = payload.get("role", "employee")

    if not credential:
        raise HTTPException(status_code=400, detail="Google credential is required")

    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google Sign-In is not configured")

    # Verify the Google ID token
    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_email = idinfo.get("email", "").lower()
    google_name = idinfo.get("name", "")
    google_picture = idinfo.get("picture", "")

    if not google_email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    # Check if user already exists
    result = await db.execute(select(User).where(User.email == google_email))
    user = result.scalar_one_or_none()

    if user:
        # Existing user — just log them in
        if user.status != "active":
            raise HTTPException(status_code=403, detail="Account is not active")

        user.last_login = datetime.utcnow()
        if google_picture and not user.avatar_url:
            user.avatar_url = google_picture
    else:
        # New user — create account
        user = User(
            email=google_email,
            hashed_password=hash_password(generate_random_password()),
            full_name=google_name or google_email.split("@")[0],
            role=UserRole(role) if role in ("employee", "employer") else UserRole.EMPLOYEE,
            status=UserStatus.ACTIVE,
            is_verified=True,
            must_change_password=False,
            profile_completed=False,
            avatar_url=google_picture or None,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

    token_data = {"sub": user.id, "email": user.email, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        must_change_password=False,
        user=user,
    )


@router.get("/verify")
async def verify_token(token: str, db: AsyncSession = Depends(get_db)):
    """Internal endpoint for other services to verify tokens"""
    payload = decode_token(token)
    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"valid": True, "user_id": user.id, "role": user.role, "email": user.email}
