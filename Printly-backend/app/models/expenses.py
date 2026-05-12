import uuid
from datetime import date
from sqlalchemy import String, Numeric, ForeignKey, Date, Index, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, TenantMixin, TimestampMixin, generate_uuid
from app.enums.expense_category import ExpenseCategory
from decimal import Decimal


class Expenses(Base, TenantMixin, TimestampMixin):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    category: Mapped[ExpenseCategory] = mapped_column(
        Enum(ExpenseCategory, name="expense_category_enum", create_constraint=True),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    __table_args__ = (
        Index("ix_expenses_tenant_id", "tenant_id"),
        Index("ix_expenses_category", "category"),
        Index("ix_expenses_expense_date", "expense_date"),
    )

    tenant: Mapped["Tenants"] = relationship(
        "Tenants",
    )
    creator: Mapped["Users"] = relationship(
        "Users",
    )
