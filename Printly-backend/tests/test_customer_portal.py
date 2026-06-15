from decimal import Decimal
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db import (
    UserCRUD,
    TenantCRUD,
    TenantMemberCRUD,
    OrderCRUD,
    BookCRUD,
)
from app.enums import UserRole, OrderStatus, NotificationType
from app.models import Users, Tenants, Orders, Books, Notifications, TenantMembers


# ─── Fixtures ──────────────────────────────────────────────────────────


@pytest.fixture
async def customer_user(
    db_session: AsyncSession,
) -> tuple[Users, str]:
    """Create a customer user (no tenant_id). Returns (user, plain_password)."""
    from faker import Faker

    faker = Faker()
    password = faker.password(length=12)
    user = await UserCRUD.create(
        db=db_session,
        email=faker.unique.email(),
        full_name=faker.name(),
        phone=faker.phone_number()[:20],
        password_hash=hash_password(password),
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    await db_session.commit()
    return user, password


@pytest.fixture
async def customer_auth_headers(
    async_client: AsyncClient,
    customer_user: tuple[Users, str],
) -> dict[str, str]:
    """Login as customer and return auth headers."""
    user, password = customer_user
    login_resp = await async_client.post(
        "/auth/login",
        data={"username": user.email, "password": password},
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    return {"Authorization": f"Bearer {login_resp.json()['access_token']}"}


@pytest.fixture
async def portal_tenant(
    db_session: AsyncSession,
) -> Tenants:
    """Create a tenant for portal tests."""
    from faker import Faker

    faker = Faker()
    tenant = await TenantCRUD.create(
        db=db_session,
        name=f"Portal Tenant {faker.unique.company()}",
        slug=f"portal-{uuid4().hex[:8]}",
        phone=faker.phone_number()[:20],
        is_active=True,
    )
    await db_session.commit()
    return tenant


@pytest.fixture
async def approved_member(
    db_session: AsyncSession,
    customer_user: tuple[Users, str],
    portal_tenant: Tenants,
) -> TenantMembers:
    """Create an approved tenant membership for the customer."""
    user, _ = customer_user
    member = await TenantMemberCRUD.create(
        db=db_session,
        tenant_id=portal_tenant.id,
        customer_user_id=user.id,
        display_name=user.full_name,
        balance=Decimal("0"),
        is_approved=True,
    )
    await db_session.commit()
    return member


@pytest.fixture
async def approved_member_with_balance(
    db_session: AsyncSession,
    customer_user: tuple[Users, str],
    portal_tenant: Tenants,
) -> TenantMembers:
    """Create an approved member with a positive balance."""
    user, _ = customer_user
    member = await TenantMemberCRUD.create(
        db=db_session,
        tenant_id=portal_tenant.id,
        customer_user_id=user.id,
        display_name=user.full_name,
        balance=Decimal("150.00"),
        is_approved=True,
    )
    await db_session.commit()
    return member


@pytest.fixture
async def portal_order(
    db_session: AsyncSession,
    customer_user: tuple[Users, str],
    portal_tenant: Tenants,
    staff_user,
) -> Orders:
    """Create an order linked to the customer in the portal tenant."""
    user, _ = customer_user
    staff = staff_user[0]

    order = await OrderCRUD.create(
        db=db_session,
        tenant_id=portal_tenant.id,
        customer_id=user.id,
        created_by=staff.id,
        order_number=f"ORD-{uuid4().hex[:6].upper()}",
        total_amount=Decimal("50.00"),
        paid_amount=Decimal("20.00"),
        notes="Test order",
    )
    await db_session.commit()
    await db_session.refresh(order)
    return order


@pytest.fixture
async def portal_book(
    db_session: AsyncSession,
    customer_user: tuple[Users, str],
    portal_tenant: Tenants,
) -> Books:
    """Create a book in the portal tenant."""
    user, _ = customer_user
    book = await BookCRUD.create(
        db=db_session,
        tenant_id=portal_tenant.id,
        created_by=user.id,
        title="My Test Book",
        subject="Math",
        total_pages=100,
        color_mode="bw",
        sides_per_page=1,
        copies=1,
        binding_type=None,
        has_lamination=False,
        file_url=None,
        file_size=None,
    )
    await db_session.commit()
    return book


@pytest.fixture
async def portal_notification(
    db_session: AsyncSession,
    customer_user: tuple[Users, str],
    portal_tenant: Tenants,
) -> str:
    """Create a notification for the customer in the portal tenant. Returns notification_id as str."""
    user, _ = customer_user
    notification = Notifications(
        tenant_id=portal_tenant.id,
        user_id=user.id,
        title="Order Update",
        message="Your order is being printed",
        notification_type=NotificationType.ORDER,
        is_read=False,
    )
    db_session.add(notification)
    await db_session.commit()
    await db_session.refresh(notification)
    return str(notification.id)


# ─── Helpers ───────────────────────────────────────────────────────────


async def _create_customer_notification(
    db_session: AsyncSession,
    tenant_id,
    user_id,
    **overrides,
) -> str:
    """Helper to create a notification and return its string ID."""
    notification = Notifications(
        tenant_id=tenant_id,
        user_id=user_id,
        title=overrides.get("title", "Test Notif"),
        message=overrides.get("message", "Test message"),
        notification_type=overrides.get("notification_type", NotificationType.ORDER),
        is_read=overrides.get("is_read", False),
    )
    db_session.add(notification)
    await db_session.commit()
    await db_session.refresh(notification)
    return str(notification.id)


# ═══════════════════════════════════════════════════════════════════════
# Tests: Profile
# ═══════════════════════════════════════════════════════════════════════


class TestGetMyProfile:
    async def test_get_profile_success(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        customer_user: tuple[Users, str],
    ) -> None:
        user, _ = customer_user
        response = await async_client.get(
            "/portal/me/profile",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == str(user.id)
        assert data["email"] == user.email
        assert data["full_name"] == user.full_name
        assert data["role"] == "customer"

    async def test_get_profile_unauthorized(
        self,
        async_client: AsyncClient,
    ) -> None:
        response = await async_client.get("/portal/me/profile")
        assert response.status_code == 401

    async def test_get_profile_rejected_for_staff(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
    ) -> None:
        """Staff users should get 403 on customer portal endpoints."""
        response = await async_client.get(
            "/portal/me/profile",
            headers=auth_headers,
        )
        assert response.status_code == 403


# ═══════════════════════════════════════════════════════════════════════
# Tests: My Tenants
# ═══════════════════════════════════════════════════════════════════════


class TestGetMyTenants:
    async def test_get_tenants_empty(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
    ) -> None:
        """Customer with no memberships should get empty list."""
        response = await async_client.get(
            "/portal/me/tenants",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["tenants"] == []

    async def test_get_tenants_with_approved_membership(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
    ) -> None:
        response = await async_client.get(
            "/portal/me/tenants",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["tenants"]) == 1
        tenant_info = data["tenants"][0]
        assert tenant_info["tenant_id"] == str(portal_tenant.id)
        assert tenant_info["tenant_name"] == portal_tenant.name
        assert tenant_info["is_approved"] is True

    async def test_get_tenants_pagination(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        db_session: AsyncSession,
        customer_user: tuple[Users, str],
        approved_member: TenantMembers,
    ) -> None:
        """Create another tenant+membership and test pagination."""
        user, _ = customer_user

        # Create a second tenant and membership
        from faker import Faker

        faker = Faker()
        tenant2 = await TenantCRUD.create(
            db=db_session,
            name=f"Second Tenant {faker.unique.company()}",
            slug=f"second-{uuid4().hex[:8]}",
            is_active=True,
        )
        await TenantMemberCRUD.create(
            db=db_session,
            tenant_id=tenant2.id,
            customer_user_id=user.id,
            display_name="Display 2",
            balance=Decimal("0"),
            is_approved=True,
        )
        await db_session.commit()

        response = await async_client.get(
            "/portal/me/tenants",
            params={"limit": 1, "offset": 0},
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["tenants"]) == 1

        response2 = await async_client.get(
            "/portal/me/tenants",
            params={"limit": 1, "offset": 1},
            headers=customer_auth_headers,
        )
        data2 = response2.json()
        assert len(data2["tenants"]) == 1


# ═══════════════════════════════════════════════════════════════════════
# Tests: Orders
# ═══════════════════════════════════════════════════════════════════════


class TestGetMyOrders:
    async def test_get_orders_empty(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
    ) -> None:
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/orders",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["orders"] == []

    async def test_get_orders_with_data(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
        portal_order: Orders,
    ) -> None:
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/orders",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        orders = data["orders"]
        assert any(str(o["id"]) == str(portal_order.id) for o in orders)

    async def test_get_orders_without_membership(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        portal_tenant: Tenants,
    ) -> None:
        """Should fail when customer is not an approved member."""
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/orders",
            headers=customer_auth_headers,
        )
        assert response.status_code == 404

    async def test_get_orders_with_status_filter(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
        db_session: AsyncSession,
        customer_user: tuple[Users, str],
        staff_user,
    ) -> None:
        """Create orders with different statuses and filter."""
        user, _ = customer_user
        staff = staff_user[0]

        for status_val in [OrderStatus.NEW, OrderStatus.PRINTING]:
            await OrderCRUD.create(
                db=db_session,
                tenant_id=portal_tenant.id,
                customer_id=user.id,
                created_by=staff.id,
                order_number=f"ORD-{uuid4().hex[:6].upper()}",
                total_amount=Decimal("30.00"),
                paid_amount=Decimal("0"),
                status=status_val,
            )
        await db_session.commit()

        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/orders",
            params={"status": "new"},
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        for order in data["orders"]:
            assert order["status"] == "new"


class TestGetMyOrder:
    async def test_get_order_success(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
        portal_order: Orders,
    ) -> None:
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/orders/{portal_order.id}",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert str(data["id"]) == str(portal_order.id)
        assert data["order_number"] == portal_order.order_number

    async def test_get_order_not_found(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
    ) -> None:
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/orders/{uuid4()}",
            headers=customer_auth_headers,
        )
        assert response.status_code == 404

    async def test_get_order_wrong_tenant(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        db_session: AsyncSession,
        customer_user: tuple[Users, str],
        staff_user,
        portal_order: Orders,
    ) -> None:
        """Order belongs to a different tenant than the one requested."""
        user, _ = customer_user
        
        # Create another tenant
        other_tenant = await TenantCRUD.create(
            db=db_session,
            name=f"Other {uuid4().hex[:8]}",
            slug=f"other-{uuid4().hex[:8]}",
        )
        await db_session.commit()

        response = await async_client.get(
            f"/portal/tenants/{other_tenant.id}/orders/{portal_order.id}",
            headers=customer_auth_headers,
        )
        assert response.status_code == 404


# ═══════════════════════════════════════════════════════════════════════
# Tests: Books
# ═══════════════════════════════════════════════════════════════════════


class TestGetMyBooks:
    async def test_get_books_empty(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
    ) -> None:
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/books",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []

    async def test_get_books_with_data(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
        portal_book: Books,
    ) -> None:
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/books",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(str(b["id"]) == str(portal_book.id) for b in data["items"])

    async def test_get_books_search_by_title(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
        db_session: AsyncSession,
        customer_user: tuple[Users, str],
    ) -> None:
        user, _ = customer_user
        await BookCRUD.create(
            db=db_session,
            tenant_id=portal_tenant.id,
            created_by=user.id,
            title="Physics Textbook",
            subject="Science",
            total_pages=200,
            color_mode="bw",
            sides_per_page=1,
            copies=1,
            binding_type=None,
            has_lamination=False,
            file_url=None,
            file_size=None,
        )
        await db_session.commit()

        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/books",
            params={"title": "Physics"},
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert all("Physics" in b["title"] for b in data["items"])

    async def test_get_books_without_membership(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        portal_tenant: Tenants,
    ) -> None:
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/books",
            headers=customer_auth_headers,
        )
        assert response.status_code == 404


# ═══════════════════════════════════════════════════════════════════════
# Tests: Balance
# ═══════════════════════════════════════════════════════════════════════


class TestGetMyBalance:
    async def test_get_balance_zero(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        customer_user: tuple[Users, str],
        portal_tenant: Tenants,
    ) -> None:
        user, _ = customer_user
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/balance",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["customer_id"] == str(user.id)
        assert float(data["balance"]) == 0.00
        assert float(data["unpaid_total"]) == 0.00
        assert float(data["net_balance"]) == 0.00

    async def test_get_balance_with_positive_balance(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member_with_balance: TenantMembers,
        customer_user: tuple[Users, str],
        portal_tenant: Tenants,
    ) -> None:
        user, _ = customer_user
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/balance",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["customer_id"] == str(user.id)
        assert float(data["balance"]) == 150.00

    async def test_get_balance_with_unpaid_orders(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member_with_balance: TenantMembers,
        portal_tenant: Tenants,
        portal_order: Orders,
        customer_user: tuple[Users, str],
    ) -> None:
        user, _ = customer_user
        # approved_member_with_balance gives balance=150
        # portal_order has total=50, paid=20, so unpaid=30
        # net_balance = 150 - 30 = 120
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/balance",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["customer_id"] == str(user.id)
        assert float(data["balance"]) == 150.00
        # unpaid = total(50) - paid(20) = 30
        assert float(data["unpaid_total"]) == 30.00
        assert float(data["net_balance"]) == 120.00

    async def test_get_balance_without_membership(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        portal_tenant: Tenants,
    ) -> None:
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/balance",
            headers=customer_auth_headers,
        )
        assert response.status_code == 404


# ═══════════════════════════════════════════════════════════════════════
# Tests: Notifications
# ═══════════════════════════════════════════════════════════════════════


class TestGetMyNotifications:
    async def test_notifications_empty(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
    ) -> None:
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/notifications",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 0
        assert data["unread_count"] == 0
        assert data["notifications"] == []

    async def test_notifications_with_data(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
        db_session: AsyncSession,
        customer_user: tuple[Users, str],
    ) -> None:
        user, _ = customer_user
        await _create_customer_notification(
            db_session, portal_tenant.id, user.id, title="Notif 1"
        )
        await _create_customer_notification(
            db_session, portal_tenant.id, user.id, title="Notif 2"
        )

        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/notifications",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] >= 2
        assert data["unread_count"] >= 2

    async def test_notifications_without_membership(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        portal_tenant: Tenants,
    ) -> None:
        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/notifications",
            headers=customer_auth_headers,
        )
        assert response.status_code == 404

    async def test_notifications_only_shows_own(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
        db_session: AsyncSession,
        customer_user: tuple[Users, str],
        staff_user,
    ) -> None:
        """Customer should NOT see notifications addressed to other users."""
        user, _ = customer_user
        staff = staff_user[0]

        # Notification for this customer
        await _create_customer_notification(
            db_session, portal_tenant.id, user.id, title="For Customer"
        )
        # Notification for staff user
        await _create_customer_notification(
            db_session, portal_tenant.id, staff.id, title="For Staff"
        )

        response = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/notifications",
            headers=customer_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 1
        assert data["notifications"][0]["title"] == "For Customer"


