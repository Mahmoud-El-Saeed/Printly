from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, Index, Enum, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.models.base import Base, TimestampMixin, generate_uuid, TenantMixin
from app.enums.link_status import LinkStatus


class CustomerTenantLinks(Base, TimestampMixin,TenantMixin):
    __tablename__ = "customer_tenant_links"

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
    status: Mapped[LinkStatus] = mapped_column(
        Enum(LinkStatus, name="link_status_enum", create_constraint=True),
        default=LinkStatus.PENDING,
        nullable=False,
    )
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    approved_at: Mapped[datetime | None] = mapped_column(nullable=True)

    __table_args__ = (
        Index("ix_customer_tenant_links_customer_user_id", "customer_user_id"),
        Index("ix_customer_tenant_links_tenant_id", "tenant_id"),
        Index("ix_customer_tenant_links_status", "status"),
        UniqueConstraint("tenant_id", "customer_user_id", name="uq_customer_tenant_link")
    )

    customer_user: Mapped["Users"] = relationship(
        "Users",
        back_populates="customer_tenant_links",
    )
    tenant: Mapped["Tenants"] = relationship(
        "Tenants",
        back_populates="customer_tenant_links",
    )