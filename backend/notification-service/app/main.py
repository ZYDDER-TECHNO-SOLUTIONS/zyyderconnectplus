from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.models.notification import create_tables
from app.api import notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title="Sparklex Notification Service",
    description="Notifications microservice for Sparklex Connect+",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3001", "http://localhost:80", "http://45.198.59.183:30001", "http://45.198.59.183", "http://connect.qhrmpro.com", "https://connect.qhrmpro.com"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "notification-service"}
