import uuid
from decimal import Decimal
from sqlalchemy import String, Numeric, Integer, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base, TimestampMixin, generate_uuid


class SubscriptionPlans(Base, TimestampMixin):
    __tablename__ = "subscription_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    price_monthly: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=0,
        nullable=False,
    )
    max_customers: Mapped[int] = mapped_column(Integer, nullable=False)
    max_users: Mapped[int] = mapped_column(Integer, nullable=False)
    features: Mapped[dict] = mapped_column(JSONB, default={}, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("ix_subscription_plans_name", "name"),
        Index("ix_subscription_plans_is_active", "is_active"),
    )

    subscriptions: Mapped[list["TenantSubscriptions"]] = relationship(
        "TenantSubscriptions",
        back_populates="plan",
    )