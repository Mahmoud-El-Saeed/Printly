"""transform books with print config and add book_materials table

Revision ID: ba0ec4469a30
Revises: 595e0b450055
Create Date: 2026-06-15 18:00:53.414644

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ba0ec4469a30'
down_revision: Union[str, Sequence[str], None] = '595e0b450055'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Remove customer_id from books
    op.drop_constraint("books_customer_id_fkey", "books", type_="foreignkey")
    op.drop_index("ix_books_customer_id", table_name="books")
    op.drop_column("books", "customer_id")

    # Add print config columns to books
    op.add_column("books", sa.Column("color_mode", sa.String(20), nullable=False, server_default="bw"))
    op.add_column("books", sa.Column("sides_per_page", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("books", sa.Column("copies", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("books", sa.Column("binding_type", sa.String(50), nullable=True))
    op.add_column("books", sa.Column("has_lamination", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("books", sa.Column("notes", sa.Text(), nullable=True))

    # Create book_materials table
    op.create_table(
        "book_materials",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("book_id", sa.UUID(), nullable=False),
        sa.Column("material_id", sa.UUID(), nullable=False),
        sa.Column("quantity_per_copy", sa.Numeric(12, 2), nullable=False),
        sa.ForeignKeyConstraint(["book_id"], ["books.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["material_id"], ["materials.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("book_id", "material_id", name="uq_book_material"),
    )
    op.create_index("ix_book_materials_book_id", "book_materials", ["book_id"])
    op.create_index("ix_book_materials_material_id", "book_materials", ["material_id"])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop book_materials table
    op.drop_index("ix_book_materials_material_id", table_name="book_materials")
    op.drop_index("ix_book_materials_book_id", table_name="book_materials")
    op.drop_table("book_materials")

    # Remove print config columns from books
    op.drop_column("books", "notes")
    op.drop_column("books", "has_lamination")
    op.drop_column("books", "binding_type")
    op.drop_column("books", "copies")
    op.drop_column("books", "sides_per_page")
    op.drop_column("books", "color_mode")

    # Restore customer_id in books
    op.add_column("books", sa.Column("customer_id", sa.UUID(), nullable=True))
    op.create_index("ix_books_customer_id", "books", ["customer_id"])
    op.create_foreign_key(
        "books_customer_id_fkey",
        "books", "users",
        ["customer_id"], ["id"],
        ondelete="SET NULL",
    )
