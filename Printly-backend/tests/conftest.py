import os
from uuid import uuid4
from typing import AsyncGenerator, Awaitable, Callable

import factory
import pytest_asyncio
from faker import Faker
from httpx import ASGITransport, AsyncClient
from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import hash_password
from app.core import get_settings
from app.db import TenantCRUD, UserCRUD
from app.enums import UserRole
from main import app
from app.models import Base, Tenants, Users
from app.routes.deps import get_db

settings = get_settings()
test_database_uri = settings.DATABASE_URI.replace("printly_db", "printly_test")
if test_database_uri:
    os.environ["DATABASE_URI_TEST"] = test_database_uri
else:
    os.environ.setdefault(
        "DATABASE_URI_TEST",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/printly_test",
    )
os.environ.setdefault("REDIS_URI", "redis://localhost:6379/0")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "15")
os.environ.setdefault("REFRESH_TOKEN_EXPIRE_DAYS", "7")
os.environ.setdefault("UPLOAD_FOLDER_NAME", "uploads")
os.environ.setdefault("ALLOWED_FILE_TYPES", "[]")
os.environ.setdefault("ALLOWED_FILE_EXTENSIONS", "[]")
os.environ.setdefault("MAX_FILE_SIZE", "10485760")



faker = Faker()


def _build_test_database_url() -> str:
    test_database_url = os.getenv("TEST_DATABASE_URI")
    if test_database_url:
        return test_database_url

    database_url = os.getenv("DATABASE_URI_TEST") or os.getenv("DATABASE_URI")
    if not database_url:
        raise RuntimeError("TEST_DATABASE_URI or DATABASE_URI must be set for tests")

    url = make_url(database_url)
    test_db_name = os.getenv("TEST_DATABASE_NAME", "printly_test")
    return url.set(database=test_db_name).render_as_string(hide_password=False)


TEST_DATABASE_URL = _build_test_database_url()
TEST_ENGINE = create_async_engine(TEST_DATABASE_URL, echo=False)
AsyncSessionTest = async_sessionmaker(
    bind=TEST_ENGINE,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


class UserFactory(factory.Factory):
    class Meta:
        model = dict

    email = factory.LazyFunction(lambda: faker.unique.email())
    full_name = factory.LazyFunction(lambda: faker.name())
    password = factory.LazyFunction(lambda: faker.password(length=12))


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database() -> AsyncGenerator[None, None]:
    async with TEST_ENGINE.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with TEST_ENGINE.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(autouse=True)
async def clean_database() -> AsyncGenerator[None, None]:
    yield
    async with TEST_ENGINE.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionTest() as session:
        yield session


@pytest_asyncio.fixture
async def create_user() -> Callable[..., Awaitable[tuple[Users, str]]]:
    async def _create_user(
        session: AsyncSession,
        **overrides: object,
    ) -> tuple[Users, str]:
        data = UserFactory.build()
        data.update(overrides)
        plain_password = data.pop("password")
        user = await UserCRUD.create(
            db=session,
            email=data["email"],
            full_name=data["full_name"],
            password_hash=hash_password(plain_password),
            role=data.get("role", UserRole.CUSTOMER),
            tenant_id=data.get("tenant_id"),
            phone=data.get("phone"),
            is_active=data.get("is_active", True),
        )
        await session.commit()
        return user, plain_password

    return _create_user


@pytest_asyncio.fixture
async def create_tenant() -> Callable[..., Awaitable[Tenants]]:
    async def _create_tenant(
        session: AsyncSession,
        **overrides: object,
    ) -> Tenants:
        tenant_data = {
            "name": overrides.pop("name", f"Tenant {faker.unique.company()}"),
            "slug": overrides.pop("slug", f"tenant-{uuid4().hex}"),
            "address": overrides.pop("address", None),
            "phone": overrides.pop("phone", None),
            "email": overrides.pop("email", None),
            "logo_url": overrides.pop("logo_url", None),
            "is_active": overrides.pop("is_active", True),
        }
        tenant_data.update(overrides)
        tenant = await TenantCRUD.create(db=session, **tenant_data)
        await session.commit()
        return tenant

    return _create_tenant


@pytest_asyncio.fixture
async def staff_user(
    async_client: AsyncClient,
    db_session: AsyncSession,
    create_tenant,
) -> tuple[Users, str, Tenants, str, str]:
    tenant = await create_tenant(db_session)
    plain_password = faker.password(length=12)
    user = await UserCRUD.create(
        db=db_session,
        tenant_id=tenant.id,
        email=faker.unique.email(),
        full_name=faker.name(),
        password_hash=hash_password(plain_password),
        role=UserRole.STAFF,
        is_active=True,
    )
    await db_session.commit()

    login_response = await async_client.post(
        "/auth/login",
        data={
            "username": user.email,
            "password": plain_password,
        },
    )
    tokens = login_response.json()
    return (
        user,
        plain_password,
        tenant,
        tokens["access_token"],
        tokens["refresh_token"],
    )


@pytest_asyncio.fixture
async def auth_headers(
    staff_user: tuple[Users, str, Tenants, str, str],
) -> dict[str, str]:
    _, _, _, access_token, _ = staff_user
    return {"Authorization": f"Bearer {access_token}"}


@pytest_asyncio.fixture
async def admin_auth_headers(
    async_client: AsyncClient,
    db_session: AsyncSession,
    create_tenant,
) -> dict[str, str]:
    tenant = await create_tenant(db_session)
    plain_password = faker.password(length=12)
    admin_user = await UserCRUD.create(
        db=db_session,
        tenant_id=tenant.id,
        email=faker.unique.email(),
        full_name=faker.name(),
        password_hash=hash_password(plain_password),
        role=UserRole.ADMIN,
        is_active=True,
    )
    await db_session.commit()
    login = await async_client.post(
        "/auth/login",
        data={"username": admin_user.email, "password": plain_password},
    )
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with AsyncSessionTest() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.pop(get_db, None)
