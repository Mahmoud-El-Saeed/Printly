import uuid
from decimal import Decimal
from sqlalchemy import String, Integer, Boolean, ForeignKey, Text, Index, Numeric
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
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    subject: Mapped[str | None] = mapped_column(String(200), nullable=True)
    total_pages: Mapped[int] = mapped_column(Integer, nullable=False)
    color_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="bw")
    sides_per_page: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    copies: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    binding_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    has_lamination: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    file_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)

    local_file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    __table_args__ = (
        Index("ix_books_tenant_id", "tenant_id"),
    )

    tenant: Mapped["Tenants"] = relationship(
        "Tenants",
        back_populates="books",
    )

    creator: Mapped["Users"] = relationship(
        "Users",
        foreign_keys=[created_by],
    )

    book_materials: Mapped[list["BookMaterials"]] = relationship(
        "BookMaterials", back_populates="book", cascade="all, delete-orphan"
    )