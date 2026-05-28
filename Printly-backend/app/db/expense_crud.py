from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from datetime import date


from .base_crud import BaseCRUD
from app.models import Expenses
from app.enums import ExpenseCategory


class ExpenseCRUD(BaseCRUD[Expenses]):
    model = Expenses

    @classmethod
    async def get_by_date_range(
        cls, db: AsyncSession, tenant_id: UUID, start_date: date, end_date: date
    ):
        stmt = select(cls.model).where(
            cls.model.tenant_id == tenant_id,
            cls.model.expense_date >= start_date,
            cls.model.expense_date <= end_date,
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @classmethod
    async def get_by_category(
        cls, db: AsyncSession, tenant_id: UUID, category: ExpenseCategory
    ):
        stmt = select(cls.model).where(
            cls.model.tenant_id == tenant_id, cls.model.category == category
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @classmethod
    async def get_list_of_expenses(
        cls,
        db: AsyncSession,
        tenant_id: UUID,
        category: ExpenseCategory | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        offset: int = 0,
        limit: int = 10,
        order_by: str = "created_at",
        order_dir: str = "desc"
    ) -> tuple[list[Expenses], int]:
        stmt = select(cls.model).where(cls.model.tenant_id == tenant_id)

        if category:
            stmt = stmt.where(cls.model.category == category)
        if start_date:
            stmt = stmt.where(cls.model.expense_date >= start_date)
        if end_date:
            stmt = stmt.where(cls.model.expense_date <= end_date)

        total_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await db.execute(total_stmt)
        total_count = total_result.scalar_one()

        if order_by in ["amount", "expense_date", "created_at"]:
            if order_dir == "desc":
                stmt = stmt.order_by(getattr(cls.model, order_by).desc())
            else:
                stmt = stmt.order_by(getattr(cls.model, order_by).asc())

        result = await db.execute(stmt.offset(offset).limit(limit))
        expenses = result.scalars().all()

        return expenses, total_count