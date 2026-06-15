"""remove pricing_rules and customer_pricing tables

Revision ID: b9dcc2a2cc52
Revises: e07e867a2c11
Create Date: 2026-06-15 18:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b9dcc2a2cc52"
down_revision: Union[str, Sequence[str], None] = "e07e867a2c11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_table("customer_pricing")
    op.drop_table("pricing_rules")
    op.execute("DROP TYPE IF EXISTS pricing_component_type_enum")
    op.execute("DROP TYPE IF EXISTS pricing_unit_type_enum")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("CREATE TYPE pricing_component_type_enum AS ENUM ('page_print', 'cover', 'binding', 'lamination', 'extra_service')")
    op.execute("CREATE TYPE pricing_unit_type_enum AS ENUM ('per_page', 'per_unit')")

    op.create_table(
        "pricing_rules",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("component_type", pricing_component_type_enum, nullable=False),
        sa.Column("component_name", sa.String(200), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit_type", pricing_unit_type_enum, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pricing_rules_tenant_id", "pricing_rules", ["tenant_id"])
    op.create_index("ix_pricing_rules_is_active", "pricing_rules", ["is_active"])
    op.create_index("ix_pricing_rules_component_type", "pricing_rules", ["component_type"])

    op.create_table(
        "customer_pricing",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("customer_id", sa.UUID(), nullable=False),
        sa.Column("pricing_rule_id", sa.UUID(), nullable=False),
        sa.Column("custom_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["pricing_rule_id"], ["pricing_rules.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "customer_id", "pricing_rule_id", name="uq_customer_pricing"),
    )
    op.create_index("ix_customer_pricing_tenant_id", "customer_pricing", ["tenant_id"])
    op.create_index("ix_customer_pricing_customer_id", "customer_pricing", ["customer_id"])
    op.create_index("ix_customer_pricing_rule_id", "customer_pricing", ["pricing_rule_id"])