class TestMarkNotificationRead:
    async def test_mark_single_read(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
        portal_notification: str,
    ) -> None:
        response = await async_client.patch(
            f"/portal/tenants/{portal_tenant.id}/notifications/{portal_notification}/read",
            headers=customer_auth_headers,
        )
        assert response.status_code == 204

    async def test_mark_single_read_not_found(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
    ) -> None:
        response = await async_client.patch(
            f"/portal/tenants/{portal_tenant.id}/notifications/{uuid4()}/read",
            headers=customer_auth_headers,
        )
        assert response.status_code == 404

    async def test_mark_single_read_without_membership(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        portal_tenant: Tenants,
    ) -> None:
        response = await async_client.patch(
            f"/portal/tenants/{portal_tenant.id}/notifications/{uuid4()}/read",
            headers=customer_auth_headers,
        )
        assert response.status_code == 404


class TestMarkAllNotificationsRead:
    async def test_mark_all_read(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
        db_session: AsyncSession,
        customer_user: tuple[Users, str],
    ) -> None:
        user, _ = customer_user
        await _create_customer_notification(db_session, portal_tenant.id, user.id, title="A")
        await _create_customer_notification(db_session, portal_tenant.id, user.id, title="B")
        await _create_customer_notification(db_session, portal_tenant.id, user.id, title="C")

        response = await async_client.patch(
            f"/portal/tenants/{portal_tenant.id}/notifications/read",
            headers=customer_auth_headers,
        )
        assert response.status_code == 204

        # Verify all are now read
        list_resp = await async_client.get(
            f"/portal/tenants/{portal_tenant.id}/notifications",
            headers=customer_auth_headers,
        )
        assert list_resp.json()["unread_count"] == 0

    async def test_mark_all_read_without_membership(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        portal_tenant: Tenants,
    ) -> None:
        response = await async_client.patch(
            f"/portal/tenants/{portal_tenant.id}/notifications/read",
            headers=customer_auth_headers,
        )
        assert response.status_code == 404


