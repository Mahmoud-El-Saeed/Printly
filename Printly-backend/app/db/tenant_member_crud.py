from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from sqlalchemy import select, func, or_
from sqlalchemy.orm import contains_eager, joinedload

from .base_crud import BaseCRUD
from app.models import TenantMembers


class TenantMemberCRUD(BaseCRUD[TenantMembers]):
    model = TenantMembers

    @classmethod
    async def get_by_id(cls, db: AsyncSession, id: UUID) -> TenantMembers | None:
        query = (
            select(cls.model)
            .where(cls.model.id == id)
            .options(joinedload(cls.model.customer_user))
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @classmethod
    async def get_tenant_member(
        cls, db: AsyncSession, tenant_id: UUID, customer_user_id: UUID
    ) -> TenantMembers | None:
        query = select(cls.model).where(
            cls.model.customer_user_id == customer_user_id,
            cls.model.tenant_id == tenant_id,
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @classmethod
    async def get_tenant_member_by_phone(
        cls, db: AsyncSession, tenant_id: UUID, phone: str
    ) -> TenantMembers | None:
        query = (
            select(cls.model)
            .join(cls.model.customer_user)
            .where(
                cls.model.customer_user.phone == phone,
                cls.model.tenant_id == tenant_id,
            )
            .options(contains_eager(cls.model.customer_user))
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @classmethod
    async def search_members(
        cls,
        db: AsyncSession,
        tenant_id: UUID,
        search_query: str | None = None,
        offset: int = 0,
        limit: int = 100,
        order_by: str = "linked_at",
        order_dir: str = "desc",
    ) -> tuple[list[TenantMembers], int]:
        stmt = (
            select(cls.model)
            .join(cls.model.customer_user)
            .where(cls.model.tenant_id == tenant_id)
            .options(contains_eager(cls.model.customer_user))
        )
        if search_query:
            stmt = stmt.where(
                or_(
                    cls.model.display_name.ilike(f"%{search_query}%"),
                    cls.model.customer_user.email.ilike(f"%{search_query}%"),
                    cls.model.customer_user.phone.ilike(f"%{search_query}%"),
                )
            )
        total_result = await db.execute(
            select(func.count()).select_from(stmt.subquery())
        )
        total = total_result.scalar_one()
        if order_by not in ["linked_at", "display_name"]:
            order_by = "linked_at"
        order_column = getattr(cls.model, order_by)
        if order_dir == "desc":
            order_column = order_column.desc()
        stmt = stmt.order_by(order_column).offset(offset).limit(limit)
        result = await db.execute(stmt)
        members = result.scalars().all()

        return members, total

    @classmethod
    async def get_approved_memberships(
        cls,
        db: AsyncSession,
        customer_user_id: UUID,
        offset: int = 0,
        limit: int = 20,
        order_by: str = "linked_at",
        order_dir: str = "desc",
    ) -> list[TenantMembers]:
        """Get all approved tenant memberships for a customer user, with tenant info loaded."""
        from sqlalchemy.orm import joinedload

        stmt = (
            select(cls.model)
            .where(cls.model.customer_user_id == customer_user_id)
            .where(cls.model.is_approved == True)  # noqa: E712
            .options(joinedload(cls.model.tenant))
        )
        order_column = getattr(cls.model, order_by, cls.model.linked_at)
        if order_dir == "desc":
            stmt = stmt.order_by(order_column.desc())
        else:
            stmt = stmt.order_by(order_column.asc())
        stmt = stmt.offset(offset).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    @classmethod
    async def count_approved_memberships(
        cls,
        db: AsyncSession,
        customer_user_id: UUID,
    ) -> int:
        """Count the total approved memberships for a customer user."""
        stmt = (
            select(func.count())
            .select_from(cls.model)
            .where(cls.model.customer_user_id == customer_user_id)
            .where(cls.model.is_approved == True)  # noqa: E712
        )
        result = await db.execute(stmt)
        return result.scalar_one() or 0
