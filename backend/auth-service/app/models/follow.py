import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (UniqueConstraint('follower_id', 'following_id', name='uq_follow'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    follower_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    following_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
