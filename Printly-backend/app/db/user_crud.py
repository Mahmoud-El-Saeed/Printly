from .base_crud import BaseCRUD
from app.models.users import Users
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class UserCRUD(BaseCRUD[Users]):
    def __init__(self):
        super().__init__(Users)

    async def get_by_email(self, db: AsyncSession, email: str) -> Users | None:
        """Get one user by email"""
        return await self.get_by_field(db, "email", email)

    async def get_active_by_id(self, db: AsyncSession, user_id: UUID) -> Users | None:
        """Get one active user by ID"""
        stmt = select(self.model).where(
            self.model.id == user_id,
            self.model.is_active,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
