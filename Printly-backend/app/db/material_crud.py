from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from .base_crud import BaseCRUD
from app.models import Materials, MaterialTransactions


class MaterialCRUD(BaseCRUD[Materials]):
    model = Materials

    @classmethod
    async def get_materials_by_ids(
        cls,
        db: AsyncSession,
        material_ids: list[UUID],
        tenant_id: UUID,
    ) -> list[Materials]:
        """Get multiple materials by their IDs, scoped to a tenant."""
        stmt = (
            select(Materials)
            .where(Materials.id.in_(material_ids))
            .where(Materials.tenant_id == tenant_id)
        )
        result = await db.execute(stmt)
        return result.scalars().all()


class MaterialTransactionCRUD(BaseCRUD[MaterialTransactions]):
    model = MaterialTransactions
