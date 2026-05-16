import uuid
from sqlalchemy import String, Integer, Boolean, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, TenantMixin, TimestampMixin, generate_uuid


class Books(Base, TenantMixin, TimestampMixin):
    __tablename__ = "books"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    subject: Mapped[str | None] = mapped_column(String(200), nullable=True)
    total_pages: Mapped[int] = mapped_column(Integer, nullable=False)
    
    file_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    local_file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    __table_args__ = (
        Index("ix_books_tenant_id", "tenant_id"),
        Index("ix_books_customer_id", "customer_id"),
    )

    tenant: Mapped["Tenants"] = relationship(
        "Tenants",
        back_populates="books",
    )
    customer: Mapped["Users"] = relationship(
        "Users",
        back_populates="books",
        foreign_keys=[customer_id],
    )

    creator: Mapped["Users"] = relationship(
        "Users",
        foreign_keys=[created_by],
    )