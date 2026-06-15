"""add invoices table

Revision ID: 03c9e694696e
Revises: b9dcc2a2cc52
Create Date: 2026-06-15 18:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "03c9e694696e"
down_revision: Union[str, Sequence[str], None] = "b9dcc2a2cc52"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "invoices",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("invoice_number", sa.String(20), nullable=False),
        sa.Column("order_id", sa.UUID(), nullable=False),
        sa.Column("customer_id", sa.UUID(), nullable=True),
        sa.Column("customer_name", sa.String(200), nullable=True),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("paid_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("invoice_number"),
    )
    op.create_index("ix_invoices_tenant_id", "invoices", ["tenant_id"])
    op.create_index("ix_invoices_order_id", "invoices", ["order_id"])
    op.create_index("ix_invoices_customer_id", "invoices", ["customer_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_invoices_customer_id", table_name="invoices")
    op.drop_index("ix_invoices_order_id", table_name="invoices")
    op.drop_index("ix_invoices_tenant_id", table_name="invoices")
    op.drop_table("invoices")
