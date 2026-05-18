from uuid import UUID
from .base_crud import BaseCRUD
from app.models import Books
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_


class BookCRUD(BaseCRUD[Books]):
    def __init__(self):
        super().__init__(Books)

    async def search_books(
        self,
        db: AsyncSession,
        tenant_id: UUID,
        title: str | None = None,
        subject: str | None = None,
        has_file: bool | None = None,
        offset: int = 0,
        limit: int = 20,
        order_by: str = "created_at",
        order_dir: str = "desc",
    ) -> tuple[list[Books], int]:
        """Search books by title "or" subject with pagination."""

        query = select(Books).where(Books.tenant_id == tenant_id)

        if has_file is True:
            query = query.where(Books.file_url.isnot(None))
        elif has_file is False:
            query = query.where(Books.file_url.is_(None))

        if title and subject:
            query = query.where(
                or_(
                    Books.title.ilike(f"%{title}%"), Books.subject.ilike(f"%{subject}%")
                )
            )
        elif title:
            query = query.where(Books.title.ilike(f"%{title}%"))
        elif subject:
            query = query.where(Books.subject.ilike(f"%{subject}%"))

        total_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(total_query)
        total_count = total_result.scalar_one()

        if order_by in ["title", "subject", "created_at"]:
            if order_dir == "desc":
                query = query.order_by(getattr(Books, order_by).desc())
            else:
                query = query.order_by(getattr(Books, order_by).asc())

        result = await db.execute(query.offset(offset).limit(limit))
        books = result.scalars().all()

        return books, total_count

    async def count_stored_books(
        self,
        db: AsyncSession,
        tenant_id: UUID,
    ) -> int:
        """Count the total number of books stored for a tenant."""
        query = (
            select(func.count())
            .where(Books.tenant_id == tenant_id)
            .where(Books.file_url.isnot(None))
        )
        result = await db.execute(query)
        return result.scalar_one()
    
    async def get_books_by_ids(
        self,
        db: AsyncSession,
        book_ids: list[UUID],
    ) -> list[Books]:
        """Get multiple books by their IDs."""
        query = select(Books).where(Books.id.in_(book_ids))
        result = await db.execute(query)
        return result.scalars().all()
