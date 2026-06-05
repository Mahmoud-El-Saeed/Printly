from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import date

from app.db import (
    UserCRUD,
    TenantMemberCRUD,
    OrderCRUD,
    BookCRUD,
    NotificationCRUD,
)
from app.models import TenantMembers, Users


from app.schemas import (
    OrderResponse,
    OrdersListResponse,
    BookResponse,
    BookListResponse,
    NotificationResponse,
    NotificationListResponse,
    NotificationListRequest,
    CustomerBalanceResponse,
    PortalProfileResponse,
    PortalTenantInfo,
    PortalTenantsResponse,
)

from app.enums import OrderStatus


async def _verify_membership(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
) -> TenantMembers:
    """
    Verify the customer is an approved member of the given tenant.
    Returns the TenantMembers record on success, raises ValueError otherwise.
    """
    member = await TenantMemberCRUD.get_tenant_member(
        db=db,
        tenant_id=tenant_id,
        customer_user_id=customer_user_id,
    )
    if not member or not member.is_approved:
        raise ValueError("You are not an approved member of this tenant")
    return member


async def get_my_profile(
    db: AsyncSession,
    user_id: UUID,
) -> PortalProfileResponse:
    """Return the logged-in customer's own profile."""
    user: Users | None = await UserCRUD.get_active_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    return PortalProfileResponse(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role.value,
        created_at=user.created_at,
    )


async def get_my_tenants(
    db: AsyncSession,
    customer_user_id: UUID,
    offset: int = 0,
    limit: int = 20,
) -> PortalTenantsResponse:
    """Return all tenants where the customer is an approved member."""
    members = await TenantMemberCRUD.get_approved_memberships(
        db=db,
        customer_user_id=customer_user_id,
        offset=offset,
        limit=limit,
    )
    total = await TenantMemberCRUD.count_approved_memberships(
        db=db,
        customer_user_id=customer_user_id,
    )
    tenants = [
        PortalTenantInfo(
            tenant_id=m.tenant_id,
            tenant_name=m.tenant.name,
            tenant_slug=m.tenant.slug,
            linked_at=m.linked_at,
            display_name=m.display_name,
            balance=m.balance,
            is_approved=m.is_approved,
        )
        for m in members
    ]
    return PortalTenantsResponse(tenants=tenants, total=total)


async def get_my_orders(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
    status: OrderStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    offset: int = 0,
    limit: int = 10,
    order_by: str = "created_at",
    order_dir: str = "desc",
) -> OrdersListResponse:
    """List the customer's orders within a specific tenant."""
    await _verify_membership(db, tenant_id, customer_user_id)

    orders, total = await OrderCRUD.get_orders(
        db=db,
        tenant_id=tenant_id,
        customer_id=customer_user_id,
        status=status.value if status else None,
        date_from=date_from,
        date_to=date_to,
        offset=offset,
        limit=limit,
        order_by=order_by,
        order_dir=order_dir,
    )
    return OrdersListResponse(
        total=total,
        orders=[OrderResponse.model_validate(o) for o in orders],
    )


async def get_my_order(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
    order_id: UUID,
) -> OrderResponse:
    """Return a single order belonging to the customer."""
    await _verify_membership(db, tenant_id, customer_user_id)

    order = await OrderCRUD.get_by_id(db, order_id)
    if (
        not order
        or order.tenant_id != tenant_id
        or order.customer_id != customer_user_id
    ):
        raise ValueError("Order not found")
    return OrderResponse.model_validate(order)


async def get_my_books(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
    title: str | None = None,
    subject: str | None = None,
    offset: int = 0,
    limit: int = 10,
    order_by: str = "created_at",
    order_dir: str = "desc",
) -> BookListResponse:
    """List the customer's books within a specific tenant."""
    await _verify_membership(db, tenant_id, customer_user_id)

    books, total = await BookCRUD.search_books(
        db=db,
        tenant_id=tenant_id,
        customer_id=customer_user_id,
        title=title,
        subject=subject,
        offset=offset,
        limit=limit,
        order_by=order_by,
        order_dir=order_dir,
    )
    return BookListResponse(
        total=total,
        items=[BookResponse.model_validate(b) for b in books],
    )


async def get_my_balance(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
) -> CustomerBalanceResponse:
    """Return the customer's balance for a specific tenant."""
    member = await _verify_membership(db, tenant_id, customer_user_id)

    unpaid_orders = await OrderCRUD.get_unpaid_orders(
        db=db,
        tenant_id=tenant_id,
        customer_id=customer_user_id,
    )
    unpaid_total = sum(
        order.total_amount - order.paid_amount for order in unpaid_orders
    )
    net_balance = member.balance - unpaid_total

    return CustomerBalanceResponse(
        customer_id=customer_user_id,
        balance=member.balance,
        unpaid_total=unpaid_total,
        net_balance=net_balance,
    )


async def get_my_notifications(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
    request: NotificationListRequest,
) -> NotificationListResponse:
    """Return the customer's notifications for a specific tenant."""
    await _verify_membership(db, tenant_id, customer_user_id)

    filters: dict = {
        "tenant_id": tenant_id,
        "user_id": customer_user_id,
    }
    if request.notification_type is not None:
        filters["notification_type"] = request.notification_type
    if request.is_read is not None:
        filters["is_read"] = request.is_read

    notifications, total_count = await NotificationCRUD.get_list(
        db=db,
        filters=filters,
        offset=request.offset,
        limit=request.limit,
        order_by=request.order_by,
        order_dir=request.order_dir,
    )
    unread_count = await NotificationCRUD.get_unread_count(
        db=db,
        tenant_id=tenant_id,
        user_id=customer_user_id,
    )
    return NotificationListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        unread_count=unread_count,
        total_count=total_count,
    )


async def mark_my_notification_read(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
    notification_id: UUID,
) -> None:
    """Mark a specific notification as read (customer portal)."""
    await _verify_membership(db, tenant_id, customer_user_id)

    notification = await NotificationCRUD.get_by_id(db, notification_id)
    if (
        not notification
        or notification.tenant_id != tenant_id
        or notification.user_id != customer_user_id
    ):
        raise ValueError("Notification not found")
    try:
        notification.is_read = True
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise ValueError("Failed to mark notification as read") from e


async def mark_all_my_notifications_read(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
) -> int:
    """Mark all notifications as read for the customer in a specific tenant.
    Returns the number of notifications marked."""
    await _verify_membership(db, tenant_id, customer_user_id)
    try:
        count = await NotificationCRUD.mark_all_read(
            db=db,
            tenant_id=tenant_id,
            user_id=customer_user_id,
        )
        await db.commit()
        return count
    except Exception as e:
        await db.rollback()
        raise ValueError("Failed to mark all notifications as read") from e
