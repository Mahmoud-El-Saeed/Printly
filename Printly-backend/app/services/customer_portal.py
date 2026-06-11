from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import date
from decimal import Decimal
import math
from redis.asyncio import Redis
from fastapi import UploadFile

from app.db import (
    UserCRUD,
    TenantMemberCRUD,
    OrderCRUD,
    OrderItemsCRUD,
    BookCRUD,
    NotificationCRUD,
    PricingRuleCRUD,
    PaymentCRUD,
)
from app.models import TenantMembers, Users, OrderItems, Orders

from app.schemas import (
    OrderResponse,
    OrderCreate,
    OrdersListResponse,
    BookResponse,
    BookCreate,
    BookListResponse,
    NotificationResponse,
    NotificationListResponse,
    NotificationListRequest,
    CustomerBalanceResponse,
    PaymentResponse,
    PaymentCreate,
    PortalProfileResponse,
    PortalProfileUpdateRequest,
    PortalTenantInfo,
    PortalTenantsResponse,
    PortalPricingItem,
    PortalPricingResponse,
)

from app.enums import OrderStatus, PaymentMethod


async def _verify_membership(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
) -> TenantMembers:
    member = await TenantMemberCRUD.get_tenant_member(
        db=db, tenant_id=tenant_id, customer_user_id=customer_user_id,
    )
    if not member or not member.is_approved:
        raise ValueError("You are not an approved member of this tenant")
    return member


async def get_my_profile(
    db: AsyncSession,
    user_id: UUID,
) -> PortalProfileResponse:
    user: Users | None = await UserCRUD.get_active_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    return PortalProfileResponse(
        user_id=user.id, email=user.email, full_name=user.full_name,
        phone=user.phone, role=user.role.value, created_at=user.created_at,
    )


async def update_my_profile(
    db: AsyncSession,
    user_id: UUID,
    update_data: PortalProfileUpdateRequest,
) -> PortalProfileResponse:
    user: Users | None = await UserCRUD.get_active_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    if update_data.full_name is not None:
        user.full_name = update_data.full_name
    if update_data.phone is not None:
        user.phone = update_data.phone
    try:
        await db.commit()
        await db.refresh(user)
    except Exception as e:
        await db.rollback()
        raise ValueError("Failed to update profile") from e
    return PortalProfileResponse(
        user_id=user.id, email=user.email, full_name=user.full_name,
        phone=user.phone, role=user.role.value, created_at=user.created_at,
    )


