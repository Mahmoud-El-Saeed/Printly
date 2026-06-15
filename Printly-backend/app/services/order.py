from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from uuid import UUID
from decimal import Decimal


from app.enums import OrderStatus, MaterialTransactionType
from app.db import OrderCRUD, OrderItemsCRUD, UserCRUD, WalkInCustomerCRUD, BookCRUD

from app.models import Users, WalkInCustomers, OrderItems, Books, BookMaterials, Materials, MaterialTransactions

from app.schemas import (
    OrderCreate,
    OrderResponse,
    OrderUpdate,
    OrderStatusUpdate,
    OrdersRequest,
    OrdersListResponse,
)


async def __generate_order_number(redis_client: Redis, tenant_id: UUID) -> str:
    """Generate a unique order number for the tenant."""
    key = f"tenant:{tenant_id}:order_number"
    order_number = await redis_client.incr(key)
    return f"ORD-{order_number:04d}"


async def create_order(
    db: AsyncSession,
    redis_client: Redis,
    tenant_id: UUID,
    created_by: UUID,
    order_create: OrderCreate,
) -> OrderResponse:
    """Create a new order with auto-priced items from book configurations."""

    # Validate customer information
    if order_create.customer_id is None and order_create.walk_in_customer_id is None:
        raise ValueError("Either customer_id or walk_in_customer_id must be provided.")
    if (
        order_create.customer_id is not None
        and order_create.walk_in_customer_id is not None
    ):
        raise ValueError(
            "Only one of customer_id or walk_in_customer_id can be provided."
        )

    customer_id = order_create.customer_id
    walk_in_customer_id = order_create.walk_in_customer_id

    if order_create.customer_id:
        customer: Users = await UserCRUD.get_by_id(db=db, id=order_create.customer_id)
        if not customer or customer.tenant_id != tenant_id:
            raise ValueError("Customer not found.")
        customer_id = customer.id

    if order_create.walk_in_customer_id:
        walk_in_customer: WalkInCustomers = await WalkInCustomerCRUD.get_by_id(
            db=db, id=order_create.walk_in_customer_id
        )
        if not walk_in_customer or walk_in_customer.tenant_id != tenant_id:
            raise ValueError("Walk-in customer not found.")
        walk_in_customer_id = walk_in_customer.id

    order_number = await __generate_order_number(redis_client, tenant_id)

    # Fetch all books with their materials in one batch
    book_ids = [item.book_id for item in order_create.items]
    books_map: dict[UUID, Books] = {}
    if book_ids:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        stmt = (
            select(Books)
            .where(Books.id.in_(book_ids))
            .where(Books.tenant_id == tenant_id)
            .options(selectinload(Books.book_materials).selectinload(BookMaterials.material))
        )
        result = await db.execute(stmt)
        for book in result.scalars().all():
            books_map[book.id] = book

    total_amount = Decimal("0")
    order_items_to_create = []

    for item in order_create.items:
        book = books_map.get(item.book_id)
        if not book:
            raise ValueError(f"Book with ID {item.book_id} not found in your tenant.")

        # Calculate unit_price from materials
        materials_snapshot = []
        unit_price = Decimal("0")
        for bm in book.book_materials:
            qty = bm.quantity_per_copy
            ppu = bm.material.price_per_unit
            unit_price += qty * ppu
            materials_snapshot.append({
                "material_id": str(bm.material_id),
                "material_name": bm.material.name,
                "quantity_per_copy": float(qty),
                "price_per_unit": float(ppu),
            })

        subtotal = unit_price * item.copies

        order_items_to_create.append(
            OrderItems(
                order_id=None,
                book_id=book.id,
                book_title=book.title,
                copies=item.copies,
                unit_price=unit_price,
                total_pages=book.total_pages,
                color_mode=book.color_mode,
                sides_per_page=book.sides_per_page,
                binding_type=book.binding_type,
                has_lamination=book.has_lamination,
                materials_snapshot=materials_snapshot,
                subtotal=subtotal,
            )
        )
        total_amount += subtotal

    total_amount = total_amount.quantize(Decimal("0.01"))

    try:
        new_order = await OrderCRUD.create(
            db,
            tenant_id=tenant_id,
            customer_id=customer_id if order_create.customer_id else None,
            walk_in_customer_id=walk_in_customer_id
            if order_create.walk_in_customer_id
            else None,
            created_by=created_by,
            order_number=order_number,
            total_amount=total_amount,
            notes=order_create.notes,
            due_date=order_create.due_date,
        )

        # Attach order_id and create order items
        for oi in order_items_to_create:
            oi.order_id = new_order.id
        await OrderItemsCRUD.batch_create(db, order_items_to_create)

        # Create MaterialTransactions for consumption and deduct stock
        for item, oi in zip(order_create.items, order_items_to_create):
            book = books_map[item.book_id]
            for bm in book.book_materials:
                total_qty = bm.quantity_per_copy * item.copies
                transaction = MaterialTransactions(
                    material_id=bm.material_id,
                    quantity=total_qty,
                    transaction_type=MaterialTransactionType.CONSUMPTION,
                    order_id=new_order.id,
                    notes="Auto-consumption from order",
                    created_by=created_by,
                    tenant_id=bm.material.tenant_id,
                )
                db.add(transaction)
                bm.material.current_stock -= total_qty

        await db.commit()
        await db.refresh(new_order, attribute_names=["items"])
        return OrderResponse.model_validate(new_order)

    except Exception as e:
        await db.rollback()
        raise Exception(f"Error creating order: {str(e)}")


