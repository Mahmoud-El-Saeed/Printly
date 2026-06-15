import uuid
from decimal import Decimal
from sqlalchemy import ForeignKey, Index, UniqueConstraint, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, generate_uuid


class BookMaterials(Base):
    __tablename__ = "book_materials"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    book_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False
    )
    material_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False
    )
    quantity_per_copy: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("book_id", "material_id", name="uq_book_material"),
        Index("ix_book_materials_book_id", "book_id"),
        Index("ix_book_materials_material_id", "material_id"),
    )

    book: Mapped["Books"] = relationship("Books", back_populates="book_materials")
    material: Mapped["Materials"] = relationship("Materials")

    @property
    def material_name(self) -> str:
        return self.material.name if self.material else ""

    @property
    def price_per_unit(self) -> Decimal:
        return self.material.price_per_unit if self.material else Decimal("0")
