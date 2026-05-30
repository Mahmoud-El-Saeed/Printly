from typing import Literal
from pydantic import BaseModel, ConfigDict
from app.enums import NotificationType
from uuid import UUID
from datetime import datetime


class NotificationResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    user_id: UUID | None
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    unread_count: int
    total_count: int


class NotificationListRequest(BaseModel):
    user_id: UUID | None = None
    notification_type: NotificationType | None = None
    is_read: bool | None = None
    offset: int = 0
    limit: int = 10
    order_by: Literal["created_at", "notification_type", "is_read"] = "created_at"
    order_dir: Literal["asc", "desc"] = "desc"
