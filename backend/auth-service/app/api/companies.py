import re
import base64

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserRole
from app.models.company import Company
from app.utils.security import get_current_user

router = APIRouter()


def generate_slug(name: str) -> str:
    """Generate a URL-friendly slug from a company name."""
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


async def _get_unique_slug(db: AsyncSession, name: str) -> str:
    """Generate a unique slug, appending a number if needed."""
    base_slug = generate_slug(name)
    slug = base_slug
    counter = 1
    while True:
        result = await db.execute(select(Company).where(Company.slug == slug))
        if result.scalar_one_or_none() is None:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


async def _get_company_for_owner(db: AsyncSession, slug: str, owner_id: str) -> Company:
    """Fetch a company by slug and verify ownership."""
    result = await db.execute(select(Company).where(Company.slug == slug))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="You are not the owner of this company")
    return company


@router.post("")
async def create_company(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a company page. Employer only, one per employer."""
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Only employers can create company pages")

    # Check if employer already has a company
    existing = await db.execute(
        select(Company).where(Company.owner_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already have a company page")

    name = payload.get("name", "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Company name is required")

    slug = await _get_unique_slug(db, name)

    company = Company(
        owner_id=current_user.id,
        name=name,
        slug=slug,
        description=payload.get("description"),
        industry=payload.get("industry"),
        company_size=payload.get("company_size"),
        website=payload.get("website"),
        location=payload.get("location"),
        founded_year=payload.get("founded_year"),
        specialties=payload.get("specialties"),
    )
    db.add(company)
    await db.flush()
    await db.refresh(company)

    return _company_to_dict(company)


@router.get("")
async def list_companies(
    q: str = "",
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """List all companies (public)."""
    query = select(Company)

    if q:
        query = query.where(
            (Company.name.ilike(f"%{q}%"))
            | (Company.industry.ilike(f"%{q}%"))
            | (Company.location.ilike(f"%{q}%"))
        )

    query = query.order_by(Company.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    companies = result.scalars().all()

    return [_company_to_dict(c) for c in companies]


@router.get("/{slug}")
async def get_company(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get company by slug (public)."""
    result = await db.execute(select(Company).where(Company.slug == slug))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return _company_to_dict(company)


@router.put("/{slug}")
async def update_company(
    slug: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update company (owner only)."""
    company = await _get_company_for_owner(db, slug, current_user.id)

    allowed_fields = {
        "name", "description", "industry", "company_size",
        "website", "location", "founded_year", "specialties",
    }
    for field, value in payload.items():
        if field in allowed_fields:
            setattr(company, field, value)

    # If name changed, update slug
    if "name" in payload and payload["name"].strip():
        new_slug = await _get_unique_slug(db, payload["name"])
        company.slug = new_slug

    await db.flush()
    await db.refresh(company)
    return _company_to_dict(company)


@router.post("/{slug}/logo")
async def upload_company_logo(
    slug: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload company logo. Max 2MB, images only."""
    company = await _get_company_for_owner(db, slug, current_user.id)

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 2MB")

    b64 = base64.b64encode(content).decode()
    data_uri = f"data:{file.content_type};base64,{b64}"

    company.logo_url = data_uri
    await db.flush()
    return {"logo_url": data_uri}


@router.post("/{slug}/banner")
async def upload_company_banner(
    slug: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload company banner. Max 3MB, images only."""
    company = await _get_company_for_owner(db, slug, current_user.id)

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    content = await file.read()
    if len(content) > 3 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 3MB")

    b64 = base64.b64encode(content).decode()
    data_uri = f"data:{file.content_type};base64,{b64}"

    company.banner_url = data_uri
    await db.flush()
    return {"banner_url": data_uri}


@router.get("/{slug}/followers")
async def get_company_followers(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get follower count for a company."""
    result = await db.execute(select(Company).where(Company.slug == slug))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Return the owner_id so frontend can use the follows system
    return {
        "company_slug": slug,
        "owner_id": company.owner_id,
        "message": "Use /follows endpoints with owner_id to manage company follows",
    }


@router.get("/{slug}/jobs")
async def get_company_jobs(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Get company's jobs. Returns owner user_id for frontend to filter via job-service."""
    result = await db.execute(select(Company).where(Company.slug == slug))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return {
        "company_slug": slug,
        "owner_id": company.owner_id,
        "message": "Use job-service with employer_id filter to fetch jobs",
    }


def _company_to_dict(company: Company) -> dict:
    """Convert a Company model to a dictionary."""
    return {
        "id": company.id,
        "owner_id": company.owner_id,
        "name": company.name,
        "slug": company.slug,
        "description": company.description,
        "industry": company.industry,
        "company_size": company.company_size,
        "website": company.website,
        "location": company.location,
        "logo_url": company.logo_url,
        "banner_url": company.banner_url,
        "founded_year": company.founded_year,
        "specialties": company.specialties or [],
        "created_at": company.created_at.isoformat() if company.created_at else None,
        "updated_at": company.updated_at.isoformat() if company.updated_at else None,
    }
