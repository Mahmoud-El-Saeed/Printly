import uuid
from decimal import Decimal
from sqlalchemy import String, Numeric, ForeignKey, Index, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, TenantMixin, TimestampMixin, generate_uuid
from app.enums.payment_method import PaymentMethod


class Payments(Base, TenantMixin, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, name="payment_method_enum", create_constraint=True),
        nullable=False,
    )
    reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    __table_args__ = (
        Index("ix_payments_tenant_id", "tenant_id"),
        Index("ix_payments_order_id", "order_id"),
        Index("ix_payments_customer_id", "customer_id"),
    )

    tenant: Mapped["Tenants"] = relationship(
        "Tenants",
    )
    order: Mapped["Orders"] = relationship(
        "Orders",
        back_populates="payments",
    )
    customer: Mapped["Users"] = relationship(
        "Users",
        foreign_keys=[customer_id],
    )
    receiver: Mapped["Users"] = relationship(
        "Users",
        foreign_keys=[received_by],
    )