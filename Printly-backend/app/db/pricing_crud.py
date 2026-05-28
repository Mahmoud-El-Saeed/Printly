from .base_crud import BaseCRUD
from app.models import PricingRules, CustomerPricing
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from uuid import UUID
from typing import Sequence


class PricingRuleCRUD(BaseCRUD[PricingRules]):
    model = PricingRules

    @classmethod
    async def search_pricing_rules(
        cls,
        db: AsyncSession,
        tenant_id: UUID,
        component_name: str | None = None,
        component_type: str | None = None,
        is_active: bool | None = None,
        offset: int = 0,
        limit: int = 10,
        order_by: str = "created_at",
        order_dir: str = "desc",
    ) -> tuple[Sequence[PricingRules], int] | None:
        """
        Search for pricing rules with optional filters and pagination.
        """
        query = select(cls.model).where(cls.model.tenant_id == tenant_id)

        if component_name:
            query = query.where(cls.model.component_name.ilike(f"%{component_name}%"))
        if component_type:
            query = query.where(cls.model.component_type == component_type)
        if is_active is not None:
            query = query.where(cls.model.is_active == is_active)
        total_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(total_query)
        total_count = total_result.scalar_one()
        if order_by in ["component_name", "component_type", "price", "created_at"]:
            if order_dir == "desc":
                query = query.order_by(getattr(cls.model, order_by).desc())
            else:
                query = query.order_by(getattr(cls.model, order_by).asc())
        result = await db.execute(query.offset(offset).limit(limit))
        pricing_rules = result.scalars().all()
        return pricing_rules, total_count


class CustomerPricingCRUD(BaseCRUD[CustomerPricing]):
    model = CustomerPricing
