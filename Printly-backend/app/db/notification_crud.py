from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from uuid import UUID

from .base_crud import BaseCRUD
from app.models import Notifications

class NotificationCRUD(BaseCRUD[Notifications]):
    model = Notifications

    @classmethod
    async def get_unread_count(
        cls,
        db: AsyncSession,
        tenant_id: UUID,
        user_id: UUID | None = None,
    ) -> int:
        """Get the count of unread notifications for a specific tenant and optionally for a specific user."""
        stmt = (
            select(func.count())
            .select_from(cls.model)
            .where(cls.model.tenant_id == tenant_id)
            .where(cls.model.is_read == False)  # noqa: E712
        )
        if user_id:
            stmt = stmt.where(cls.model.user_id == user_id)
        
        result = await db.execute(stmt)
        return result.scalar_one() or 0
    
    @classmethod
    async def mark_all_read(
        cls,
        db: AsyncSession,
        tenant_id: UUID,
        user_id: UUID | None = None,
    ) -> int:
        """Mark all notifications with batch update for a specific tenant and optionally for a specific user. Returns the number of notifications marked as read."""
        
        unread_count = await cls.get_unread_count(db, tenant_id, user_id)
        if unread_count == 0:
            return 0
        stmt = (
            update(cls.model)
            .where(cls.model.tenant_id == tenant_id)
            .where(cls.model.is_read == False)  # noqa: E712
        )
        if user_id:
            stmt = stmt.where(cls.model.user_id == user_id) 
        stmt = stmt.values(is_read=True)
        _ = await db.execute(stmt)
        
        await db.flush()  
        
        return unread_count