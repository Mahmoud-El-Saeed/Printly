from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession



async def test_register_customer(async_client: AsyncClient) -> None:
    payload = {
        "email": "customer@example.com",
        "password": "StrongPass123",
        "full_name": "Test Customer",
    }

    response = await async_client.post("/auth/register/customer", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["full_name"] == payload["full_name"]
    assert data["role"] == "customer"
    assert "user_id" in data


async def test_register_duplicate_email(async_client: AsyncClient) -> None:
    payload = {
        "email": "dup@example.com",
        "password": "Pass1234",
        "full_name": "Test",
    }

    response1 = await async_client.post("/auth/register/customer", json=payload)
    assert response1.status_code == 200

    response2 = await async_client.post("/auth/register/customer", json=payload)
    assert response2.status_code in (400, 409)



async def test_login_returns_tokens(
    async_client: AsyncClient,
    db_session: AsyncSession,
    create_user,
) -> None:
    user, plain_password = await create_user(db_session)

    response = await async_client.post(
        "/auth/login",
        data={
            "username": user.email,
            "password": plain_password,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["refresh_token"]



async def test_login_invalid_credentials(async_client: AsyncClient) -> None:
    response = await async_client.post(
        "/auth/login",
        data={
            "username": "unknown@example.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"



async def test_refresh_token_flow(
    async_client: AsyncClient,
    db_session: AsyncSession,
    create_user,
) -> None:
    user, plain_password = await create_user(db_session)

    login_response = await async_client.post(
        "/auth/login",
        data={
            "username": user.email,
            "password": plain_password,
        },
    )
    assert login_response.status_code == 200
    refresh_token = login_response.json()["refresh_token"]

    response = await async_client.post(
        "/auth/refresh",
        json={"refresh_token": refresh_token},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["refresh_token"] != refresh_token
