import uuid
from sqlalchemy import String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, TenantMixin, TimestampMixin, generate_uuid


class WalkInCustomers(Base, TenantMixin, TimestampMixin):
    __tablename__ = "walk_in_customers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index("ix_walk_in_customers_tenant_id", "tenant_id"),
    )

    tenant: Mapped["Tenants"] = relationship(
        "Tenants",
        back_populates="walk_in_customers",
    )
    orders: Mapped[list["Orders"]] = relationship(
        "Orders",
        back_populates="walk_in_customer",
    )