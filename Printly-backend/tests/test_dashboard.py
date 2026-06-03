from httpx import AsyncClient


class TestDashboardEndpoints:
    async def test_dashboard_revenue(self, async_client: AsyncClient, auth_headers: dict[str, str]) -> None:
        response = await async_client.get("/dashboard/revenue", headers=auth_headers)
        assert response.status_code == 200

    async def test_dashboard_expenses(self, async_client: AsyncClient, auth_headers: dict[str, str]) -> None:
        response = await async_client.get("/dashboard/expenses", headers=auth_headers)
        assert response.status_code == 200

    async def test_dashboard_profit(self, async_client: AsyncClient, auth_headers: dict[str, str]) -> None:
        response = await async_client.get("/dashboard/profit", headers=auth_headers)
        assert response.status_code == 200

    async def test_dashboard_orders(self, async_client: AsyncClient, auth_headers: dict[str, str]) -> None:
        response = await async_client.get("/dashboard/orders", headers=auth_headers)
        assert response.status_code == 200

    async def test_dashboard_top_materials(self, async_client: AsyncClient, auth_headers: dict[str, str]) -> None:
        response = await async_client.get("/dashboard/top-materials", headers=auth_headers)
        assert response.status_code == 200

    async def test_dashboard_top_customers(self, async_client: AsyncClient, auth_headers: dict[str, str]) -> None:
        response = await async_client.get("/dashboard/top-customers", headers=auth_headers)
        assert response.status_code == 200


class TestDashboardOverview:
    async def test_dashboard_overview(self, async_client: AsyncClient, auth_headers: dict[str, str]) -> None:
        response = await async_client.get("/dashboard/overview", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "revenue" in data
        assert "expenses" in data
        assert "profit" in data
        assert "orders" in data
        assert "top_materials" in data
        assert "top_customers" in data


class TestDashboardUnauthorized:
    async def test_dashboard_unauthorized(self, async_client: AsyncClient) -> None:
        response = await async_client.get("/dashboard/overview")
        assert response.status_code == 401
