import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, ForeignKey, Index, DateTime, UniqueConstraint, Numeric
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.models.base import Base, TenantMixin, generate_uuid


class TenantMembers(Base, TenantMixin):
    __tablename__ = "tenant_members"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    customer_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    display_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    balance: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default="0",
        nullable=False,
    )
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    linked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_tenant_members_tenant_id", "tenant_id"),
        Index("ix_tenant_members_customer_user_id", "customer_user_id"),
        Index("ix_tenant_members_is_approved", "is_approved"),
        UniqueConstraint("tenant_id", "customer_user_id", name="uq_tenant_customer_user")
    )

    tenant: Mapped["Tenants"] = relationship(
        "Tenants",
        back_populates="members",
    )
    customer_user: Mapped["Users"] = relationship(
        "Users",
        back_populates="tenant_members",
    )