async def get_order(
    db: AsyncSession,
    tenant_id: UUID,
    order_id: UUID,
) -> OrderResponse:
    """Retrieve an order by its ID."""
    order = await OrderCRUD.get_by_id(db, order_id)
    if not order or order.tenant_id != tenant_id:
        raise ValueError("Order not found")
    return OrderResponse.model_validate(order)


async def update_order(
    db: AsyncSession,
    tenant_id: UUID,
    order_id: UUID,
    order_update: OrderUpdate,
) -> OrderResponse:
    """Update an existing order."""
    existing_order = await OrderCRUD.get_by_id(db, order_id)
    if (
        not existing_order
        or existing_order.tenant_id != tenant_id
        or existing_order.status in [OrderStatus.CANCELLED, OrderStatus.DELIVERED]
    ):
        raise ValueError("Order not found")

    update_data = order_update.model_dump(exclude_unset=True, exclude_none=True)

    if not update_data:
        raise ValueError("No valid fields to update")

    try:
        updated_order = await OrderCRUD.update(
            db=db, db_obj=existing_order, **update_data
        )
        await db.commit()
        await db.refresh(updated_order, attribute_names=["items"])
        return OrderResponse.model_validate(updated_order)
    except Exception as e:
        await db.rollback()
        raise Exception(f"Error updating order: {str(e)}")


VALID_TRANSITIONS = {
    OrderStatus.NEW: {OrderStatus.PRINTING, OrderStatus.CANCELLED},
    OrderStatus.PRINTING: {OrderStatus.READY, OrderStatus.CANCELLED},
    OrderStatus.READY: {OrderStatus.DELIVERED, OrderStatus.CANCELLED},
}


async def update_order_status(
    db: AsyncSession,
    tenant_id: UUID,
    order_id: UUID,
    status_update: OrderStatusUpdate,
) -> OrderResponse:
    """Update the status of an existing order."""
    existing_order = await OrderCRUD.get_by_id(db, order_id)
    if not existing_order or existing_order.tenant_id != tenant_id:
        raise ValueError("Cannot update a cancelled or delivered order")

    new_status = status_update.status
    current_status = existing_order.status

    if new_status == current_status:
        raise ValueError(f"Order is already in '{new_status}' status")

    allowed_transitions = VALID_TRANSITIONS.get(current_status, set())
    if new_status not in allowed_transitions:
        raise ValueError(
            f"Invalid status transition from '{current_status}' to '{new_status}'"
        )
    try:
        updated_order = await OrderCRUD.update(
            db=db, db_obj=existing_order, status=new_status
        )
        await db.commit()
        await db.refresh(updated_order, attribute_names=["items"])
        return OrderResponse.model_validate(updated_order)

    except Exception as e:
        await db.rollback()
        raise Exception(f"Error updating order status: {str(e)}")


async def delete_order(
    db: AsyncSession,
    tenant_id: UUID,
    order_id: UUID,
) -> None:
    """Delete an existing order."""
    existing_order = await OrderCRUD.get_by_id(db, order_id)

    if not existing_order or existing_order.tenant_id != tenant_id:
        raise ValueError("Order not found")

    if existing_order.status not in (OrderStatus.NEW, OrderStatus.CANCELLED):
        raise ValueError("Can only delete NEW or CANCELLED orders")

    try:
        await OrderCRUD.delete(db, id=order_id)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise Exception(f"Error deleting order: {str(e)}")


async def list_orders(
    db: AsyncSession,
    tenant_id: UUID,
    created_by: UUID | None,
    orders_request: OrdersRequest,
) -> OrdersListResponse:
    """List orders with optional filtering and pagination."""

    orders, total_count = await OrderCRUD.get_orders(
        db=db,
        tenant_id=tenant_id,
        customer_id=orders_request.customer_id,
        walk_in_customer_id=orders_request.walk_in_customer_id,
        created_by=created_by,
        status=orders_request.status.value if orders_request.status else None,
        date_from=orders_request.date_from,
        date_to=orders_request.date_to,
        order_number=orders_request.order_number,
        offset=orders_request.offset,
        limit=orders_request.limit,
        order_by=orders_request.order_by,
        order_dir=orders_request.order_dir,
    )
    return OrdersListResponse(
        total=total_count,
        orders=[OrderResponse.model_validate(order) for order in orders],
    )
