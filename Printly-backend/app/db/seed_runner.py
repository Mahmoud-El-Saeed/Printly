"""Run: python -m app.db.seed_runner"""
import asyncio
from app.routes.db import AsyncSessionLocal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.subscription_plans import SubscriptionPlans
from app.db.seed import DEFAULT_PLANS


async def seed_plans(db: AsyncSession):
    """Plants default plans. Safe to run multiple times — won't duplicate."""
    added = 0
    updated = 0

    for plan_data in DEFAULT_PLANS:
        stmt = select(SubscriptionPlans).where(
            SubscriptionPlans.name == plan_data["name"]
        )
        existing = await db.execute(stmt)
        existing = existing.scalar_one_or_none()

        if existing:
            # Update existing plan (in case you changed something in seed.py)
            for key, value in plan_data.items():
                setattr(existing, key, value)
            updated += 1
        else:
            # Create new plan
            plan = SubscriptionPlans(**plan_data)
            db.add(plan)
            added += 1

    await db.commit()
    print(f"✅ Seed complete: {added} added, {updated} updated")

async def main():
    async with AsyncSessionLocal() as db:
        await seed_plans(db)

if __name__ == "__main__":

    asyncio.run(main())
