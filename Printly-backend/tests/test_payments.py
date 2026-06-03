from uuid import uuid4

from httpx import AsyncClient


async def _create_material(async_client: AsyncClient, auth_headers: dict[str, str]) -> str:
    payload = {
        "name": "Payment Material",
        "unit": "sheet",
        "current_stock": "30",
        "min_stock_alert": "3",
        "cost_per_unit": "0.15",
    }
    response = await async_client.post("/materials/", json=payload, headers=auth_headers)
    return response.json()["id"]


async def _create_walk_in_customer(
    async_client: AsyncClient, auth_headers: dict[str, str]
) -> str:
    payload = {
        "name": "Payment Walk In",
        "phone": "555123999",
        "notes": "Cash customer",
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
                "book_title": "Receipt Book",
                "copies": 1,
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
    }
    response = await async_client.post(
        "/orders/",
        json=payload,
        headers=auth_headers,
    )
    return response.json()


async def _create_payment(
    async_client: AsyncClient,
    auth_headers: dict[str, str],
    order_id: str,
    amount: str = "15.00",
) -> dict:
    payload = {
        "order_id": order_id,
        "amount": amount,
        "payment_method": "cash",
        "reference": "POS-1",
        "notes": "Paid in full",
    }
    response = await async_client.post(
        "/payments/",
        json=payload,
        headers=auth_headers,
    )
    return response.json()


class TestCreatePayment:
    async def test_create_payment_for_order(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_material(async_client, auth_headers)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order = await _create_order(async_client, auth_headers, walk_in_customer_id)

        response = await async_client.post(
            "/payments/",
            json={
                "order_id": order["id"],
                "amount": "15.00",
                "payment_method": "cash",
                "reference": "POS-2",
                "notes": "Paid",
            },
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["order_id"] == order["id"]
        assert data["payment_method"] == "cash"

    async def test_create_payment_invalid_data(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_material(async_client, auth_headers)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order = await _create_order(async_client, auth_headers, walk_in_customer_id)

        response = await async_client.post(
            "/payments/",
            json={
                "order_id": order["id"],
                "amount": "-5",
                "payment_method": "cash",
            },
            headers=auth_headers,
        )

        assert response.status_code == 422

    async def test_create_payment_unauthorized(self, async_client: AsyncClient) -> None:
        response = await async_client.post(
            "/payments/",
            json={
                "order_id": str(uuid4()),
                "amount": "10",
                "payment_method": "cash",
            },
        )

        assert response.status_code == 401


class TestListPayments:
    async def test_list_payments_for_order(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_material(async_client, auth_headers)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order = await _create_order(async_client, auth_headers, walk_in_customer_id)
        await _create_payment(async_client, auth_headers, order["id"])

        response = await async_client.get(
            "/payments/",
            params={"order_id": order["id"], "offset": 0, "limit": 10},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert len(data["payments"]) >= 1


class TestGetPayment:
    async def test_get_payment_by_id(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_material(async_client, auth_headers)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order = await _create_order(async_client, auth_headers, walk_in_customer_id)
        payment = await _create_payment(async_client, auth_headers, order["id"])

        response = await async_client.get(
            f"/payments/{payment['id']}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["id"] == payment["id"]


class TestUpdatePayment:
    async def test_update_payment_success(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_material(async_client, auth_headers)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order = await _create_order(async_client, auth_headers, walk_in_customer_id)
        payment = await _create_payment(async_client, auth_headers, order["id"])

        response = await async_client.put(
            f"/payments/{payment['id']}",
            json={"notes": "Updated note"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["notes"] == "Updated note"


class TestDeletePayment:
    async def test_delete_payment_success(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_material(async_client, auth_headers)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order = await _create_order(async_client, auth_headers, walk_in_customer_id)
        payment = await _create_payment(async_client, auth_headers, order["id"])

        response = await async_client.delete(
            f"/payments/{payment['id']}",
            headers=auth_headers,
        )

        assert response.status_code == 204

        fetch_response = await async_client.get(
            f"/payments/{payment['id']}",
            headers=auth_headers,
        )
        assert fetch_response.status_code == 404