async def get_my_tenants(
    db: AsyncSession,
    customer_user_id: UUID,
    offset: int = 0,
    limit: int = 20,
) -> PortalTenantsResponse:
    members = await TenantMemberCRUD.get_all_memberships(
        db=db, customer_user_id=customer_user_id, offset=offset, limit=limit,
    )
    total = await TenantMemberCRUD.count_all_memberships(
        db=db, customer_user_id=customer_user_id,
    )
    tenants = [
        PortalTenantInfo(
            tenant_id=m.tenant_id, tenant_name=m.tenant.name,
            tenant_slug=m.tenant.slug, linked_at=m.linked_at,
            display_name=m.display_name, balance=m.balance,
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
    await _verify_membership(db, tenant_id, customer_user_id)
    orders, total = await OrderCRUD.get_orders(
        db=db, tenant_id=tenant_id, customer_id=customer_user_id,
        status=status.value if status else None, date_from=date_from,
        date_to=date_to, offset=offset, limit=limit,
        order_by=order_by, order_dir=order_dir,
    )
    return OrdersListResponse(
        total=total, orders=[OrderResponse.model_validate(o) for o in orders],
    )


async def get_my_order(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
    order_id: UUID,
) -> OrderResponse:
    await _verify_membership(db, tenant_id, customer_user_id)
    order = await OrderCRUD.get_by_id(db, order_id)
    if not order or order.tenant_id != tenant_id or order.customer_id != customer_user_id:
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
    await _verify_membership(db, tenant_id, customer_user_id)
    books, total = await BookCRUD.search_books(
        db=db, tenant_id=tenant_id, customer_id=customer_user_id,
        title=title, subject=subject, offset=offset, limit=limit,
        order_by=order_by, order_dir=order_dir,
    )
    return BookListResponse(
        total=total, items=[BookResponse.model_validate(b) for b in books],
    )


async def get_my_balance(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
) -> CustomerBalanceResponse:
    member = await _verify_membership(db, tenant_id, customer_user_id)
    unpaid_orders = await OrderCRUD.get_unpaid_orders(
        db=db, tenant_id=tenant_id, customer_id=customer_user_id,
    )
    unpaid_total = sum(order.total_amount - order.paid_amount for order in unpaid_orders)
    net_balance = member.balance - unpaid_total
    return CustomerBalanceResponse(
        customer_id=customer_user_id, balance=member.balance,
        unpaid_total=unpaid_total, net_balance=net_balance,
    )


async def get_my_notifications(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
    request: NotificationListRequest,
) -> NotificationListResponse:
    await _verify_membership(db, tenant_id, customer_user_id)
    filters: dict = {"tenant_id": tenant_id, "user_id": customer_user_id}
    if request.notification_type is not None:
        filters["notification_type"] = request.notification_type
    if request.is_read is not None:
        filters["is_read"] = request.is_read
    notifications, total_count = await NotificationCRUD.get_list(
        db=db, filters=filters, offset=request.offset, limit=request.limit,
        order_by=request.order_by, order_dir=request.order_dir,
    )
    unread_count = await NotificationCRUD.get_unread_count(
        db=db, tenant_id=tenant_id, user_id=customer_user_id,
    )
    if notifications is None:
        raise ValueError("Failed to fetch notifications")
    return NotificationListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        unread_count=unread_count, total_count=total_count,
    )


async def mark_my_notification_read(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
    notification_id: UUID,
) -> None:
    await _verify_membership(db, tenant_id, customer_user_id)
    notification = await NotificationCRUD.get_by_id(db, notification_id)
    if not notification or notification.tenant_id != tenant_id or notification.user_id != customer_user_id:
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
    await _verify_membership(db, tenant_id, customer_user_id)
    try:
        count = await NotificationCRUD.mark_all_read(
            db=db, tenant_id=tenant_id, user_id=customer_user_id,
        )
        await db.commit()
        return count
    except Exception as e:
        await db.rollback()
        raise ValueError("Failed to mark all notifications as read") from e


async def portal_create_order(
    db: AsyncSession,
    redis_client: Redis,
    tenant_id: UUID,
    customer_user_id: UUID,
    order_create: OrderCreate,
) -> OrderResponse:
    await _verify_membership(db, tenant_id, customer_user_id)
    order_create.customer_id = customer_user_id
    order_create.walk_in_customer_id = None

    key = f"tenant:{tenant_id}:order_number"
    order_number = await redis_client.incr(key)
    order_number_str = f"ORD-{order_number:04d}"

    books_ids = [item.book_id for item in order_create.items if item.book_id]
    if books_ids:
        books = await BookCRUD.get_books_by_ids(db, books_ids)
        books_dict = {book.id: book for book in books if book.tenant_id == tenant_id}
        for item in order_create.items:
            if item.book_id and item.book_id not in books_dict:
                raise ValueError(f"Book with ID {item.book_id} not found.")

    total_amount = Decimal("0")
    order_item_data = []
    for item in order_create.items:
        sheets = math.ceil(item.pages_per_copy / item.sides_per_page)
        item_subtotal = (
            sheets * item.printing_price * item.copies
            + item.cover_price * item.copies
            + item.binding_price * item.copies
            + item.lamination_price * item.copies
        )
        for extra_service in item.extra_services:
            item_subtotal += Decimal(extra_service.get("price", 0)) * item.copies
        order_item_data.append({**item.model_dump(), "subtotal": item_subtotal})
        total_amount += item_subtotal

    try:
        new_order = await OrderCRUD.create(
            db, tenant_id=tenant_id, customer_id=customer_user_id,
            walk_in_customer_id=None, created_by=customer_user_id,
            order_number=order_number_str, total_amount=total_amount,
            notes=order_create.notes, due_date=order_create.due_date,
        )
        items_to_create = [
            OrderItems(order_id=new_order.id, **item) for item in order_item_data
        ]
        await OrderItemsCRUD.batch_create(db, items_to_create)
        await db.commit()
        await db.refresh(new_order, attribute_names=["items"])
        return OrderResponse.model_validate(new_order)
    except Exception as e:
        await db.rollback()
        raise ValueError(f"Error creating order: {str(e)}") from e


async def portal_create_book(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
    book_data: BookCreate,
) -> BookResponse:
    await _verify_membership(db, tenant_id, customer_user_id)
    from app.services.book import create_book
    book_data.customer_id = customer_user_id
    return await create_book(db, tenant_id, customer_user_id, book_data)


async def portal_create_payment(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
    order_id: UUID,
    amount: Decimal,
    payment_method: str,
    reference: str | None = None,
    notes: str | None = None,
) -> PaymentResponse:
    await _verify_membership(db, tenant_id, customer_user_id)
    order = await OrderCRUD.get_by_id(db, order_id)
    if not order or order.tenant_id != tenant_id or order.customer_id != customer_user_id:
        raise ValueError("Order not found or does not belong to you")
    if order.status == OrderStatus.CANCELLED:
        raise ValueError("Cannot add payment to a cancelled order")
    remaining = order.total_amount - order.paid_amount
    if remaining <= 0:
        raise ValueError("This order is already fully paid")
    if amount > remaining:
        raise ValueError("Payment amount exceeds the remaining order amount")

    payment_create = PaymentCreate(
        order_id=order_id, amount=amount,
        payment_method=PaymentMethod(payment_method),
        reference=reference, notes=notes,
    )
    from app.services.payment import create_payment
    return await create_payment(db, tenant_id, customer_user_id, payment_create)


async def portal_get_pricing(
    db: AsyncSession,
    tenant_id: UUID,
    customer_user_id: UUID,
) -> PortalPricingResponse:
    await _verify_membership(db, tenant_id, customer_user_id)
    rules, _ = await PricingRuleCRUD.search_pricing_rules(
        db=db, tenant_id=tenant_id, is_active=True, offset=0, limit=100,
    )
    pricing_items = [
        PortalPricingItem(
            component_name=r.component_name,
            component_type=r.component_type.value,
            price=r.price, unit_type=r.unit_type.value,
        )
        for r in rules
    ]
    return PortalPricingResponse(rules=pricing_items)