from .base_crud import BaseCRUD
from app.models.subscription_plans import SubscriptionPlans
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class PlanCRUD(BaseCRUD[SubscriptionPlans]):
    def __init__(self):
        super().__init__(SubscriptionPlans)

    async def get_by_name(
        self, db: AsyncSession, name: str
    ) -> SubscriptionPlans | None:
        stmt = select(self.model).where(
            self.model.name == name,
            self.model.is_active,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()