from .base_crud import BaseCRUD
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import date

from app.models import Orders, OrderItems
from app.enums import OrderStatus


class OrderCRUD(BaseCRUD[Orders]):
    model = Orders

    @classmethod
    async def get_by_id(cls, db: AsyncSession, id: UUID) -> Orders | None:
        """Get an order by ID, including its items."""
        query = (
            select(cls.model)
            .where(cls.model.id == id)
            .options(selectinload(cls.model.items))
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @classmethod
    async def get_orders(
        cls,
        db: AsyncSession,
        tenant_id: UUID,
        customer_id: UUID | None = None,
        walk_in_customer_id: UUID | None = None,
        created_by: UUID | None = None,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        order_number: str | None = None,
        offset: int = 0,
        limit: int = 10,
        order_by: str = "created_at",
        order_dir: str = "desc",
    ) -> tuple[list[Orders], int]:
        """Get a list of orders with optional filtering and pagination."""
        query = select(Orders).where(Orders.tenant_id == tenant_id)

        if customer_id:
            query = query.where(Orders.customer_id == customer_id)
        if walk_in_customer_id:
            query = query.where(Orders.walk_in_customer_id == walk_in_customer_id)
        if created_by:
            query = query.where(Orders.created_by == created_by)
        if status:
            query = query.where(Orders.status == status)
        if date_from and date_to:
            query = query.where(Orders.created_at.between(date_from, date_to))
        elif date_from:
            query = query.where(Orders.created_at >= date_from)
        elif date_to:
            query = query.where(Orders.created_at <= date_to)
        if order_number:
            query = query.where(Orders.order_number.ilike(f"%{order_number}%"))

        total_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(total_query)
        total_count = total_result.scalar_one()

        order_column = getattr(Orders, order_by, None)
        if order_column is not None:
            if order_dir.lower() == "desc":
                order_column = order_column.desc()
            else:
                order_column = order_column.asc()
            query = query.order_by(order_column)

        query = query.options(
            selectinload(cls.model.items)
        )  # Eager load items to avoid N+1 problem and ignore LazyLoad warnings
        result = await db.execute(query.offset(offset).limit(limit))
        orders = result.scalars().all()

        return orders, total_count

    @classmethod
    async def get_unpaid_orders(
        cls, db: AsyncSession, tenant_id: UUID, customer_id: UUID
    ) -> list[Orders]:
        """Get unpaid orders for a specific customer."""
        query = (
            select(Orders)
            .where(Orders.tenant_id == tenant_id)
            .where(Orders.customer_id == customer_id)
            .where(Orders.total_amount > Orders.paid_amount)
            .where(Orders.status.notin_([OrderStatus.CANCELLED]))
            .order_by(Orders.created_at.asc())
            .options(
                selectinload(cls.model.items)
            )  # Eager load items to avoid N+1 problem and ignore LazyLoad warnings
        )
        result = await db.execute(query)
        return result.scalars().all()


class OrderItemsCRUD(BaseCRUD[OrderItems]):
    model = OrderItems

    @classmethod
    async def batch_create(self, db: AsyncSession, items_data: list[OrderItems]):
        """Create multiple order items in a batch operation."""
        db.add_all(items_data)
        await db.flush()
        return items_data
