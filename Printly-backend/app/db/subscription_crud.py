from .base_crud import BaseCRUD
from app.models.tenant_subscriptions import TenantSubscriptions
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class SubscriptionCRUD(BaseCRUD[TenantSubscriptions]):
    def __init__(self):
        super().__init__(TenantSubscriptions)

    async def get_active_by_tenant_id(
        self, db: AsyncSession, tenant_id: UUID
    ) -> TenantSubscriptions | None:
        """Get active subscription for a tenant"""
        stmt = select(self.model).where(
            self.model.tenant_id == tenant_id,
            self.model.is_active,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def is_expired(self, db: AsyncSession, tenant_id: UUID) -> bool:
        """Check if a subscription is expired"""
        subscription = await self.get_active_by_tenant_id(db, tenant_id)
        if subscription is None:
            return False
        return subscription.expires_at < datetime.now(timezone.utc)
