from .base_crud import BaseCRUD
from app.models import Orders, OrderItems
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

class OrderCRUD(BaseCRUD[Orders]):
    def __init__(self):
        super().__init__(Orders)
    
    async def get_orders(
        self,
        db: AsyncSession,
        tenant_id: UUID,
        customer_id: UUID | None = None,
        walk_in_customer_id: UUID | None = None,
        created_by: UUID | None = None,
        status: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
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

        result = await db.execute(query.offset(offset).limit(limit))
        orders = result.scalars().all()

        return orders, total_count


class OrderItemsCRUD(BaseCRUD[OrderItems]):
    def __init__(self):
        super().__init__(OrderItems)
        
    async def batch_create(self, db: AsyncSession, items_data: list[OrderItems]):
        """Batch create order items."""
        db.add_all(items_data)
        await db.flush() 
        return items_data
