from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from sqlalchemy import select

from .base_crud import BaseCRUD
from app.models import TenantMembers


class TenantMemberCRUD(BaseCRUD[TenantMembers]):
    def __init__(self):
        super().__init__(TenantMembers)
    
    async def get_tenant_member(
        self,
        db: AsyncSession,
        tenant_id: UUID,
        customer_user_id: UUID
    ) -> TenantMembers | None:
        query = select(self.model).where(
            self.model.customer_user_id == customer_user_id,
            self.model.tenant_id == tenant_id
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()