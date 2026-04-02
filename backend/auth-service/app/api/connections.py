from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User, UserRole
from app.models.connection import Connection, ConnectionStatus
from app.utils.security import get_current_user

router = APIRouter()


class ConnectionUserResponse(BaseModel):
    connection_id: str
    user_id: str
    full_name: str
    email: str
    headline: Optional[str] = None
    avatar_url: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConnectionStatusResponse(BaseModel):
    status: str  # "none", "pending_sent", "pending_received", "connected"
    connection_id: Optional[str] = None


@router.post("/request/{user_id}")
async def send_connection_request(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")

    # Only employees can connect with employees
    if current_user.role != UserRole.EMPLOYEE:
        raise HTTPException(status_code=403, detail="Only employees can send connection requests")

    # Check receiver exists and is an employee
    result = await db.execute(select(User).where(User.id == user_id))
    receiver = result.scalar_one_or_none()
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")
    if receiver.role != UserRole.EMPLOYEE:
        raise HTTPException(status_code=400, detail="Can only connect with employees")

    # Check for existing connection in either direction
    result = await db.execute(
        select(Connection).where(
            or_(
                and_(Connection.sender_id == current_user.id, Connection.receiver_id == user_id),
                and_(Connection.sender_id == user_id, Connection.receiver_id == current_user.id),
            )
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        if existing.status == ConnectionStatus.ACCEPTED:
            raise HTTPException(status_code=400, detail="Already connected")
        if existing.status == ConnectionStatus.PENDING:
            raise HTTPException(status_code=400, detail="Connection request already pending")
        if existing.status == ConnectionStatus.REJECTED:
            # Allow re-sending after rejection
            existing.status = ConnectionStatus.PENDING
            existing.sender_id = current_user.id
            existing.receiver_id = user_id
            existing.updated_at = datetime.utcnow()
            db.add(existing)
            await db.flush()
            return {"message": "Connection request sent", "connection_id": existing.id}

    connection = Connection(
        sender_id=current_user.id,
        receiver_id=user_id,
    )
    db.add(connection)
    await db.flush()
    return {"message": "Connection request sent", "connection_id": connection.id}


@router.patch("/{connection_id}/accept")
async def accept_connection(
    connection_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Connection).where(Connection.id == connection_id))
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    if connection.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the receiver can accept a connection request")
    if connection.status != ConnectionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Connection request is not pending")

    connection.status = ConnectionStatus.ACCEPTED
    connection.updated_at = datetime.utcnow()
    db.add(connection)
    await db.flush()
    return {"message": "Connection accepted"}


@router.patch("/{connection_id}/reject")
async def reject_connection(
    connection_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Connection).where(Connection.id == connection_id))
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    if connection.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the receiver can reject a connection request")
    if connection.status != ConnectionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Connection request is not pending")

    connection.status = ConnectionStatus.REJECTED
    connection.updated_at = datetime.utcnow()
    db.add(connection)
    await db.flush()
    return {"message": "Connection rejected"}


@router.delete("/{connection_id}")
async def remove_connection(
    connection_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Connection).where(Connection.id == connection_id))
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    if current_user.id not in (connection.sender_id, connection.receiver_id):
        raise HTTPException(status_code=403, detail="Not authorized to remove this connection")

    await db.delete(connection)
    await db.flush()
    return {"message": "Connection removed"}


@router.get("", response_model=list[ConnectionUserResponse])
async def list_connections(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Connections where current user is sender
    stmt_sender = (
        select(
            Connection.id.label("connection_id"),
            User.id.label("user_id"),
            User.full_name,
            User.email,
            User.headline,
            User.avatar_url,
            Connection.status,
            Connection.created_at,
        )
        .join(User, User.id == Connection.receiver_id)
        .where(
            and_(
                Connection.sender_id == current_user.id,
                Connection.status.in_([ConnectionStatus.ACCEPTED, "ACCEPTED"]),
            )
        )
    )

    # Connections where current user is receiver
    stmt_receiver = (
        select(
            Connection.id.label("connection_id"),
            User.id.label("user_id"),
            User.full_name,
            User.email,
            User.headline,
            User.avatar_url,
            Connection.status,
            Connection.created_at,
        )
        .join(User, User.id == Connection.sender_id)
        .where(
            and_(
                Connection.receiver_id == current_user.id,
                Connection.status.in_([ConnectionStatus.ACCEPTED, "ACCEPTED"]),
            )
        )
    )

    result = await db.execute(stmt_sender.union_all(stmt_receiver))
    rows = result.all()
    return [
        ConnectionUserResponse(
            connection_id=row.connection_id,
            user_id=row.user_id,
            full_name=row.full_name,
            email=row.email,
            headline=row.headline,
            avatar_url=row.avatar_url,
            status=row.status,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.get("/pending", response_model=list[ConnectionUserResponse])
async def list_pending_received(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Connection.id.label("connection_id"),
            User.id.label("user_id"),
            User.full_name,
            User.email,
            User.headline,
            User.avatar_url,
            Connection.status,
            Connection.created_at,
        )
        .join(User, User.id == Connection.sender_id)
        .where(
            and_(
                Connection.receiver_id == current_user.id,
                Connection.status.in_([ConnectionStatus.PENDING, "PENDING"]),
            )
        )
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        ConnectionUserResponse(
            connection_id=row.connection_id,
            user_id=row.user_id,
            full_name=row.full_name,
            email=row.email,
            headline=row.headline,
            avatar_url=row.avatar_url,
            status=row.status,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.get("/sent", response_model=list[ConnectionUserResponse])
async def list_sent_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Connection.id.label("connection_id"),
            User.id.label("user_id"),
            User.full_name,
            User.email,
            User.headline,
            User.avatar_url,
            Connection.status,
            Connection.created_at,
        )
        .join(User, User.id == Connection.receiver_id)
        .where(
            and_(
                Connection.sender_id == current_user.id,
                Connection.status.in_([ConnectionStatus.PENDING, "PENDING"]),
            )
        )
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        ConnectionUserResponse(
            connection_id=row.connection_id,
            user_id=row.user_id,
            full_name=row.full_name,
            email=row.email,
            headline=row.headline,
            avatar_url=row.avatar_url,
            status=row.status,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.get("/status/{user_id}", response_model=ConnectionStatusResponse)
async def get_connection_status(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Connection).where(
            or_(
                and_(Connection.sender_id == current_user.id, Connection.receiver_id == user_id),
                and_(Connection.sender_id == user_id, Connection.receiver_id == current_user.id),
            )
        )
    )
    connection = result.scalar_one_or_none()

    if not connection:
        return ConnectionStatusResponse(status="none")

    if connection.status == ConnectionStatus.ACCEPTED or connection.status == "ACCEPTED":
        return ConnectionStatusResponse(status="connected", connection_id=connection.id)

    if connection.status == ConnectionStatus.PENDING or connection.status == "PENDING":
        if connection.sender_id == current_user.id:
            return ConnectionStatusResponse(status="pending_sent", connection_id=connection.id)
        return ConnectionStatusResponse(status="pending_received", connection_id=connection.id)

    return ConnectionStatusResponse(status="none")
