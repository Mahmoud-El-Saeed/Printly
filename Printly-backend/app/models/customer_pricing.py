import uuid
from decimal import Decimal
from sqlalchemy import String, Numeric, Boolean, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, TenantMixin, TimestampMixin, generate_uuid


class CustomerPricing(Base, TenantMixin, TimestampMixin):
    __tablename__ = "customer_pricing"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    pricing_rule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pricing_rules.id", ondelete="CASCADE"),
        nullable=False,
    )
    custom_price: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("ix_customer_pricing_tenant_id", "tenant_id"),
        Index("ix_customer_pricing_customer_id", "customer_id"),
        UniqueConstraint("customer_id", "pricing_rule_id", name="uq_customer_pricing")
    )

    tenant: Mapped["Tenants"] = relationship(
        "Tenants",
    )
    customer: Mapped["Users"] = relationship(
        "Users",
        back_populates="custom_pricings",
    )
    pricing_rule: Mapped["PricingRules"] = relationship(
        "PricingRules",
        back_populates="customer_pricings",
    )