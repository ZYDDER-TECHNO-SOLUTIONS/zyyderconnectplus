from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.database import create_tables, seed_superadmin
from app.api import auth, users, admin, connections, follows, companies
from app.config import settings

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    await seed_superadmin()
    yield


app = FastAPI(
    title="Sparklex Auth Service",
    description="Authentication & Authorization microservice for Sparklex Connect+",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:80", "http://45.198.59.183:30001", "http://45.198.59.183", "http://connect.qhrmpro.com", "https://connect.qhrmpro.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(connections.router, prefix="/connections", tags=["Connections"])
app.include_router(follows.router, prefix="/follows", tags=["Follows"])
app.include_router(companies.router, prefix="/companies", tags=["Companies"])


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "auth-service"}
