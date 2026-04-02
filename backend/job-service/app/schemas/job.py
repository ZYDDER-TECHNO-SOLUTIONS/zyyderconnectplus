from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.job import JobStatus, JobType, ExperienceLevel, ApplicationStatus


class JobCreate(BaseModel):
    title: str
    description: str
    requirements: str
    responsibilities: Optional[str] = None
    location: str
    job_type: JobType
    experience_level: ExperienceLevel
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "USD"
    skills_required: List[str] = []
    benefits: List[str] = []
    application_deadline: Optional[datetime] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    responsibilities: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[JobType] = None
    experience_level: Optional[ExperienceLevel] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    skills_required: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    status: Optional[JobStatus] = None
    application_deadline: Optional[datetime] = None


class JobResponse(BaseModel):
    id: str
    employer_id: str
    company_name: str
    title: str
    description: str
    requirements: str
    responsibilities: Optional[str]
    location: str
    job_type: JobType
    experience_level: ExperienceLevel
    salary_min: Optional[int]
    salary_max: Optional[int]
    salary_currency: str
    skills_required: List[str]
    benefits: List[str]
    status: JobStatus
    is_featured: bool
    application_deadline: Optional[datetime]
    views_count: int
    applications_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationCreate(BaseModel):
    resume_id: Optional[str] = None
    cover_letter: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    employer_notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    applicant_id: str
    resume_id: Optional[str]
    cover_letter: Optional[str]
    status: ApplicationStatus
    ai_match_score: Optional[float]
    ai_analysis: Optional[dict]
    employer_notes: Optional[str]
    applied_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobSearchParams(BaseModel):
    q: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[JobType] = None
    experience_level: Optional[ExperienceLevel] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    skills: Optional[List[str]] = None
    page: int = 1
    limit: int = 20
