import uuid
from decimal import Decimal
from datetime import date, datetime
from sqlalchemy import DateTime, String, Numeric, ForeignKey, Date, Index, Text, Enum, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, TenantMixin, TimestampMixin, generate_uuid
from app.enums.order_status import OrderStatus


class Orders(Base, TenantMixin, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    walk_in_customer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("walk_in_customers.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=False,
    )
    order_number: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status_enum", create_constraint=True),
        default=OrderStatus.NEW,
        nullable=False,
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=0,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_orders_tenant_id", "tenant_id"),
        Index("ix_orders_customer_id", "customer_id"),
        Index("ix_orders_walk_in_customer_id", "walk_in_customer_id"),
        Index("ix_orders_status", "status"),
        Index("ix_orders_created_by", "created_by"),
        Index("idx_orders_tenant_status", "tenant_id", "status"),
        Index("idx_orders_tenant_status_completed", "tenant_id", "status", "completed_at"),
        CheckConstraint(
            "customer_id IS NOT NULL OR walk_in_customer_id IS NOT NULL",
            name="ck_orders_one_customer_type"
        ),
    )

    tenant: Mapped["Tenants"] = relationship(
        "Tenants",
        back_populates="orders",
    )
    customer: Mapped["Users"] = relationship(
        "Users",
        foreign_keys=[customer_id],
        back_populates="orders",
    )
    walk_in_customer: Mapped["WalkInCustomers"] = relationship(
        "WalkInCustomers",
        back_populates="orders",
    )
    creator: Mapped["Users"] = relationship(
        "Users",
        foreign_keys=[created_by],
        # i don't put back_populates here
        # because we don't need to access created orders from user side :-)
        # ex:
        # avilable: order.creator 
        # not avilable: user.created_orders
    )
    items: Mapped[list["OrderItems"]] = relationship(
        "OrderItems",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    payments: Mapped[list["Payments"]] = relationship(
        "Payments",
        back_populates="order",
        cascade="all, delete-orphan",
    )