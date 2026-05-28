from .base_crud import BaseCRUD
from app.models.subscription_plans import SubscriptionPlans
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class PlanCRUD(BaseCRUD[SubscriptionPlans]):
    model = SubscriptionPlans

    @classmethod
    async def get_by_name(
        cls, db: AsyncSession, name: str
    ) -> SubscriptionPlans | None:
        stmt = select(cls.model).where(
            cls.model.name == name,
            cls.model.is_active,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()