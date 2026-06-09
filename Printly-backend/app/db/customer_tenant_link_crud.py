from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import asc, desc, select, func
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

    @classmethod
    async def get_list(
        cls,
        db,
        *,
        filters=None,
        offset=0,
        limit=20,
        order_by="created_at",
        order_dir="desc",
    ) -> tuple[list[CustomerTenantLinks], int]:
        query = select(cls.model)
        query = query.options(joinedload(cls.model.customer_user))

        count_stmt = select(func.count()).select_from(cls.model)

        if filters:
            for field, value in filters.items():
                col = getattr(cls.model, field, None)
                if col is not None:
                    query = query.where(col == value)
                    count_stmt = count_stmt.where(col == value)

        # Get total count
        count_result = await db.execute(count_stmt)
        total = count_result.scalar() or 0

        # Apply ordering
        col = getattr(cls.model, order_by, None)
        if col is not None:
            query = query.order_by(desc(col) if order_dir == "desc" else asc(col))

        # Apply pagination
        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        records = result.scalars().all()

        return records, total
