"""add price_per_unit to materials

Revision ID: 595e0b450055
Revises: c9723f955a4c
Create Date: 2026-06-15 17:54:14.197055

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '595e0b450055'
down_revision: Union[str, Sequence[str], None] = 'c9723f955a4c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "materials",
        sa.Column(
            "price_per_unit",
            sa.Numeric(10, 2),
            server_default="0",
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("materials", "price_per_unit")
