from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from sqlalchemy import select

from .base_crud import BaseCRUD
from app.models import TenantMembers


class TenantMemberCRUD(BaseCRUD[TenantMembers]):
    model = TenantMembers
    
    @classmethod
    async def get_tenant_member(
        cls,
        db: AsyncSession,
        tenant_id: UUID,
        customer_user_id: UUID
    ) -> TenantMembers | None:
        query = select(cls.model).where(
            cls.model.customer_user_id == customer_user_id,
            cls.model.tenant_id == tenant_id
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()