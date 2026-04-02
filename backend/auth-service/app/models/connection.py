import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class ConnectionStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class Connection(Base):
    __tablename__ = "connections"
    __table_args__ = (UniqueConstraint('sender_id', 'receiver_id', name='uq_connection'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    receiver_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    status: Mapped[ConnectionStatus] = mapped_column(SAEnum(ConnectionStatus), default=ConnectionStatus.PENDING, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
