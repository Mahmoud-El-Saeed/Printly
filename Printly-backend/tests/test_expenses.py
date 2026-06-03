from uuid import uuid4

from httpx import AsyncClient


async def _create_expense(
    async_client: AsyncClient, auth_headers: dict[str, str], **overrides
):
    payload = {
        "category": "rent",
        "amount": "500.00",
        "description": "Monthly rent",
        "expense_date": "2025-01-15",
    }
    payload.update(overrides)
    return await async_client.post("/expenses/", json=payload, headers=auth_headers)


class TestCreateExpense:
    async def test_create_expense_success(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await _create_expense(async_client, auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["category"] == "rent"
        assert data["amount"] == "500.00"

    async def test_create_expense_invalid(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await async_client.post(
            "/expenses/",
            json={},
            headers=auth_headers,
        )
        assert response.status_code == 422

    async def test_create_expense_unauthorized(self, async_client: AsyncClient) -> None:
        response = await async_client.post(
            "/expenses/",
            json={"category": "rent", "amount": "100.00", "expense_date": "2025-01-15"},
        )
        assert response.status_code == 401


class TestListExpenses:
    async def test_list_expenses(self, async_client: AsyncClient, auth_headers: dict[str, str]) -> None:
        await _create_expense(async_client, auth_headers, category="rent")
        await _create_expense(
            async_client,
            auth_headers,
            category="supplies",
            amount="200.00",
            expense_date="2025-02-01",
        )

        response = await async_client.get(
            "/expenses/",
            params={"offset": 0, "limit": 10},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert len(data["expenses"]) >= 2

    async def test_list_expenses_filter_by_category(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_expense(async_client, auth_headers, category="rent")
        await _create_expense(async_client, auth_headers, category="supplies")

        response = await async_client.get(
            "/expenses/",
            params={"category": "rent", "offset": 0, "limit": 10},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert all(expense["category"] == "rent" for expense in data["expenses"])


class TestGetExpense:
    async def test_get_expense_by_id(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        create_response = await _create_expense(async_client, auth_headers)
        expense_id = create_response.json()["id"]

        response = await async_client.get(
            f"/expenses/{expense_id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["id"] == expense_id

    async def test_get_expense_not_found(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await async_client.get(
            f"/expenses/{uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestUpdateExpense:
    async def test_update_expense(self, async_client: AsyncClient, auth_headers: dict[str, str]) -> None:
        create_response = await _create_expense(async_client, auth_headers)
        expense_id = create_response.json()["id"]

        response = await async_client.put(
            f"/expenses/{expense_id}",
            json={"amount": "750.00"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["amount"] == "750.00"


class TestDeleteExpense:
    async def test_delete_expense(self, async_client: AsyncClient, auth_headers: dict[str, str]) -> None:
        create_response = await _create_expense(async_client, auth_headers)
        expense_id = create_response.json()["id"]

        response = await async_client.delete(
            f"/expenses/{expense_id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

        fetch_response = await async_client.get(
            f"/expenses/{expense_id}",
            headers=auth_headers,
        )
        assert fetch_response.status_code == 404

    async def test_delete_expense_not_found(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await async_client.delete(
            f"/expenses/{uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404
