from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from redis.asyncio import Redis
from uuid import UUID

from app.db import InvoiceCRUD, OrderCRUD, TenantMemberCRUD, WalkInCustomerCRUD, UserCRUD
from app.models import Invoices, Orders
from app.schemas import InvoiceResponse, InvoiceDetailResponse, InvoicesRequest, InvoiceListResponse
from app.enums import OrderStatus


async def _generate_invoice_number(redis_client: Redis, tenant_id: UUID) -> str:
    key = f"tenant:{tenant_id}:invoice_number"
    number = await redis_client.incr(key)
    return f"INV-{number:04d}"


async def generate_invoice(
    db: AsyncSession,
    redis_client: Redis,
    tenant_id: UUID,
    order_id: UUID,
    notes: str | None = None,
) -> InvoiceDetailResponse:
    """Generate an invoice for a delivered order."""

    stmt = (
        select(Orders)
        .options(selectinload(Orders.items), selectinload(Orders.payments))
        .where(Orders.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order or order.tenant_id != tenant_id:
        raise ValueError("Order not found")

    if order.status != OrderStatus.DELIVERED:
        raise ValueError("Invoice can only be generated for delivered orders")

    existing = await InvoiceCRUD.get_by_field(db, "order_id", order_id)
    if existing:
        raise ValueError("Invoice already exists for this order")

    customer_name = None
    if order.customer_id:
        member = await TenantMemberCRUD.get_by_field(
            db, "customer_user_id", order.customer_id
        )
        if member and member.display_name:
            customer_name = member.display_name
        else:
            user = await UserCRUD.get_by_id(db, order.customer_id)
            if user:
                customer_name = user.full_name
    elif order.walk_in_customer_id:
        walkin = await WalkInCustomerCRUD.get_by_id(db, order.walk_in_customer_id)
        if walkin:
            customer_name = walkin.name

    invoice_number = await _generate_invoice_number(redis_client, tenant_id)

    invoice = await InvoiceCRUD.create(
        db=db,
        tenant_id=tenant_id,
        invoice_number=invoice_number,
        order_id=order.id,
        customer_id=order.customer_id,
        customer_name=customer_name,
        total_amount=order.total_amount,
        paid_amount=order.paid_amount,
        notes=notes,
    )
    await db.commit()
    await db.refresh(invoice)

    return await _build_detail_response(invoice, order)


async def get_invoice(
    db: AsyncSession, tenant_id: UUID, invoice_id: UUID
) -> InvoiceDetailResponse:
    invoice = await InvoiceCRUD.get_by_id(db, invoice_id)
    if not invoice or invoice.tenant_id != tenant_id:
        raise ValueError("Invoice not found")

    stmt = (
        select(Orders)
        .options(selectinload(Orders.items), selectinload(Orders.payments))
        .where(Orders.id == invoice.order_id)
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise ValueError("Associated order not found")

    return await _build_detail_response(invoice, order)


async def list_invoices(
    db: AsyncSession, tenant_id: UUID, request: InvoicesRequest
) -> InvoiceListResponse:
    filters = {"tenant_id": tenant_id}
    if request.customer_id:
        filters["customer_id"] = request.customer_id
    if request.order_id:
        filters["order_id"] = request.order_id

    invoices, total = await InvoiceCRUD.get_list(
        db=db,
        filters=filters,
        offset=request.offset,
        limit=request.limit,
        order_by=request.order_by,
        order_dir=request.order_dir,
    )
    return InvoiceListResponse(
        total=total,
        items=[InvoiceResponse.model_validate(inv) for inv in invoices],
    )


async def _build_detail_response(invoice: Invoices, order: Orders) -> InvoiceDetailResponse:
    items_data = []
    for oi in order.items:
        items_data.append({
            "id": str(oi.id),
            "book_title": oi.book_title,
            "copies": oi.copies,
            "unit_price": float(oi.unit_price),
            "total_pages": oi.total_pages,
            "color_mode": oi.color_mode,
            "sides_per_page": oi.sides_per_page,
            "binding_type": oi.binding_type,
            "has_lamination": oi.has_lamination,
            "materials_snapshot": oi.materials_snapshot,
            "subtotal": float(oi.subtotal),
        })

    payments_data = []
    for p in order.payments:
        payments_data.append({
            "id": str(p.id),
            "amount": float(p.amount),
            "payment_method": p.payment_method.value if hasattr(p.payment_method, "value") else str(p.payment_method),
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })

    return InvoiceDetailResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        order_id=order.id,
        order_number=order.order_number,
        customer_id=invoice.customer_id,
        customer_name=invoice.customer_name,
        total_amount=invoice.total_amount,
        paid_amount=invoice.paid_amount,
        notes=invoice.notes,
        created_at=invoice.created_at,
        items=items_data,
        payments=payments_data,
    )
