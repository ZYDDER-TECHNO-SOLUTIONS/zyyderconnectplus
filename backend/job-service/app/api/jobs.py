from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.job import Job, JobApplication, JobStatus
from app.schemas.job import JobCreate, JobUpdate, JobResponse, ApplicationCreate, ApplicationResponse, ApplicationUpdate
from app.utils.auth import get_current_user, require_roles, CurrentUser
from app.services.ai_service import analyze_job_match, generate_job_description

router = APIRouter()


# ─── Jobs CRUD ────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    q: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    salary_min: Optional[int] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Job).where(Job.status == JobStatus.ACTIVE)
    if q:
        query = query.where(or_(Job.title.ilike(f"%{q}%"), Job.description.ilike(f"%{q}%")))
    if location:
        query = query.where(Job.location.ilike(f"%{location}%"))
    if job_type:
        query = query.where(Job.job_type == job_type)
    if experience_level:
        query = query.where(Job.experience_level == experience_level)
    if salary_min:
        query = query.where(Job.salary_min >= salary_min)
    query = query.order_by(Job.is_featured.desc(), Job.created_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=JobResponse, status_code=201)
async def create_job(
    payload: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("employer", "superadmin")),
):
    job = Job(
        employer_id=current_user.id,
        company_name=current_user.email.split("@")[1] if "@" in current_user.email else "Company",
        **payload.model_dump(),
    )
    db.add(job)
    await db.flush()
    await db.refresh(job)
    return job


@router.get("/my-jobs", response_model=List[JobResponse])
async def get_my_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("employer", "superadmin")),
):
    result = await db.execute(select(Job).where(Job.employer_id == current_user.id).order_by(Job.created_at.desc()))
    return result.scalars().all()


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.views_count += 1
    return job


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: str,
    payload: JobUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("employer", "superadmin")),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.employer_id != current_user.id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(job, field, value)
    db.add(job)
    await db.flush()
    await db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=204)
async def delete_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("employer", "superadmin")),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.employer_id != current_user.id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.delete(job)


# ─── AI Job Description Generator ─────────────────────────────────────────────

@router.post("/ai/generate-description")
async def ai_generate_description(
    title: str, company: str, skills: List[str], job_type: str,
    _=Depends(require_roles("employer", "superadmin")),
):
    return await generate_job_description(title, company, skills, job_type)


# ─── Applications ─────────────────────────────────────────────────────────────

@router.post("/{job_id}/apply", response_model=ApplicationResponse, status_code=201)
async def apply_to_job(
    job_id: str,
    payload: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("employee")),
):
    result = await db.execute(select(Job).where(Job.id == job_id, Job.status == JobStatus.ACTIVE))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or not active")

    existing = await db.execute(
        select(JobApplication).where(
            JobApplication.job_id == job_id,
            JobApplication.applicant_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already applied to this job")

    application = JobApplication(
        job_id=job_id,
        applicant_id=current_user.id,
        resume_id=payload.resume_id,
        cover_letter=payload.cover_letter,
    )
    db.add(application)
    job.applications_count += 1
    await db.flush()
    await db.refresh(application)
    return application


@router.get("/{job_id}/applications", response_model=List[ApplicationResponse])
async def get_applications(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("employer", "superadmin")),
):
    result = await db.execute(
        select(JobApplication).where(JobApplication.job_id == job_id).order_by(JobApplication.applied_at.desc())
    )
    return result.scalars().all()


@router.get("/my-applications/list", response_model=List[ApplicationResponse])
async def my_applications(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("employee")),
):
    result = await db.execute(
        select(JobApplication).where(JobApplication.applicant_id == current_user.id).order_by(JobApplication.applied_at.desc())
    )
    return result.scalars().all()


@router.patch("/applications/{app_id}", response_model=ApplicationResponse)
async def update_application(
    app_id: str,
    payload: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("employer", "superadmin")),
):
    result = await db.execute(select(JobApplication).where(JobApplication.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(app, field, value)
    db.add(app)
    await db.flush()
    await db.refresh(app)
    return app