# ═══════════════════════════════════════════════════════════════════════
# Tests: Cross-tenant isolation
# ═══════════════════════════════════════════════════════════════════════


class TestCrossTenantIsolation:
    async def test_customer_cannot_access_other_tenant(
        self,
        async_client: AsyncClient,
        customer_auth_headers: dict[str, str],
        approved_member: TenantMembers,
        portal_tenant: Tenants,
        db_session: AsyncSession,
    ) -> None:
        """Customer should not be able to access a tenant they are not a member of."""
        other_tenant = await TenantCRUD.create(
            db=db_session,
            name=f"Isolated Tenant {uuid4().hex[:8]}",
            slug=f"isolated-{uuid4().hex[:8]}",
        )
        await db_session.commit()

        # Orders
        response = await async_client.get(
            f"/portal/tenants/{other_tenant.id}/orders",
            headers=customer_auth_headers,
        )
        assert response.status_code == 404

        # Books
        response = await async_client.get(
            f"/portal/tenants/{other_tenant.id}/books",
            headers=customer_auth_headers,
        )
        assert response.status_code == 404

        # Balance
        response = await async_client.get(
            f"/portal/tenants/{other_tenant.id}/balance",
            headers=customer_auth_headers,
        )
        assert response.status_code == 404

        # Notifications
        response = await async_client.get(
            f"/portal/tenants/{other_tenant.id}/notifications",
            headers=customer_auth_headers,
        )
        assert response.status_code == 404
