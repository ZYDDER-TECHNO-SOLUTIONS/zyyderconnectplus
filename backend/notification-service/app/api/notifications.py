from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from pydantic import BaseModel
from typing import Optional

from app.models.notification import Notification, NotificationType, get_db
from app.utils.auth import get_current_user, CurrentUser

router = APIRouter()


class NotificationCreate(BaseModel):
    user_id: str
    type: NotificationType
    title: str
    message: str
    link: Optional[str] = None


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    link: Optional[str]
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True


@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = False,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)  # noqa
    query = query.order_by(Notification.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    return [
        {**{c: getattr(n, c) for c in ["id", "user_id", "type", "title", "message", "link", "is_read"]},
         "created_at": n.created_at.isoformat()}
        for n in items
    ]


@router.get("/unread-count")
async def unread_count(db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    result = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False)  # noqa
    )
    return {"count": len(result.scalars().all())}


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    return {"message": "Marked as read"}


@router.patch("/read-all")
async def mark_all_read(db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)  # noqa
        .values(is_read=True)
    )
    return {"message": "All notifications marked as read"}


# Internal endpoint (called by other services via RabbitMQ/HTTP)
@router.post("/internal/create", status_code=201)
async def create_notification(payload: NotificationCreate, db: AsyncSession = Depends(get_db)):
    notif = Notification(**payload.model_dump())
    db.add(notif)
    await db.flush()
    return {"id": notif.id}
