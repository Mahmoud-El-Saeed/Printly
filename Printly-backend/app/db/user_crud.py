from .base_crud import BaseCRUD
from app.models.users import Users
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class UserCRUD(BaseCRUD[Users]):
    model = Users

    @classmethod
    async def get_by_email(cls, db: AsyncSession, email: str) -> Users | None:
        """Get one user by email"""
        return await cls.get_by_field(db, "email", email)

    @classmethod
    async def get_active_by_id(cls, db: AsyncSession, user_id: UUID) -> Users | None:
        """Get one active user by ID"""
        stmt = select(cls.model).where(
            cls.model.id == user_id,
            cls.model.is_active,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
