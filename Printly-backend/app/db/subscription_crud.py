from .base_crud import BaseCRUD
from app.models.tenant_subscriptions import TenantSubscriptions
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class SubscriptionCRUD(BaseCRUD[TenantSubscriptions]):
    model = TenantSubscriptions

    @classmethod
    async def get_active_by_tenant_id(
        cls, db: AsyncSession, tenant_id: UUID
    ) -> TenantSubscriptions | None:
        """Get active subscription for a tenant"""
        stmt = select(cls.model).where(
            cls.model.tenant_id == tenant_id,
            cls.model.is_active,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @classmethod
    async def is_expired(cls, db: AsyncSession, tenant_id: UUID) -> bool:
        """Check if a subscription is expired"""
        subscription = await cls.get_active_by_tenant_id(db, tenant_id)
        if subscription is None:
            return False
        return subscription.expires_at < datetime.now(timezone.utc)
