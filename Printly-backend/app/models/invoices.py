import uuid
from decimal import Decimal
from sqlalchemy import String, Numeric, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, TenantMixin, TimestampMixin, generate_uuid


class Invoices(Base, TenantMixin, TimestampMixin):
    __tablename__ = "invoices"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    invoice_number: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="SET NULL"), nullable=False
    )
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    customer_name: Mapped[str | None] = mapped_column(String(200), nullable=True)

    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index("ix_invoices_tenant_id", "tenant_id"),
        Index("ix_invoices_order_id", "order_id"),
        Index("ix_invoices_customer_id", "customer_id"),
    )

    order: Mapped["Orders"] = relationship("Orders")
    customer: Mapped["Users"] = relationship("Users", foreign_keys=[customer_id])
