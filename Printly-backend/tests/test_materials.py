from uuid import uuid4

from httpx import AsyncClient


async def _create_material(async_client: AsyncClient, auth_headers: dict[str, str], **overrides):
    payload = {
        "name": "Glossy Paper",
        "unit": "sheet",
        "current_stock": "100",
        "min_stock_alert": "10",
        "cost_per_unit": "0.25",
        "price_per_unit": "0.50",
    }
    payload.update(overrides)
    return await async_client.post("/materials/", json=payload, headers=auth_headers)


async def _create_book(
    async_client: AsyncClient,
    auth_headers: dict[str, str],
    material_id: str,
    **overrides,
) -> str:
    payload = {
        "title": "Test Book",
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
        "name": "Walk In Customer",
        "phone": "123456789",
        "notes": "Regular",
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
    book_id: str,
) -> str:
    payload = {
        "walk_in_customer_id": walk_in_customer_id,
        "items": [
            {
                "book_id": book_id,
                "copies": 1,
            }
        ],
    }
    response = await async_client.post(
        "/orders/",
        json=payload,
        headers=auth_headers,
    )
    return response.json()["id"]


async def _create_material_transaction(
    async_client: AsyncClient,
    auth_headers: dict[str, str],
    material_id: str,
    order_id: str,
):
    payload = {
        "quantity": "1",
        "transaction_type": "consumption",
        "order_id": order_id,
        "notes": "Used in order",
    }
    return await async_client.post(
        f"/materials/{material_id}/transactions",
        json=payload,
        headers=auth_headers,
    )


class TestCreateMaterial:
    async def test_create_material_success(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await _create_material(async_client, auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Glossy Paper"
        assert data["unit"] == "sheet"

    async def test_create_material_invalid(self, async_client: AsyncClient, auth_headers: dict[str, str]) -> None:
        response = await async_client.post("/materials/", json={}, headers=auth_headers)
        assert response.status_code == 422

    async def test_create_material_unauthorized(self, async_client: AsyncClient) -> None:
        response = await async_client.post("/materials/", json={"name": "Paper"})
        assert response.status_code == 401


class TestListMaterials:
    async def test_list_materials_with_pagination(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        await _create_material(async_client, auth_headers, name="Mat A")
        await _create_material(async_client, auth_headers, name="Mat B")

        response = await async_client.get(
            "/materials/",
            params={"offset": 0, "limit": 10},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert len(data["items"]) >= 2


class TestGetMaterial:
    async def test_get_material_by_id(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        create_response = await _create_material(async_client, auth_headers)
        material_id = create_response.json()["id"]

        response = await async_client.get(
            f"/materials/{material_id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["id"] == material_id

    async def test_get_material_not_found(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await async_client.get(
            f"/materials/{uuid4()}",
            headers=auth_headers,
        )
        assert response.status_code == 404


class TestUpdateMaterial:
    async def test_update_material_success(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        create_response = await _create_material(async_client, auth_headers)
        material_id = create_response.json()["id"]

        response = await async_client.put(
            f"/materials/{material_id}",
            json={"name": "Updated Paper"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Updated Paper"


class TestDeleteMaterial:
    async def test_delete_material_success(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        create_response = await _create_material(async_client, auth_headers)
        material_id = create_response.json()["id"]

        response = await async_client.delete(
            f"/materials/{material_id}",
            headers=auth_headers,
        )

        assert response.status_code == 204

        fetch_response = await async_client.get(
            f"/materials/{material_id}",
            headers=auth_headers,
        )
        assert fetch_response.status_code == 404

    async def test_delete_material_used_in_order(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        material_response = await _create_material(async_client, auth_headers, name="Order Mat 2")
        material_id = material_response.json()["id"]

        await _create_material(async_client, auth_headers, name="Order Mat For Order")
        book_id = await _create_book(async_client, auth_headers, material_id)
        walk_in_customer_id = await _create_walk_in_customer(async_client, auth_headers)
        order_id = await _create_order(async_client, auth_headers, walk_in_customer_id, book_id)

        transaction_response = await _create_material_transaction(
            async_client, auth_headers, material_id, order_id
        )
        assert transaction_response.status_code == 201

        delete_response = await async_client.delete(
            f"/materials/{material_id}",
            headers=auth_headers,
        )
        assert delete_response.status_code == 204

        fetch_response = await async_client.get(
            f"/materials/{material_id}",
            headers=auth_headers,
        )
        assert fetch_response.status_code == 404
