import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, Boolean, DateTime, Enum as SAEnum, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"
    EXPIRED = "expired"


class JobType(str, enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    REMOTE = "remote"
    HYBRID = "hybrid"


class ExperienceLevel(str, enum.Enum):
    ENTRY = "entry"
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    LEAD = "lead"
    EXECUTIVE = "executive"


class ApplicationStatus(str, enum.Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    TECHNICAL = "technical"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employer_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=False)
    responsibilities: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    job_type: Mapped[JobType] = mapped_column(SAEnum(JobType), nullable=False)
    experience_level: Mapped[ExperienceLevel] = mapped_column(SAEnum(ExperienceLevel), nullable=False)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_currency: Mapped[str] = mapped_column(String(10), default="USD")
    skills_required: Mapped[list] = mapped_column(JSON, default=list)
    benefits: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[JobStatus] = mapped_column(SAEnum(JobStatus), default=JobStatus.ACTIVE)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    application_deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    views_count: Mapped[int] = mapped_column(Integer, default=0)
    applications_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class JobApplication(Base):
    __tablename__ = "job_applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    applicant_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    resume_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    cover_letter: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ApplicationStatus] = mapped_column(SAEnum(ApplicationStatus), default=ApplicationStatus.APPLIED)
    ai_match_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_analysis: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    employer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    applied_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
