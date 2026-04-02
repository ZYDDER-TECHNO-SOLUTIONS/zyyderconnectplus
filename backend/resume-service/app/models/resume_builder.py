import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.models.resume import Base


class ResumeBuilder(Base):
    __tablename__ = "resume_builders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    template: Mapped[str] = mapped_column(String(50), default="professional", nullable=False)

    # Personal Info
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    portfolio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Professional Summary
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Structured Data (stored as JSON)
    work_experience: Mapped[list] = mapped_column(JSON, default=list)
    # Each entry: {title, company, location, start_date, end_date, is_current, description, highlights: []}

    education: Mapped[list] = mapped_column(JSON, default=list)
    # Each entry: {degree, field_of_study, institution, location, start_year, end_year, gpa, achievements: []}

    skills: Mapped[dict] = mapped_column(JSON, default=dict)
    # {technical: [], soft: [], tools: [], languages_programming: []}

    projects: Mapped[list] = mapped_column(JSON, default=list)
    # Each entry: {title, description, technologies: [], url, start_date, end_date}

    certifications: Mapped[list] = mapped_column(JSON, default=list)
    # Each entry: {name, issuing_organization, issue_date, expiry_date, credential_url}

    languages: Mapped[list] = mapped_column(JSON, default=list)
    # Each entry: {language, proficiency} (proficiency: native, fluent, advanced, intermediate, basic)

    awards: Mapped[list] = mapped_column(JSON, default=list)
    # Each entry: {title, issuer, date, description}

    volunteer_experience: Mapped[list] = mapped_column(JSON, default=list)
    # Each entry: {role, organization, start_date, end_date, description}

    references: Mapped[list] = mapped_column(JSON, default=list)
    # Each entry: {name, title, company, email, phone, relationship}

    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
