from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from .base_crud import BaseCRUD
from app.models import ActivationCodes


class ActivationCodeCRUD(BaseCRUD[ActivationCodes]):
    model = ActivationCodes

    @classmethod
    async def get_by_code(
        cls,
        db: AsyncSession,
        code: str,
    ) -> ActivationCodes | None:
        """Get an activation code by its code value."""
        stmt = select(ActivationCodes).where(ActivationCodes.code == code)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @classmethod
    async def icrement_used_count(
        cls,
        db: AsyncSession,
        code_id: UUID,
    ) -> None:
        """Increment the used count of an activation code. you must commit or rollback"""
        stmt = (
            select(ActivationCodes)
            .where(ActivationCodes.id == code_id)
            .with_for_update()
        )
        result = await db.execute(stmt)
        activation_code = result.scalar_one_or_none()
        if activation_code:
            activation_code.used_count += 1
            await db.flush()
