import uuid
from sqlalchemy import String, Text, Boolean, Index, null
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, TimestampMixin, generate_uuid



class Tenants(Base, TimestampMixin):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("ix_tenants_slug", "slug"),
        Index("ix_tenants_is_active", "is_active"),
    )

    users: Mapped[list["Users"]] = relationship(
        "Users",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    orders: Mapped[list["Orders"]] = relationship(
        "Orders",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    books: Mapped[list["Books"]] = relationship(
        "Books",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    walk_in_customers: Mapped[list["WalkInCustomers"]] = relationship(
        "WalkInCustomers",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    subscriptions: Mapped[list["TenantSubscriptions"]] = relationship(
        "TenantSubscriptions",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    members: Mapped[list["TenantMembers"]] = relationship(
        "TenantMembers",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    customer_tenant_links: Mapped[list["CustomerTenantLinks"]] = relationship(
        "CustomerTenantLinks",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    materials: Mapped[list["Materials"]] = relationship(
        "Materials",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    material_transactions: Mapped[list["MaterialTransactions"]] = relationship(
        "MaterialTransactions",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    pricing_rules: Mapped[list["PricingRules"]] = relationship(
        "PricingRules",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    customer_pricings: Mapped[list["CustomerPricing"]] = relationship(
        "CustomerPricing",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    expenses: Mapped[list["Expenses"]] = relationship(
        "Expenses",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    notifications: Mapped[list["Notifications"]] = relationship(
        "Notifications",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    payments: Mapped[list["Payments"]] = relationship(
        "Payments",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )