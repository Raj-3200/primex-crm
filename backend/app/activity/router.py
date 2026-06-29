"""
PrimeX Services CRM — Activity & Notification Endpoints.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.activity.models import Notification
from app.core.database import get_db
from app.core.dependencies import get_current_user

router = APIRouter(tags=["Activity"])


class NotificationResponse(dict):
    """Notification response model"""

    pass


@router.get("/notifications", response_model=dict[str, Any])
async def list_notifications(
    session: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict[str, Any]:
    """
    Fetch notifications for the current user.
    
    - **limit**: Max results (default 50, max 100)
    - **offset**: Pagination offset (default 0)
    """
    # Get all notifications ordered by recency
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await session.execute(stmt)
    notifications = result.scalars().all()

    # Count unread
    unread_count = sum(1 for n in notifications if not n.is_read)

    return {
        "notifications": [
            {
                "id": str(n.id),
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
                "entity_type": n.entity_type,
                "entity_id": n.entity_id,
            }
            for n in notifications
        ],
        "unreadCount": unread_count,
    }


@router.post("/notifications/mark-read", response_model=dict[str, Any])
async def mark_notification_read(
    payload: dict[str, Any],
    session: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Mark notification(s) as read.
    
    Body:
    - **id**: Single notification ID to mark as read
    - **markAllRead**: True to mark all as read
    """
    user_id = current_user.id

    if payload.get("markAllRead"):
        # Mark all notifications as read for this user
        stmt = (
            select(Notification)
            .where(Notification.user_id == current_user.id)
            .where(Notification.is_read == False)
        )
        result = await session.execute(stmt)
        notifications = result.scalars().all()

        for notif in notifications:
            notif.is_read = True

        await session.commit()
        return {
            "success": True,
            "message": f"Marked {len(notifications)} notifications as read",
        }

    if notif_id := payload.get("id"):
        # Mark single notification as read
        stmt = select(Notification).where(
            (Notification.id == UUID(notif_id))
            & (Notification.user_id == current_user.id)
        )
        result = await session.execute(stmt)
        notification = result.scalar_one_or_none()

        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")

        notification.is_read = True
        await session.commit()

        return {"success": True, "message": "Notification marked as read"}

    raise HTTPException(status_code=400, detail="id or markAllRead required")
