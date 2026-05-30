from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import logging

from app.routes.deps import get_db, require_tenant_staff

from app.services import (
    get_notifications,
    mark_as_read,
    mark_all_as_read,
)
from app.schemas import (
    NotificationListRequest,
    NotificationListResponse,
    TokenData,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=NotificationListResponse)
async def list_notifications(
    request: Annotated[NotificationListRequest, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    token_data: Annotated[TokenData, Depends(require_tenant_staff)],
) -> NotificationListResponse:
    """Get a list of notifications for the tenant and optionally filter by user, type, and read status."""
    try:
        return await get_notifications(
            db=db, tenant_id=token_data.tenant_id, request=request
        )
    except Exception as e:
        logger.error(f"Error occurred while fetching notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch notifications",
        )


@router.patch("/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_as_read(
    db: Annotated[AsyncSession, Depends(get_db)],
    token_data: Annotated[TokenData, Depends(require_tenant_staff)],
) -> None:
    """Mark all notifications for the tenant as read."""
    try:
        await mark_all_as_read(db=db, tenant_id=token_data.tenant_id)
    except Exception as e:
        logger.error(f"Error occurred while marking all notifications as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark all notifications as read",
        )


@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_as_read(
    notification_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    token_data: Annotated[TokenData, Depends(require_tenant_staff)],
) -> None:
    """Mark a specific notification as read."""
    try:
        await mark_as_read(
            db=db, tenant_id=token_data.tenant_id, notification_id=notification_id
        )
    except ValueError as ve:
        logger.warning(f"Attempt to mark notification as read failed: {ve}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve),
        )
    except Exception as e:
        logger.error(f"Error occurred while marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read",
        )
