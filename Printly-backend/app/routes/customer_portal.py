from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import logging

from app.routes.deps import get_db, require_customer

from app.services import (
    get_my_profile,
    get_my_balance,
    get_my_notifications,
    mark_my_notification_read,
    get_my_orders,
    get_my_books,
    get_my_order,
    get_my_tenants,
    mark_all_my_notifications_read,
)
from app.schemas import (
    TokenData,
    OrdersListResponse,
    OrderResponse,
    BookListResponse,
    CustomerBalanceResponse,
    NotificationListResponse,
    NotificationListRequest,
    PortalProfileResponse,
    PortalTenantsResponse,
    OrdersCustomerRequest,
)


router = APIRouter(prefix="/portal", tags=["customer-portal"])
logger = logging.getLogger(__name__)


@router.get("/me/profile", response_model=PortalProfileResponse)
async def get_my_profile_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
) -> PortalProfileResponse:
    """Return the logged-in customer's own profile."""
    try:
        return await get_my_profile(db, current_user.user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch profile",
        ) from e


@router.get("/me/tenants", response_model=PortalTenantsResponse)
async def get_my_tenants_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
    offset: int = 0,
    limit: int = 20,
) -> PortalTenantsResponse:
    """Return all tenants where the customer is an approved member."""
    try:
        return await get_my_tenants(db, current_user.user_id, offset, limit)
    except Exception as e:
        logger.error(f"Error fetching tenants: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch tenants",
        ) from e


@router.get("/tenants/{tenant_id}/orders", response_model=OrdersListResponse)
async def get_my_orders_endpoint(
    tenant_id: UUID,
    request: Annotated[OrdersCustomerRequest, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
) -> OrdersListResponse:
    """List the customer's orders within a specific tenant."""
    try:
        return await get_my_orders(
            db,
            tenant_id,
            current_user.user_id,
            status=request.status,
            date_from=request.date_from,
            date_to=request.date_to,
            offset=request.offset,
            limit=request.limit,
            order_by=request.order_by,
            order_dir=request.order_dir,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Error fetching orders: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch orders",
        ) from e


@router.get("/tenants/{tenant_id}/orders/{order_id}", response_model=OrderResponse)
async def get_my_order_endpoint(
    tenant_id: UUID,
    order_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
) -> OrderResponse:
    """Return a single order belonging to the customer."""
    try:
        return await get_my_order(db, tenant_id, current_user.user_id, order_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Error fetching order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch order",
        ) from e


@router.get("/tenants/{tenant_id}/books", response_model=BookListResponse)
async def get_my_books_endpoint(
    tenant_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
    title: str | None = None,
    subject: str | None = None,
    offset: int = 0,
    limit: int = 10,
    order_by: str = "created_at",
    order_dir: str = "desc",
) -> BookListResponse:
    """List the customer's books within a specific tenant."""
    try:
        return await get_my_books(
            db,
            tenant_id,
            current_user.user_id,
            title=title,
            subject=subject,
            offset=offset,
            limit=limit,
            order_by=order_by,
            order_dir=order_dir,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Error fetching books: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch books",
        ) from e


@router.get("/tenants/{tenant_id}/balance", response_model=CustomerBalanceResponse)
async def get_my_balance_endpoint(
    tenant_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
) -> CustomerBalanceResponse:
    """Return the customer's balance for a specific tenant."""
    try:
        return await get_my_balance(db, tenant_id, current_user.user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Error fetching balance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch balance",
        ) from e


@router.get(
    "/tenants/{tenant_id}/notifications", response_model=NotificationListResponse
)
async def get_my_notifications_endpoint(
    tenant_id: UUID,
    request: Annotated[NotificationListRequest, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
) -> NotificationListResponse:
    """Return the customer's notifications for a specific tenant."""
    try:
        return await get_my_notifications(
            db,
            tenant_id,
            current_user.user_id,
            request,
        )
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch notifications",
        ) from e


@router.patch(
    "/tenants/{tenant_id}/notifications/{notification_id}/read",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def mark_my_notification_read_endpoint(
    tenant_id: UUID,
    notification_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
) -> None:
    """Mark a specific notification as read."""
    try:
        await mark_my_notification_read(
            db,
            tenant_id,
            current_user.user_id,
            notification_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read",
        ) from e


@router.patch(
    "/tenants/{tenant_id}/notifications/read", status_code=status.HTTP_204_NO_CONTENT
)
async def mark_all_my_notifications_read_endpoint(
    tenant_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
) -> None:
    """Mark all notifications as read for the customer in a tenant."""
    try:
        await mark_all_my_notifications_read(
            db,
            tenant_id,
            current_user.user_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark all notifications as read",
        ) from e
