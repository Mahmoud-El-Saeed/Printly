"""simplify order_items with auto-pricing from book materials

Revision ID: e07e867a2c11
Revises: ba0ec4469a30
Create Date: 2026-06-15 18:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = "e07e867a2c11"
down_revision: Union[str, Sequence[str], None] = "ba0ec4469a30"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop old columns no longer needed
    op.drop_column("order_items", "pages_per_copy")
    op.drop_column("order_items", "printing_price")
    op.drop_column("order_items", "cover_type")
    op.drop_column("order_items", "cover_price")
    op.drop_column("order_items", "binding_price")
    op.drop_column("order_items", "lamination_price")
    op.drop_column("order_items", "extra_services")

    # Add new columns
    op.add_column(
        "order_items",
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False, server_default="0"),
    )
    op.add_column(
        "order_items",
        sa.Column("total_pages", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "order_items",
        sa.Column(
            "color_mode",
            sa.String(20),
            nullable=False,
            server_default="bw",
        ),
    )
    op.add_column(
        "order_items",
        sa.Column(
            "materials_snapshot",
            JSONB,
            nullable=False,
            server_default="[]",
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop new columns
    op.drop_column("order_items", "materials_snapshot")
    op.drop_column("order_items", "color_mode")
    op.drop_column("order_items", "total_pages")
    op.drop_column("order_items", "unit_price")

    # Restore old columns
    op.add_column(
        "order_items",
        sa.Column("extra_services", JSONB, nullable=False, server_default="[]"),
    )
    op.add_column(
        "order_items",
        sa.Column("lamination_price", sa.Numeric(8, 2), nullable=False, server_default="0"),
    )
    op.add_column(
        "order_items",
        sa.Column("binding_price", sa.Numeric(8, 2), nullable=False, server_default="0"),
    )
    op.add_column(
        "order_items",
        sa.Column("cover_price", sa.Numeric(8, 2), nullable=False, server_default="0"),
    )
    op.add_column(
        "order_items",
        sa.Column("cover_type", sa.String(50), nullable=True),
    )
    op.add_column(
        "order_items",
        sa.Column("printing_price", sa.Numeric(8, 4), nullable=False, server_default="0"),
    )
    op.add_column(
        "order_items",
        sa.Column("pages_per_copy", sa.Integer(), nullable=False, server_default="0"),
    )
