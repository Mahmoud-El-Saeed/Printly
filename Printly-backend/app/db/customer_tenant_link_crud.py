from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from uuid import UUID

from .base_crud import BaseCRUD
from app.models import CustomerTenantLinks
from app.enums import LinkStatus


class CustomerTenantLinkCRUD(BaseCRUD[CustomerTenantLinks]):
    model = CustomerTenantLinks

    @classmethod
    async def get_by_id(cls, db: AsyncSession, id: UUID) -> CustomerTenantLinks | None:
        stmt = (
            select(cls.model)
            .where(cls.model.id == id)
            .options(joinedload(cls.model.customer_user))
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @classmethod
    async def get_pending_by_tenant(
        cls, 
        db: AsyncSession,
        tenant_id: UUID,
        offset: int = 0,
        limit: int = 100,
        order_by: str = "requested_at",
        order_dir: str = "desc",
    ) -> tuple[list[CustomerTenantLinks], int]:
        stmt = (
            select(cls.model)
            .where(cls.model.tenant_id == tenant_id)
            .where(cls.model.status == LinkStatus.PENDING)
            .options(joinedload(cls.model.customer_user))
        )
        total = await db.scalar(select(func.count()).select_from(stmt.subquery()))
        if order_dir.lower() == "desc":
            stmt = stmt.order_by(getattr(cls.model, order_by).desc())
        else:
            stmt = stmt.order_by(getattr(cls.model, order_by).asc())
        stmt = stmt.offset(offset).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all(), total

    @classmethod    
    async def get_by_customer_and_tenant(
        cls,
        db: AsyncSession,
        customer_user_id: UUID,
        tenant_id: UUID,
    ) -> CustomerTenantLinks | None:
        stmt = (
            select(cls.model)
            .where(cls.model.customer_user_id == customer_user_id)
            .where(cls.model.tenant_id == tenant_id)
            .options(joinedload(cls.model.customer_user))
        )
        result = await db.execute(stmt)
        return result.scalars().first()