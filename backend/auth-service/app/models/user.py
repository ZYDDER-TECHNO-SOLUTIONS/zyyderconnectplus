import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, Enum as SAEnum, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    SUPERADMIN = "superadmin"
    EMPLOYER = "employer"
    EMPLOYEE = "employee"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    status: Mapped[UserStatus] = mapped_column(SAEnum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    banner_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    headline: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    github_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    portfolio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    current_experience: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # {title, company, location, start_date, is_current}
    past_experience: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # [{title, company, location, start_date, end_date}]
    education: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # [{degree, institution, field, start_year, end_year}]
    skills: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # ["Python", "React", ...]
    hobbies: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # ["Reading", "Gaming", ...]
    profile_completed: Mapped[bool] = mapped_column(default=False, nullable=False)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reset_token: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reset_token_expires: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
