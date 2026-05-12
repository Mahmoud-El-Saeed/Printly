import uuid
from sqlalchemy import String, Numeric, ForeignKey, Index, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base, TenantMixin, TimestampMixin, generate_uuid
from app.enums.material_transaction_type import MaterialTransactionType
from decimal import Decimal

class MaterialTransactions(Base, TenantMixin, TimestampMixin):
    __tablename__ = "material_transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    material_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("materials.id", ondelete="CASCADE"),
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    type: Mapped[MaterialTransactionType] = mapped_column(
        Enum(MaterialTransactionType, name="material_transaction_type_enum", create_constraint=True),
        nullable=False,
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    __table_args__ = (
        Index("ix_material_transactions_tenant_id", "tenant_id"),
        Index("ix_material_transactions_material_id", "material_id"),
        Index("ix_material_transactions_type", "type"),
    )

    tenant: Mapped["Tenants"] = relationship(
        "Tenants",
    )
    material: Mapped["Materials"] = relationship(
        "Materials",
        back_populates="transactions",
    )
    order: Mapped["Orders"] = relationship(
        "Orders",
    )
    creator: Mapped["Users"] = relationship(
        "Users",
    )