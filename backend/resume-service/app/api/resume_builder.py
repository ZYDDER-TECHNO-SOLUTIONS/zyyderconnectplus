import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.models.resume import get_db
from app.models.resume_builder import ResumeBuilder
from app.services.ai_service import client
from app.utils.auth import get_current_user, CurrentUser

router = APIRouter()


# --------------- Schemas ---------------

class ResumeBuilderCreate(BaseModel):
    template: str = "professional"
    full_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    summary: Optional[str] = None
    work_experience: list = []
    education: list = []
    skills: dict = {}
    projects: list = []
    certifications: list = []
    languages: list = []
    awards: list = []
    volunteer_experience: list = []
    references: list = []
    is_public: bool = False


class ResumeBuilderUpdate(BaseModel):
    template: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    summary: Optional[str] = None
    work_experience: Optional[list] = None
    education: Optional[list] = None
    skills: Optional[dict] = None
    projects: Optional[list] = None
    certifications: Optional[list] = None
    languages: Optional[list] = None
    awards: Optional[list] = None
    volunteer_experience: Optional[list] = None
    references: Optional[list] = None
    is_public: Optional[bool] = None


# --------------- Endpoints ---------------

@router.post("", status_code=201)
async def create_resume_builder(
    payload: ResumeBuilderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    builder = ResumeBuilder(
        user_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(builder)
    await db.flush()
    await db.refresh(builder)
    return builder


@router.get("")
async def list_resume_builders(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        select(ResumeBuilder)
        .where(ResumeBuilder.user_id == current_user.id)
        .order_by(ResumeBuilder.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/{builder_id}")
async def get_resume_builder(
    builder_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        select(ResumeBuilder).where(
            ResumeBuilder.id == builder_id,
            ResumeBuilder.user_id == current_user.id,
        )
    )
    builder = result.scalar_one_or_none()
    if not builder:
        raise HTTPException(status_code=404, detail="Resume builder not found")
    return builder


@router.put("/{builder_id}")
async def update_resume_builder(
    builder_id: str,
    payload: ResumeBuilderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        select(ResumeBuilder).where(
            ResumeBuilder.id == builder_id,
            ResumeBuilder.user_id == current_user.id,
        )
    )
    builder = result.scalar_one_or_none()
    if not builder:
        raise HTTPException(status_code=404, detail="Resume builder not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(builder, key, value)

    await db.flush()
    await db.refresh(builder)
    return builder


@router.delete("/{builder_id}", status_code=204)
async def delete_resume_builder(
    builder_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        select(ResumeBuilder).where(
            ResumeBuilder.id == builder_id,
            ResumeBuilder.user_id == current_user.id,
        )
    )
    builder = result.scalar_one_or_none()
    if not builder:
        raise HTTPException(status_code=404, detail="Resume builder not found")
    await db.delete(builder)


@router.post("/{builder_id}/ai-enhance")
async def ai_enhance(
    builder_id: str,
    section: str = Query("summary"),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        select(ResumeBuilder).where(
            ResumeBuilder.id == builder_id,
            ResumeBuilder.user_id == current_user.id,
        )
    )
    builder = result.scalar_one_or_none()
    if not builder:
        raise HTTPException(status_code=404, detail="Resume builder not found")

    if not client:
        raise HTTPException(status_code=503, detail="AI service unavailable")

    if section == "summary":
        prompt = (
            f"Write a professional 2-3 sentence resume summary for someone with this background:\n"
            f"Name: {builder.full_name}\n"
            f"Experience: {json.dumps(builder.work_experience)}\n"
            f"Skills: {json.dumps(builder.skills)}\n"
            f"Education: {json.dumps(builder.education)}\n\n"
            f"Return ONLY the summary text, no JSON."
        )
    elif section == "experience":
        prompt = (
            f"Improve these work experience bullet points to be more impactful with action verbs and metrics. "
            f"Return ONLY a JSON array of the improved work_experience entries with the same structure:\n"
            f"{json.dumps(builder.work_experience)}"
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid section. Use 'summary' or 'experience'")

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )
        result_text = response.choices[0].message.content.strip()

        if section == "summary":
            builder.summary = result_text
            await db.flush()
            await db.refresh(builder)
            return {"summary": result_text}
        elif section == "experience":
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]
            enhanced = json.loads(result_text.strip())
            builder.work_experience = enhanced
            await db.flush()
            await db.refresh(builder)
            return {"work_experience": enhanced}
    except Exception:
        raise HTTPException(status_code=503, detail="AI enhancement failed")
