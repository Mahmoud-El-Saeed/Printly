"""Run: python -m app.db.seed_runner [--demo]"""
import asyncio
import sys

from rich import print
from sqlalchemy.ext.asyncio import AsyncSession

from app.routes.db import AsyncSessionLocal
from sqlalchemy import select

from dotenv import load_dotenv
import os

# ── Plans Seed ─────────────────────────────────────────────────────
from app.db.seed import DEFAULT_PLANS
from app.models import SubscriptionPlans, Users
from app.enums import UserRole
from app.core.security import hash_password


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
            for key, value in plan_data.items():
                setattr(existing, key, value)
            updated += 1
        else:
            plan = SubscriptionPlans(**plan_data)
            db.add(plan)
            added += 1

    await db.commit()
    print(f"✅ Seed complete: {added} added, {updated} updated")


async def seed_admin(db: AsyncSession):
    """Seeds the admin user. Safe to run multiple times — won't duplicate."""

    if load_dotenv(".env"):
        admin_gmail = os.getenv("ADMIN_GMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")
    else:
        print("⚠️  Warning: .env file not found. Using default admin credentials.")
        raise Exception("Admin credentials not found in .env file.")

    admin = await db.execute(select(Users).where(Users.email == admin_gmail))
    admin = admin.scalar_one_or_none()
    if admin:
        print("✅ Admin user already exists. No changes made.")
    else:
        try:
            new_admin = Users(
                full_name="Admin User",
                email=admin_gmail,
                password_hash=hash_password(admin_password),
                role=UserRole.ADMIN,
            )
            db.add(new_admin)
            await db.commit()
            print("✅ Admin user created successfully.")
        except Exception as e:
            await db.rollback()
            print(f"❌ Failed to create admin user: {e}")


# ── Demo Seed ───────────────────────────────────────────────────────
async def seed_demo(db: AsyncSession):
    """Seeds full demo data for testing."""
    from app.db.seed_demo import seed_demo_data
    await seed_demo_data(db)


async def main():
    args = sys.argv[1:]
    demo = "--demo" in args

    if demo:
        async with AsyncSessionLocal() as db:
            await seed_demo(db)
    else:
        async with AsyncSessionLocal() as db:
            await seed_admin(db)
            await seed_plans(db)


if __name__ == "__main__":
    asyncio.run(main())
