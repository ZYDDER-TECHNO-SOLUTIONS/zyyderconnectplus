import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.models.resume import Resume, get_db
from app.services.ai_service import extract_text_from_pdf, extract_text_from_docx, analyze_resume, score_resume_against_job
from app.services.storage_service import upload_file, get_file, delete_file
from app.utils.auth import get_current_user, CurrentUser

router = APIRouter()

ALLOWED_TYPES = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"}


@router.post("/upload", status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    title: str = Form(default="My Resume"),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are allowed")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="File size must be under 10MB")

    # Extract text
    if file.content_type == "application/pdf":
        extracted_text = extract_text_from_pdf(content)
    elif "wordprocessingml" in file.content_type:
        extracted_text = extract_text_from_docx(content)
    else:
        extracted_text = content.decode("utf-8", errors="ignore")

    # Upload to MongoDB GridFS
    object_name = f"resumes/{current_user.id}/{uuid.uuid4()}-{file.filename}"
    storage_id = await upload_file(object_name, content, file.content_type)

    # AI analysis
    parsed_data = {}
    skills = []
    experience_years = 0.0
    ai_summary = ""
    if extracted_text:
        parsed_data = await analyze_resume(extracted_text)
        skills = parsed_data.get("skills", [])
        experience_years = parsed_data.get("experience_years", 0.0)
        ai_summary = parsed_data.get("summary", "")

    resume = Resume(
        user_id=current_user.id,
        title=title,
        file_name=file.filename,
        file_url=f"/resumes/download/{storage_id}",
        storage_object_id=storage_id,
        extracted_text=extracted_text,
        parsed_data=parsed_data,
        ai_summary=ai_summary,
        skills=skills,
        experience_years=experience_years,
    )
    db.add(resume)
    await db.flush()
    await db.refresh(resume)
    return resume


@router.get("/my-resumes")
async def list_my_resumes(db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    result = await db.execute(select(Resume).where(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()))
    return result.scalars().all()


@router.get("/{resume_id}")
async def get_resume(resume_id: str, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != current_user.id and current_user.role not in ("employer", "superadmin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return resume


@router.get("/{resume_id}/download-url")
async def get_download_url(resume_id: str, request: Request, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    base_url = str(request.base_url).rstrip("/")
    return {"download_url": f"{base_url}/resumes/download/{resume.storage_object_id}"}


@router.get("/download/{file_id}")
async def download_file(file_id: str):
    try:
        content, content_type = await get_file(file_id)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(content=content, media_type=content_type)


@router.post("/{resume_id}/score-against-job")
async def score_against_job(
    resume_id: str,
    job_title: str = Query(...),
    job_requirements: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return await score_resume_against_job(resume.extracted_text or "", job_title, job_requirements)


@router.delete("/{resume_id}", status_code=204)
async def delete_resume(resume_id: str, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await delete_file(resume.storage_object_id)
    await db.delete(resume)
