from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db import NotificationCRUD
from app.enums import NotificationType
from app.schemas import (
    NotificationListRequest,
    NotificationListResponse,
    NotificationResponse,
)

async def get_notifications(
    db: AsyncSession,
    tenant_id: UUID,
    request: NotificationListRequest,
) -> NotificationListResponse:
    filters = {
        "tenant_id": tenant_id,
    }
    if request.user_id is not None:
        filters["user_id"] = request.user_id
    if request.notification_type is not None:
        filters["notification_type"] = request.notification_type
    if request.is_read is not None:
        filters["is_read"] = request.is_read
    
    
    notifications, total_count = await NotificationCRUD.get_list(
        db=db,
        filters=filters,
        offset=request.offset,
        limit=request.limit,
        order_by=request.order_by,
        order_dir=request.order_dir,
    )
    unread_count = await NotificationCRUD.get_unread_count(
        db=db,
        tenant_id=tenant_id,
        user_id=request.user_id,
    )
    return NotificationListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        unread_count=unread_count,
        total_count=total_count,
    )

async def mark_as_read(
    db: AsyncSession,
    tenant_id: UUID,
    notification_id: UUID,
) -> None:
    """Mark a specific notification as read."""
    notification = await NotificationCRUD.get_by_id(db, notification_id)
    if notification and notification.tenant_id == tenant_id:
        notification.is_read = True
    else:
        raise ValueError("Notification not found or unauthorized")

async def mark_all_as_read(
    db: AsyncSession,
    tenant_id: UUID,
    user_id: UUID | None = None,
) -> int:
    """Mark all notifications as read for a specific tenant and optionally for a specific user. Returns the number of notifications marked as read."""
    return await NotificationCRUD.mark_all_read(db, tenant_id, user_id)

async def create_notification(
    db: AsyncSession,
    tenant_id: UUID,
    user_id: UUID | None,
    title: str,
    message: str,
    notification_type: NotificationType,
) -> NotificationResponse:
    """Create a new notification."""
    notification = await NotificationCRUD.create(
        db,
        tenant_id=tenant_id,
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
    )
    return NotificationResponse.model_validate(notification)
