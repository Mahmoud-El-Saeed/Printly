from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.models import WalkInCustomers
from app.db import WalkInCustomerCRUD
from app.schemas import (
    WalkInCustomerCreate,
    WalkInCustomerResponse,
    WalkInCustomerUpdate,
    WalkInCustomerListResponse,
    WalkInCustomerListRequest,
)


async def create_walk_in_customer(
    db: AsyncSession,
    tenant_id: UUID,
    data: WalkInCustomerCreate,
) -> WalkInCustomerResponse:
    """Create a new walk-in customer for the tenant"""


    try:
        walk_in_customer: WalkInCustomers = await WalkInCustomerCRUD.create(
            db=db,
            tenant_id=tenant_id,
            name=data.name,
            phone=data.phone,
            notes=data.notes,
        )
        await db.commit()
        return WalkInCustomerResponse.model_validate(walk_in_customer)

    except Exception as e:
        await db.rollback()
        raise e


async def list_walk_in_customers(
    db: AsyncSession,
    tenant_id: UUID,
    data: WalkInCustomerListRequest,
) -> WalkInCustomerListResponse:
    """List walk-in customers for the tenant with pagination"""


    walk_in_customers, total = await WalkInCustomerCRUD.get_list(
        db=db,
        filters={"tenant_id": tenant_id},
        offset=data.skip,
        limit=data.limit,
        order_by=data.order_by,
        order_dir=data.order_dir,
    )
    return WalkInCustomerListResponse(
        customers=[WalkInCustomerResponse.model_validate(c) for c in walk_in_customers],
        total=total,
    )


async def update_walk_in_customer(
    db: AsyncSession,
    tenant_id: UUID,
    customer_id: UUID,
    data: WalkInCustomerUpdate,
) -> WalkInCustomerResponse:
    """Update a walk-in customer's details"""


    walk_in_customer: WalkInCustomers = await WalkInCustomerCRUD.get_by_id(
        db=db, id=customer_id
    )
    if not walk_in_customer or walk_in_customer.tenant_id != tenant_id:
        raise ValueError("Walk-in customer not found")

    try:
        updated_customer = await WalkInCustomerCRUD.update(
            db=db,
            db_obj=walk_in_customer,
            name=data.name,
            phone=data.phone,
            notes=data.notes,
        )
        await db.commit()
        return WalkInCustomerResponse.model_validate(updated_customer)

    except Exception as e:
        await db.rollback()
        raise e


async def _get_walk_in_customer_or_raise(
    db: AsyncSession,
    tenant_id: UUID,
    customer_id: UUID,
) -> WalkInCustomers:
    """Helper function to get walk-in customer and validate ownership"""

    walk_in_customer: WalkInCustomers = await WalkInCustomerCRUD.get_by_id(
        db=db, id=customer_id
    )

    if not walk_in_customer or walk_in_customer.tenant_id != tenant_id:
        raise ValueError("Walk-in customer not found")
    return walk_in_customer


async def delete_walk_in_customer(
    db: AsyncSession,
    tenant_id: UUID,
    customer_id: UUID,
) -> None:
    """Delete a walk-in customer"""


    _: WalkInCustomers = await _get_walk_in_customer_or_raise(
        db=db,
        tenant_id=tenant_id,
        customer_id=customer_id,
    )

    try:
        await WalkInCustomerCRUD.delete(db=db, id=customer_id)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise e


async def get_walk_in_customer_by_id(
    db: AsyncSession,
    tenant_id: UUID,
    customer_id: UUID,
) -> WalkInCustomerResponse:
    """Get a walk-in customer's details by ID"""

    walk_in_customer: WalkInCustomers = await _get_walk_in_customer_or_raise(
        db=db,
        tenant_id=tenant_id,
        customer_id=customer_id,
    )

    return WalkInCustomerResponse.model_validate(walk_in_customer)
