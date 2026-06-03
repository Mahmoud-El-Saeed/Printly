from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.enums import NotificationType
from app.models import Notifications


async def _create_notification(
    db_session: AsyncSession,
    tenant_id,
    **overrides,
) -> str:
    notification = Notifications(
        tenant_id=tenant_id,
        user_id=overrides.get("user_id"),
        title=overrides.get("title", "Test"),
        message=overrides.get("message", "Test msg"),
        notification_type=overrides.get("notification_type", NotificationType.ORDER),
        is_read=overrides.get("is_read", False),
    )
    db_session.add(notification)
    await db_session.commit()
    return str(notification.id)


class TestListNotifications:
    async def test_list_notifications_empty(
        self, async_client: AsyncClient, auth_headers: dict[str, str]
    ) -> None:
        response = await async_client.get("/notifications/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 0
        assert data["unread_count"] == 0

    async def test_list_notifications_with_data(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
        staff_user,
        db_session: AsyncSession,
    ) -> None:
        _, _, tenant, _, _ = staff_user
        await _create_notification(db_session, tenant.id)
        await _create_notification(
            db_session,
            tenant.id,
            title="Second",
            notification_type=NotificationType.PAYMENT,
        )

        response = await async_client.get("/notifications/", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] >= 2
        assert data["unread_count"] >= 2


class TestMarkAsRead:
    async def test_mark_notification_as_read(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
        staff_user,
        db_session: AsyncSession,
    ) -> None:
        _, _, tenant, _, _ = staff_user
        notification_id = await _create_notification(db_session, tenant.id)

        response = await async_client.patch(
            f"/notifications/{notification_id}/read",
            headers=auth_headers,
        )

        assert response.status_code == 204

        list_response = await async_client.get("/notifications/", headers=auth_headers)
        data = list_response.json()
        assert data["unread_count"] == 0


class TestMarkAllAsRead:
    async def test_mark_all_notifications_as_read(
        self,
        async_client: AsyncClient,
        auth_headers: dict[str, str],
        staff_user,
        db_session: AsyncSession,
    ) -> None:
        _, _, tenant, _, _ = staff_user
        await _create_notification(db_session, tenant.id, title="One")
        await _create_notification(db_session, tenant.id, title="Two")
        await _create_notification(db_session, tenant.id, title="Three")

        response = await async_client.patch("/notifications/read", headers=auth_headers)
        assert response.status_code == 204

        list_response = await async_client.get("/notifications/", headers=auth_headers)
        data = list_response.json()
        assert data["unread_count"] == 0
