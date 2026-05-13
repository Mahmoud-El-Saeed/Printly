from typing import Type, TypeVar, Generic, Sequence, Any
from uuid import UUID
from sqlalchemy import select, func, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseCRUD(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get_by_id(self, db: AsyncSession, id: UUID) -> ModelType | None:
        """Get one record by ID"""
        stmt = select(self.model).where(self.model.id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_field(self, db: AsyncSession, field: str, value: Any) -> ModelType | None:
        """Get one record by any field name"""
        stmt = select(self.model).where(getattr(self.model, field) == value)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_list(
        self,
        db: AsyncSession,
        *,
        filters: dict[str, Any] | None = None,
        offset: int = 0,
        limit: int = 20,
        order_by: str = "created_at",
        order_dir: str = "desc",
    ) -> tuple[Sequence[ModelType], int]:
        """Get paginated list with filters. Returns (records, total_count)"""
        query = select(self.model)
        count_stmt = select(func.count()).select_from(self.model)

        if filters:
            for field, value in filters.items():
                col = getattr(self.model, field, None)
                if col is not None:
                    query = query.where(col == value)
                    count_stmt = count_stmt.where(col == value) 

        # Get total count
        count_result = await db.execute(count_stmt)
        total = count_result.scalar() or 0

        # Apply ordering
        col = getattr(self.model, order_by, None)
        if col is not None:
            query = query.order_by(desc(col) if order_dir == "desc" else asc(col))

        # Apply pagination
        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        records = result.scalars().all()

        return records, total

    async def exists(self, db: AsyncSession, **filters: Any) -> bool:
        """Check if a record exists"""
        stmt = select(func.count()).select_from(self.model)
        for field, value in filters.items():
            stmt = stmt.where(getattr(self.model, field) == value)
        result = await db.execute(stmt)
        return (result.scalar() or 0) > 0

    async def count(self, db: AsyncSession, **filters: Any) -> int:
        """Count records matching filters"""
        stmt = select(func.count()).select_from(self.model)
        for field, value in filters.items():
            stmt = stmt.where(getattr(self.model, field) == value)
        result = await db.execute(stmt)
        return result.scalar() or 0

    async def create(self, db: AsyncSession, **kwargs: Any) -> ModelType:
        """Create a record. Uses flush() — caller must commit."""
        db_obj = self.model(**kwargs)
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def update(self, db: AsyncSession, db_obj: ModelType, **kwargs: Any) -> ModelType:
        """Update a record. Uses flush() — caller must commit."""
        for field, value in kwargs.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def delete(self, db: AsyncSession, id: UUID) -> bool:
        """Delete a record. Uses flush() — caller must commit."""
        obj = await self.get_by_id(db, id)
        if not obj:
            return False
        await db.delete(obj)
        await db.flush()
        return True