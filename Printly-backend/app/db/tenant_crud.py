from .base_crud import BaseCRUD
from app.models.tenants import Tenants
from sqlalchemy.ext.asyncio import AsyncSession


class TenantCRUD(BaseCRUD[Tenants]):
    def __init__(self):
        super().__init__(Tenants)

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Tenants | None:
        """Get one tenant by slug"""
        return await self.get_by_field(db, "slug", slug)
