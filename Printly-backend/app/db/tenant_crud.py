from .base_crud import BaseCRUD
from app.models.tenants import Tenants
from sqlalchemy.ext.asyncio import AsyncSession


class TenantCRUD(BaseCRUD[Tenants]):
    model = Tenants

    @classmethod
    async def get_by_slug(cls, db: AsyncSession, slug: str) -> Tenants | None:
        """Get one tenant by slug"""
        return await cls.get_by_field(db, "slug", slug)
