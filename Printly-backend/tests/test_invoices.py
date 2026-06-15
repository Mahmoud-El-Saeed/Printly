from uuid import uuid4

from httpx import AsyncClient


async def _create_material(async_client: AsyncClient, auth_headers: dict[str, str], **overrides) -> str:
    payload = {
        "name": "Invoice Mat",
        "unit": "sheet",
        "current_stock": "50",
        "min_stock_alert": "5",
        "cost_per_unit": "0.20",
        "price_per_unit": "0.50",
    }
    payload.update(overrides)
    response = await async_client.post("/materials/", json=payload, headers=auth_headers)
    return response.json()["id"]


async def _create_book(
    async_client: AsyncClient,
    auth_headers: dict[str, str],
    material_id: str,
    **overrides,
) -> str:
    payload = {
        "title": "Invoice Book",
        "total_pages": 10,
        "color_mode": "bw",
        "sides_per_page": 1,
        "copies": 1,
        "binding_type": None,
        "has_lamination": False,
        "materials": [
            {
                "material_id": material_id,
                "quantity_per_copy": "5",
            }
        ],
    }
    payload.update(overrides)
    response = await async_client.post("/books/", json=payload, headers=auth_headers)
    assert response.status_code == 201, f"Book creation failed: {response.text}"
    return response.json()["id"]


async def _create_walk_in_customer(
    async_client: AsyncClient, auth_headers: dict[str, str]
) -> str:
    payload = {
        "name": "Invoice Walk In",
        "phone": "555444333",
        "notes": "Invoice test",
    }
    response = await async_client.post(
        "/customers/walk-in",
        json=payload,
        headers=auth_headers,
    )
    return response.json()["id"]


async def _create_and_deliver_order(
    async_client: AsyncClient,
    auth_headers: dict[str, str],
    walk_in_customer_id: str,
    book_id: str,
) -> dict:
    payload = {
        "walk_in_customer_id": walk_in_customer_id,
        "items": [{"book_id": book_id, "copies": 1}],
    }
    response = await async_client.post("/orders/", json=payload, headers=auth_headers)
    order = response.json()

    await async_client.patch(f"/orders/{order['id']}/status", params={"status": "printing"}, headers=auth_headers)
    await async_client.patch(f"/orders/{order['id']}/status", params={"status": "ready"}, headers=auth_headers)
    await async_client.patch(f"/orders/{order['id']}/status", params={"status": "delivered"}, headers=auth_headers)

    return order


class TestGenerateInvoice:
    async def test_generate_invoice_success(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        material_id = await _create_material(async_client, auth_headers)
        book_id = await _create_book(async_client, auth_headers, material_id)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order = await _create_and_deliver_order(async_client, auth_headers, walk_in_customer_id, book_id)

        response = await async_client.post(
            "/invoices/",
            params={"order_id": order["id"], "notes": "Test invoice"},
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["invoice_number"].startswith("INV-")
        assert data["order_id"] == order["id"]
        assert data["customer_name"] is not None
        assert data["notes"] == "Test invoice"
        assert len(data["items"]) == 1

    async def test_generate_invoice_duplicate(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        material_id = await _create_material(async_client, auth_headers)
        book_id = await _create_book(async_client, auth_headers, material_id)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order = await _create_and_deliver_order(async_client, auth_headers, walk_in_customer_id, book_id)

        await async_client.post(
            "/invoices/",
            params={"order_id": order["id"]},
            headers=auth_headers,
        )

        response = await async_client.post(
            "/invoices/",
            params={"order_id": order["id"]},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "already exists" in response.text.lower()

    async def test_generate_invoice_non_delivered(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        material_id = await _create_material(async_client, auth_headers)
        book_id = await _create_book(async_client, auth_headers, material_id)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)

        payload = {
            "walk_in_customer_id": walk_in_customer_id,
            "items": [{"book_id": book_id, "copies": 1}],
        }
        response = await async_client.post("/orders/", json=payload, headers=auth_headers)
        order = response.json()

        response = await async_client.post(
            "/invoices/",
            params={"order_id": order["id"]},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "delivered" in response.text.lower()

    async def test_generate_invoice_unauthorized(
        self, async_client: AsyncClient
    ) -> None:
        response = await async_client.post(
            "/invoices/",
            params={"order_id": str(uuid4())},
        )
        assert response.status_code == 401


class TestListInvoices:
    async def test_list_invoices(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        material_id = await _create_material(async_client, auth_headers)
        book_id = await _create_book(async_client, auth_headers, material_id)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order = await _create_and_deliver_order(async_client, auth_headers, walk_in_customer_id, book_id)

        await async_client.post(
            "/invoices/",
            params={"order_id": order["id"]},
            headers=auth_headers,
        )

        response = await async_client.get(
            "/invoices/",
            params={"offset": 0, "limit": 10},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert len(data["items"]) >= 1


class TestGetInvoice:
    async def test_get_invoice_by_id(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        material_id = await _create_material(async_client, auth_headers)
        book_id = await _create_book(async_client, auth_headers, material_id)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order = await _create_and_deliver_order(async_client, auth_headers, walk_in_customer_id, book_id)

        invoice_response = await async_client.post(
            "/invoices/",
            params={"order_id": order["id"]},
            headers=auth_headers,
        )
        invoice_id = invoice_response.json()["id"]

        response = await async_client.get(
            f"/invoices/{invoice_id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == invoice_id
        assert data["order_number"] == order["order_number"]
        assert len(data["items"]) >= 1

    async def test_get_invoice_not_found(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await async_client.get(
            f"/invoices/{uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404
