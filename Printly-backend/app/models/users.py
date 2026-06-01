from __future__ import annotations
import uuid
from sqlalchemy import String, Boolean, ForeignKey, Index, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, TimestampMixin, generate_uuid
from app.enums.user_role import UserRole



class Users(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="SET NULL"),
        nullable=True,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum", create_constraint=True),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("ix_users_tenant_id", "tenant_id"),
        Index("ix_users_role", "role"),
    )

    tenant: Mapped["Tenants"] = relationship(
        "Tenants",
        back_populates="users",
        foreign_keys=[tenant_id],
    )
    orders: Mapped[list["Orders"]] = relationship(
        "Orders",
        foreign_keys="Orders.customer_id",
        back_populates="customer",
    )
    books: Mapped[list["Books"]] = relationship(
        "Books",
        back_populates="customer",
        foreign_keys="Books.customer_id",
    )
    tenant_members: Mapped[list["TenantMembers"]] = relationship(
        "TenantMembers",
        back_populates="customer_user",
    )
    customer_tenant_links: Mapped[list["CustomerTenantLinks"]] = relationship(
        "CustomerTenantLinks",
        back_populates="customer_user",
    )
    custom_pricings: Mapped[list["CustomerPricing"]] = relationship(
        "CustomerPricing",
        back_populates="customer",
    )
    notifications: Mapped[list["Notifications"]] = relationship(
        "Notifications",
        back_populates="user",
    )
    refresh_tokens: Mapped[list["RefreshTokens"]] = relationship(
        "RefreshTokens",
        back_populates="user",
        cascade="all, delete-orphan",
    )
