from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.models.resume import create_tables
from app.api import resumes, resume_builder


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title="Sparklex Resume Service",
    description="Resume upload, parsing & AI analysis microservice",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3001", "http://localhost:80", "http://45.198.59.183:30001", "http://45.198.59.183", "http://connect.qhrmpro.com", "https://connect.qhrmpro.com"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
app.include_router(resume_builder.router, prefix="/resume-builder", tags=["Resume Builder"])


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "resume-service"}
