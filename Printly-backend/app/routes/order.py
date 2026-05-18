from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from redis.asyncio import Redis
from uuid import UUID

from app.routes.deps import get_db, get_redis_client, require_tenant_staff

from app.schemas import (
    OrderCreate,
    OrderResponse,
    OrderUpdate,
    OrderStatusUpdate,
    OrdersRequest,
    OrdersListResponse,
    TokenData,
)
from app.services import (
    create_order,
    get_order,
    update_order,
    update_order_status,
    delete_order,
    list_orders,
)

router = APIRouter(prefix="/orders", tags=["Orders"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order_endpoint(
    order_create: Annotated[OrderCreate, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis_client: Annotated[Redis, Depends(get_redis_client)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Create a new order for a customer or walk-in customer."""
    try:
        order = await create_order(
            db=db,
            redis_client=redis_client,
            tenant_id=current_user.tenant_id,
            created_by=current_user.user_id,
            order_create=order_create,
        )
        return order
    except ValueError as e:
        logger.error(f"Error creating order: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error creating order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get("/", response_model=OrdersListResponse)
async def list_orders_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
    orders_request: Annotated[OrdersRequest, Depends()],
):
    """List all orders for a customer or walk-in customer."""
    try:
        orders = await list_orders(
            db=db,
            tenant_id=current_user.tenant_id,
            created_by=current_user.user_id,
            orders_request=orders_request,
        )
        return orders
    except Exception as e:
        logger.error(f"Unexpected error listing orders: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_endpoint(
    order_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Get details of a specific order by ID."""
    try:
        return await get_order(
            db=db, tenant_id=current_user.tenant_id, order_id=order_id
        )
    except ValueError as e:
        logger.error(f"Error fetching order: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error fetching order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order_endpoint(
    order_id: UUID,
    order_update: Annotated[OrderUpdate, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Update an existing order."""
    try:
        updated_order = await update_order(
            db=db,
            tenant_id=current_user.tenant_id,
            order_id=order_id,
            order_update=order_update,
        )
        return updated_order
    except ValueError as e:
        logger.error(f"Error updating order: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error updating order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status_endpoint(
    order_id: UUID,
    status_update: Annotated[OrderStatusUpdate, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Update the status of an existing order."""
    try:
        updated_order = await update_order_status(
            db=db,
            tenant_id=current_user.tenant_id,
            order_id=order_id,
            status_update=status_update,
        )
        return updated_order
    except ValueError as e:
        logger.error(f"Error updating order status: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error updating order status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order_endpoint(
    order_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Delete an existing order."""
    try:
        await delete_order(db=db, tenant_id=current_user.tenant_id, order_id=order_id)
    except ValueError as e:
        logger.error(f"Error deleting order: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error deleting order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )
