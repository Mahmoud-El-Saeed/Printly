import uuid
from sqlalchemy import String, Numeric, Boolean, ForeignKey, Index, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, TenantMixin, TimestampMixin, generate_uuid
from app.enums.pricing_component_type import PricingComponentType
from app.enums.pricing_unit_type import PricingUnitType
from decimal import Decimal

class PricingRules(Base, TenantMixin, TimestampMixin):
    __tablename__ = "pricing_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    component_type: Mapped[PricingComponentType] = mapped_column(
        Enum(PricingComponentType, name="pricing_component_type_enum", create_constraint=True),
        nullable=False,
    )
    component_name: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    unit_type: Mapped[PricingUnitType] = mapped_column(
        Enum(PricingUnitType, name="pricing_unit_type_enum", create_constraint=True),
        default=PricingUnitType.PER_PAGE,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("ix_pricing_rules_tenant_id", "tenant_id"),
        Index("ix_pricing_rules_component_type", "component_type"),
    )

    tenant: Mapped["Tenants"] = relationship(
        "Tenants",
    )
    customer_pricings: Mapped[list["CustomerPricing"]] = relationship(
        "CustomerPricing",
        back_populates="pricing_rule",
        cascade="all, delete-orphan",
    )