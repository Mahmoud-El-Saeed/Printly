import uuid
from sqlalchemy import String, Numeric, Boolean, ForeignKey, Index, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base, TimestampMixin, generate_uuid
from decimal import Decimal

class OrderItems(Base, TimestampMixin):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    book_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("books.id", ondelete="SET NULL"),
        nullable=True,
    )
    book_title: Mapped[str] = mapped_column(String(300), nullable=False)
    copies: Mapped[int] = mapped_column(nullable=False)
    pages_per_copy: Mapped[int] = mapped_column(nullable=False)
    printing_price: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False)
    sides_per_page: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    cover_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cover_price: Mapped[Decimal] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )
    binding_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    binding_price: Mapped[Decimal] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )
    has_lamination: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    lamination_price: Mapped[Decimal] = mapped_column(
        Numeric(8, 2),
        default=0,
        nullable=False,
    )
    extra_services: Mapped[list] = mapped_column(
        JSONB,
        default=list,
        server_default="[]",
        nullable=False,
    )
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    __table_args__ = (
        Index("ix_order_items_order_id", "order_id"),
        Index("ix_order_items_book_id", "book_id"),
    )

    order: Mapped["Orders"] = relationship(
        "Orders",
        back_populates="items",
    )
    book: Mapped["Books"] = relationship(
        "Books",
    )