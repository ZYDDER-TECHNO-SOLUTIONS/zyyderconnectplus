from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import select
from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def create_tables():
    async with engine.begin() as conn:
        from app.models.user import User  # noqa: F401
        from app.models.connection import Connection  # noqa: F401
        from app.models.follow import Follow  # noqa: F401
        from app.models.company import Company  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)


async def seed_superadmin():
    import os
    from app.models.user import User, UserRole, UserStatus
    from app.utils.security import hash_password

    SUPERADMIN_EMAIL = os.environ.get("SUPERADMIN_EMAIL", "admin@sparklex.com")
    SUPERADMIN_PASSWORD = os.environ.get("SUPERADMIN_PASSWORD", "SparkleX@2026")

    async with AsyncSessionLocal() as session:
        # Check if this specific superadmin email exists
        result = await session.execute(
            select(User).where(User.email == SUPERADMIN_EMAIL)
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Reset password and ensure role/status are correct
            existing.hashed_password = hash_password(SUPERADMIN_PASSWORD)
            existing.role = UserRole.SUPERADMIN
            existing.status = UserStatus.ACTIVE
            existing.is_verified = True
            await session.commit()
            print(f"✅ Superadmin updated: {SUPERADMIN_EMAIL}")
            return

        superadmin = User(
            email=SUPERADMIN_EMAIL,
            hashed_password=hash_password(SUPERADMIN_PASSWORD),
            full_name="Super Admin",
            role=UserRole.SUPERADMIN,
            status=UserStatus.ACTIVE,
            is_verified=True,
        )
        session.add(superadmin)
        await session.commit()
        print(f"✅ Superadmin seeded: {SUPERADMIN_EMAIL}")


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
