from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.models.user import UserRole, UserStatus
from typing import Any, Optional


class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.EMPLOYEE
    company_name: Optional[str] = None
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    must_change_password: bool = False
    user: "UserResponse"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    status: UserStatus
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    is_verified: bool
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    current_experience: Optional[dict] = None
    past_experience: Optional[list] = None
    education: Optional[list] = None
    skills: Optional[list] = None
    hobbies: Optional[list] = None
    profile_completed: bool = False
    must_change_password: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    avatar_url: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    current_experience: Optional[dict] = None
    past_experience: Optional[list] = None
    education: Optional[list] = None
    skills: Optional[list] = None
    hobbies: Optional[list] = None
    profile_completed: Optional[bool] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class PublicProfileResponse(BaseModel):
    id: str
    full_name: str
    headline: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    company_name: Optional[str] = None
    role: UserRole
    skills: Optional[list] = None
    education: Optional[list] = None
    current_experience: Optional[dict] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    connection_count: int = 0
    follower_count: int = 0

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    status: Optional[UserStatus] = None
    role: Optional[UserRole] = None
    is_verified: Optional[bool] = None
