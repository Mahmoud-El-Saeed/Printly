from uuid import uuid4

from httpx import AsyncClient


async def _create_walk_in_customer(
    async_client: AsyncClient, auth_headers: dict[str, str], **overrides
):
    payload = {
        "name": "Walk In Customer",
        "phone": "123456789",
        "notes": "Regular",
    }
    payload.update(overrides)
    return await async_client.post(
        "/customers/walk-in",
        json=payload,
        headers=auth_headers,
    )


class TestCreateWalkInCustomer:
    async def test_create_walk_in_customer_success(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await _create_walk_in_customer(async_client, auth_headers)
        assert response.status_code == 201
        assert response.json()["name"] == "Walk In Customer"

    async def test_create_walk_in_customer_invalid(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await async_client.post(
            "/customers/walk-in",
            json={},
            headers=auth_headers,
        )
        assert response.status_code == 422

    async def test_create_walk_in_customer_unauthorized(
        self, async_client: AsyncClient
    ) -> None:
        response = await async_client.post(
            "/customers/walk-in",
            json={"name": "No Auth"},
        )
        assert response.status_code == 401


class TestListWalkInCustomers:
    async def test_list_walk_in_customers(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_walk_in_customer(async_client, auth_headers, name="Walk In A")
        await _create_walk_in_customer(async_client, auth_headers, name="Walk In B")

        response = await async_client.get(
            "/customers/walk-in",
            params={"offset": 0, "limit": 10},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert len(data["customers"]) >= 2


class TestGetWalkInCustomer:
    async def test_get_walk_in_customer_by_id(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        create_response = await _create_walk_in_customer(async_client, auth_headers)
        customer_id = create_response.json()["id"]

        response = await async_client.get(
            f"/customers/walk-in/{customer_id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["id"] == customer_id

    async def test_get_walk_in_customer_not_found(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await async_client.get(
            f"/customers/walk-in/{uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestUpdateWalkInCustomer:
    async def test_update_walk_in_customer(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        create_response = await _create_walk_in_customer(async_client, auth_headers)
        customer_id = create_response.json()["id"]

        response = await async_client.put(
            f"/customers/walk-in/{customer_id}",
            json={"name": "Updated Name"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"


class TestDeleteWalkInCustomer:
    async def test_delete_walk_in_customer(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        create_response = await _create_walk_in_customer(async_client, auth_headers)
        customer_id = create_response.json()["id"]

        response = await async_client.delete(
            f"/customers/walk-in/{customer_id}",
            headers=auth_headers,
        )
        assert response.status_code == 204

        fetch_response = await async_client.get(
            f"/customers/walk-in/{customer_id}",
            headers=auth_headers,
        )
        assert fetch_response.status_code == 404

    async def test_delete_walk_in_customer_not_found(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await async_client.delete(
            f"/customers/walk-in/{uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404
