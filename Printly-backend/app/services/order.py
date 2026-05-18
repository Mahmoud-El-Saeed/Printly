import math
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from uuid import UUID
from decimal import Decimal


from app.enums import OrderStatus
from app.db import OrderCRUD, OrderItemsCRUD, UserCRUD, WalkInCustomerCRUD, BookCRUD

from app.models import Users, WalkInCustomers, OrderItems

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
    """Createing a new Order."""
    user_crud = UserCRUD()
    walk_in_customer_crud = WalkInCustomerCRUD()
    order_crud = OrderCRUD()
    order_item_crud = OrderItemsCRUD()
    book_crud = BookCRUD()

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
    
    # Validate and fetch customer or walk-in customer
    if order_create.customer_id:
        customer: Users = await user_crud.get_by_id(db=db, id=order_create.customer_id)
        if not customer or customer.tenant_id != tenant_id:
            raise ValueError("Customer not found.")
        customer_id = customer.id
    
    if order_create.walk_in_customer_id:
        walk_in_customer: WalkInCustomers = await walk_in_customer_crud.get_by_id(
            db=db, id=order_create.walk_in_customer_id
        )
        if not walk_in_customer or walk_in_customer.tenant_id != tenant_id:
            raise ValueError("Walk-in customer not found.")
        walk_in_customer_id = walk_in_customer.id

    order_number = await __generate_order_number(redis_client, tenant_id)

    books_ids = [item.book_id for item in order_create.items if item.book_id]
    if books_ids:
        books = await book_crud.get_books_by_ids(db, books_ids)
        books_dict = {book.id: book for book in books if book.tenant_id == tenant_id}
        for item in order_create.items:
            if item.book_id and item.book_id not in books_dict:
                raise ValueError(f"Book with ID {item.book_id} not found.")
    
    
    # Calculate total amount based on order items
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

        order_item_data.append(
            {
                **item.model_dump(),
                "subtotal": item_subtotal,
            }
        )
        total_amount += item_subtotal

    try:
        new_order = await order_crud.create(
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

        
        items_to_create = [
            OrderItems(order_id=new_order.id, **item)
            for item in order_item_data
        ]
        await order_item_crud.batch_create(db, items_to_create)
            
        
        await db.commit()
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
    order_crud = OrderCRUD()
    order = await order_crud.get_by_id(db, order_id)
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
    order_crud = OrderCRUD()
    existing_order = await order_crud.get_by_id(db, order_id)
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
        updated_order = await order_crud.update(
            db=db, db_obj=existing_order, **update_data
        )
        await db.commit()
        return OrderResponse.model_validate(updated_order)
    except Exception as e:
        await db.rollback()
        raise Exception(f"Error updating order: {str(e)}")


VALID_TRANSITIONS = {
    OrderStatus.NEW: {OrderStatus.PRINTING, OrderStatus.CANCELLED},
    OrderStatus.PRINTING: {OrderStatus.READY, OrderStatus.CANCELLED},
    OrderStatus.READY: {OrderStatus.DELIVERED, OrderStatus.CANCELLED},
    # Cancelled and Delivered are terminal states
}


async def update_order_status(
    db: AsyncSession,
    tenant_id: UUID,
    order_id: UUID,
    status_update: OrderStatusUpdate,
) -> OrderResponse:
    """Update the status of an existing order."""
    order_crud = OrderCRUD()
    existing_order = await order_crud.get_by_id(db, order_id)
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
        updated_order = await order_crud.update(
            db=db, db_obj=existing_order, status=new_status
        )
        await db.commit()
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
    order_crud = OrderCRUD()
    existing_order = await order_crud.get_by_id(db, order_id)
    
    if not existing_order or existing_order.tenant_id != tenant_id:
        raise ValueError("Order not found")
    
    if existing_order.status not in (OrderStatus.NEW, OrderStatus.CANCELLED):
        raise ValueError("Can only delete NEW or CANCELLED orders")
    
    try:
        await order_crud.delete(db, id=order_id)
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
    order_crud = OrderCRUD()
    
    orders, total_count = await order_crud.get_orders(
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