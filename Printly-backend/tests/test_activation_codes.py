from decimal import Decimal
from uuid import uuid4

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SubscriptionPlans


async def _create_plan(db_session: AsyncSession) -> SubscriptionPlans:
    plan = SubscriptionPlans(
        name=f"Plan-{uuid4().hex[:6]}",
        price_monthly=Decimal("29.99"),
        max_customers=100,
        max_users=5,
        features={"test": True},
        is_active=True,
    )
    db_session.add(plan)
    await db_session.commit()
    return plan


class TestCreateActivationCode:
    async def test_create_activation_code_success(
        self,
        async_client: AsyncClient,
        admin_auth_headers: dict[str, str],
        db_session: AsyncSession,
    ) -> None:
        plan = await _create_plan(db_session)

        response = await async_client.post(
            "/activation-codes/",
            json={
                "plan_id": str(plan.id),
                "duration_days": 30,
                "max_uses": 2,
            },
            headers=admin_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["plan_id"] == str(plan.id)
        assert data["max_uses"] == 2

    async def test_create_activation_code_invalid_plan(
        self, async_client: AsyncClient, admin_auth_headers: dict[str, str]
    ) -> None:
        response = await async_client.post(
            "/activation-codes/",
            json={
                "plan_id": str(uuid4()),
                "duration_days": 30,
                "max_uses": 1,
            },
            headers=admin_auth_headers,
        )

        assert response.status_code == 400

    async def test_create_activation_code_staff_forbidden(
        self, async_client: AsyncClient, auth_headers: dict[str, str], db_session: AsyncSession
    ) -> None:
        plan = await _create_plan(db_session)

        response = await async_client.post(
            "/activation-codes/",
            json={
                "plan_id": str(plan.id),
                "duration_days": 30,
                "max_uses": 1,
            },
            headers=auth_headers,
        )

        assert response.status_code == 403


class TestListActivationCodes:
    async def test_list_activation_codes(
        self,
        async_client: AsyncClient,
        admin_auth_headers: dict[str, str],
        db_session: AsyncSession,
    ) -> None:
        plan = await _create_plan(db_session)

        await async_client.post(
            "/activation-codes/",
            json={
                "plan_id": str(plan.id),
                "duration_days": 30,
                "max_uses": 1,
            },
            headers=admin_auth_headers,
        )
        await async_client.post(
            "/activation-codes/",
            json={
                "plan_id": str(plan.id),
                "duration_days": 60,
                "max_uses": 2,
            },
            headers=admin_auth_headers,
        )

        response = await async_client.get(
            "/activation-codes/",
            params={"offset": 0, "limit": 10},
            headers=admin_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert len(data["activation_codes"]) >= 2


class TestRedeemActivationCode:
    async def test_redeem_activation_code_invalid(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await async_client.post(
            "/activation-codes/redeem",
            json={"code": "INVALID"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False

    async def test_redeem_activation_code_valid(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
        admin_auth_headers: dict[str, str],
        db_session: AsyncSession,
    ) -> None:
        plan = await _create_plan(db_session)

        create_response = await async_client.post(
            "/activation-codes/",
            json={
                "plan_id": str(plan.id),
                "duration_days": 30,
                "max_uses": 1,
            },
            headers=admin_auth_headers,
        )
        code = create_response.json()["code"]

        redeem_response = await async_client.post(
            "/activation-codes/redeem",
            json={"code": code},
            headers=auth_headers,
        )

        assert redeem_response.status_code == 200
        data = redeem_response.json()
        assert data["success"] is True
        assert data["plan_name"]
