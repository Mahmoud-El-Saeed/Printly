from typing import Type, TypeVar, Generic, Sequence, Any, ClassVar
from uuid import UUID
from sqlalchemy import select, func, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseCRUD(Generic[ModelType]):
    model: ClassVar[Type[ModelType]]

    @classmethod
    async def get_by_id(cls, db: AsyncSession, id: UUID) -> ModelType | None:
        """Get one record by ID"""
        stmt = select(cls.model).where(cls.model.id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @classmethod
    async def get_by_field(cls, db: AsyncSession, field: str, value: Any) -> ModelType | None:
        """Get one record by any field name"""
        stmt = select(cls.model).where(getattr(cls.model, field) == value)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @classmethod
    async def get_list(
        cls,
        db: AsyncSession,
        *,
        filters: dict[str, Any] | None = None,
        offset: int = 0,
        limit: int = 20,
        order_by: str = "created_at",
        order_dir: str = "desc",
    ) -> tuple[Sequence[ModelType], int]:
        """Get paginated list with filters. Returns (records, total_count)"""
        query = select(cls.model)
        count_stmt = select(func.count()).select_from(cls.model)

        if filters:
            for field, value in filters.items():
                col = getattr(cls.model, field, None)
                if col is not None:
                    query = query.where(col == value)
                    count_stmt = count_stmt.where(col == value)

        # Get total count
        count_result = await db.execute(count_stmt)
        total = count_result.scalar() or 0

        # Apply ordering
        col = getattr(cls.model, order_by, None)
        if col is not None:
            query = query.order_by(desc(col) if order_dir == "desc" else asc(col))

        # Apply pagination
        query = query.offset(offset).limit(limit)
        result = await db.execute(query)
        records = result.scalars().all()

        return records, total

    @classmethod
    async def exists(cls, db: AsyncSession, **filters: Any) -> bool:
        """Check if a record exists"""
        stmt = select(func.count()).select_from(cls.model)
        for field, value in filters.items():
            stmt = stmt.where(getattr(cls.model, field) == value)
        result = await db.execute(stmt)
        return (result.scalar() or 0) > 0

    @classmethod
    async def count(cls, db: AsyncSession, **filters: Any) -> int:
        """Count records matching filters"""
        stmt = select(func.count()).select_from(cls.model)
        for field, value in filters.items():
            stmt = stmt.where(getattr(cls.model, field) == value)
        result = await db.execute(stmt)
        return result.scalar() or 0

    @classmethod
    async def create(cls, db: AsyncSession, **kwargs: Any) -> ModelType:
        """Create a record. Uses flush() — caller must commit."""
        db_obj = cls.model(**kwargs)
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    @classmethod
    async def update(cls, db: AsyncSession, db_obj: ModelType, **kwargs: Any) -> ModelType:
        """Update a record. Uses flush() — caller must commit."""
        for field, value in kwargs.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    @classmethod
    async def delete(cls, db: AsyncSession, id: UUID) -> bool:
        """Delete a record. Uses flush() — caller must commit."""
        obj = await cls.get_by_id(db, id)
        if not obj:
            return False
        await db.delete(obj)
        await db.flush()
        return True