from uuid import uuid4

from httpx import AsyncClient


async def _create_material(async_client: AsyncClient, auth_headers: dict[str, str]) -> str:
    payload = {
        "name": "Order Material",
        "unit": "sheet",
        "current_stock": "50",
        "min_stock_alert": "5",
        "cost_per_unit": "0.20",
    }
    response = await async_client.post("/materials/", json=payload, headers=auth_headers)
    return response.json()["id"]


async def _create_walk_in_customer(
    async_client: AsyncClient, auth_headers: dict[str, str]
) -> str:
    payload = {
        "name": "Walk In",
        "phone": "555000111",
        "notes": "Drop-in",
    }
    response = await async_client.post(
        "/customers/walk-in",
        json=payload,
        headers=auth_headers,
    )
    return response.json()["id"]


async def _create_order(
    async_client: AsyncClient,
    auth_headers: dict[str, str],
    walk_in_customer_id: str,
) -> dict:
    payload = {
        "walk_in_customer_id": walk_in_customer_id,
        "items": [
            {
                "book_title": "Order Book",
                "copies": 1,
                "pages_per_copy": 12,
                "sides_per_page": 1,
                "printing_price": "1.25",
                "cover_type": None,
                "cover_price": "0",
                "binding_type": None,
                "binding_price": "0",
                "has_lamination": False,
                "lamination_price": "0",
                "extra_services": [],
            }
        ],
    }
    response = await async_client.post(
        "/orders/",
        json=payload,
        headers=auth_headers,
    )
    return response.json()


class TestCreateOrder:
    async def test_create_order_with_items(self, async_client: AsyncClient, auth_headers: dict[str, str]) -> None:
        await _create_material(async_client, auth_headers)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)

        response = await async_client.post(
            "/orders/",
            json={
                "walk_in_customer_id": walk_in_customer_id,
                "items": [
                    {
                        "book_title": "Intro",
                        "copies": 2,
                        "pages_per_copy": 10,
                        "sides_per_page": 1,
                        "printing_price": "1.50",
                        "cover_type": None,
                        "cover_price": "0",
                        "binding_type": None,
                        "binding_price": "0",
                        "has_lamination": False,
                        "lamination_price": "0",
                        "extra_services": [],
                    }
                ],
            },
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["walk_in_customer_id"] == walk_in_customer_id
        assert data["order_number"].startswith("ORD-")

    async def test_create_order_with_no_items_fails(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_material(async_client, auth_headers)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)

        response = await async_client.post(
            "/orders/",
            json={
                "walk_in_customer_id": walk_in_customer_id,
                "items": [],
            },
            headers=auth_headers,
        )

        assert response.status_code == 422

    async def test_create_order_with_walk_in_customer(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_material(async_client, auth_headers)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)

        response = await async_client.post(
            "/orders/",
            json={
                "walk_in_customer_id": walk_in_customer_id,
                "items": [
                    {
                        "book_title": "Walk In",
                        "copies": 1,
                        "pages_per_copy": 5,
                        "sides_per_page": 1,
                        "printing_price": "2.00",
                        "cover_type": None,
                        "cover_price": "0",
                        "binding_type": None,
                        "binding_price": "0",
                        "has_lamination": False,
                        "lamination_price": "0",
                        "extra_services": [],
                    }
                ],
            },
            headers=auth_headers,
        )

        assert response.status_code == 201
        assert response.json()["walk_in_customer_id"] == walk_in_customer_id

    async def test_create_order_unauthorized(self, async_client: AsyncClient) -> None:
        response = await async_client.post(
            "/orders/",
            json={
                "walk_in_customer_id": str(uuid4()),
                "items": [
                    {
                        "book_title": "Unauthorized",
                        "copies": 1,
                        "pages_per_copy": 3,
                        "sides_per_page": 1,
                        "printing_price": "1.00",
                        "cover_type": None,
                        "cover_price": "0",
                        "binding_type": None,
                        "binding_price": "0",
                        "has_lamination": False,
                        "lamination_price": "0",
                        "extra_services": [],
                    }
                ],
            },
        )

        assert response.status_code == 401


class TestListOrders:
    async def test_list_orders_with_pagination(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_material(async_client, auth_headers)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)

        await async_client.post(
            "/orders/",
            json={
                "walk_in_customer_id": walk_in_customer_id,
                "items": [
                    {
                        "book_title": "List A",
                        "copies": 1,
                        "pages_per_copy": 4,
                        "sides_per_page": 1,
                        "printing_price": "1.00",
                        "cover_type": None,
                        "cover_price": "0",
                        "binding_type": None,
                        "binding_price": "0",
                        "has_lamination": False,
                        "lamination_price": "0",
                        "extra_services": [],
                    }
                ],
            },
            headers=auth_headers,
        )
        await async_client.post(
            "/orders/",
            json={
                "walk_in_customer_id": walk_in_customer_id,
                "items": [
                    {
                        "book_title": "List B",
                        "copies": 1,
                        "pages_per_copy": 4,
                        "sides_per_page": 1,
                        "printing_price": "1.10",
                        "cover_type": None,
                        "cover_price": "0",
                        "binding_type": None,
                        "binding_price": "0",
                        "has_lamination": False,
                        "lamination_price": "0",
                        "extra_services": [],
                    }
                ],
            },
            headers=auth_headers,
        )

        response = await async_client.get(
            "/orders/",
            params={"offset": 0, "limit": 10},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert len(data["orders"]) >= 2


class TestGetOrder:
    async def test_get_order_by_id(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_material(async_client, auth_headers)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order = await _create_order(async_client, auth_headers, walk_in_customer_id)

        response = await async_client.get(
            f"/orders/{order['id']}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["id"] == order["id"]

    async def test_get_order_not_found(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await async_client.get(
            f"/orders/{uuid4()}",
            headers=auth_headers,
        )

        assert response.status_code == 404


class TestUpdateOrderStatus:
    async def test_update_order_status_flow(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_material(async_client, auth_headers)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order = await _create_order(async_client, auth_headers, walk_in_customer_id)

        response = await async_client.patch(
            f"/orders/{order['id']}/status",
            params={"status": "printing"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "printing"

        response = await async_client.patch(
            f"/orders/{order['id']}/status",
            params={"status": "ready"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ready"

        response = await async_client.patch(
            f"/orders/{order['id']}/status",
            params={"status": "delivered"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "delivered"


class TestDeleteOrder:
    async def test_delete_order_success(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_material(async_client, auth_headers)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order = await _create_order(async_client, auth_headers, walk_in_customer_id)

        response = await async_client.delete(
            f"/orders/{order['id']}",
            headers=auth_headers,
        )

        assert response.status_code == 204

        fetch_response = await async_client.get(
            f"/orders/{order['id']}",
            headers=auth_headers,
        )
        assert fetch_response.status_code == 404
