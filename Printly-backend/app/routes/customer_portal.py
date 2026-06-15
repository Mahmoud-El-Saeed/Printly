from typing import Annotated
from uuid import UUID
import logging

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.routes.deps import get_db, require_customer, require_approved_tenant_member, get_redis
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
    update_my_profile,
    portal_create_order,
    portal_create_book,
    portal_create_payment,
)
from app.schemas import (
    TokenData,
    OrdersListResponse,
    OrderResponse,
    OrderCreate,
    BookListResponse,
    BookCreate,
    BookResponse,
    PaymentResponse,
    CustomerBalanceResponse,
    NotificationListResponse,
    NotificationListRequest,
    PortalProfileResponse,
    PortalProfileUpdateRequest,
    PortalTenantsResponse,
    PortalPaymentCreate,
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch profile") from e


@router.put("/me/profile", response_model=PortalProfileResponse)
async def update_my_profile_endpoint(
    update_data: PortalProfileUpdateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
) -> PortalProfileResponse:
    """Update the logged-in customer's profile."""
    try:
        return await update_my_profile(db, current_user.user_id, update_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update profile") from e


@router.get("/me/tenants", response_model=PortalTenantsResponse)
async def get_my_tenants_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
    offset: int = 0,
    limit: int = 20,
) -> PortalTenantsResponse:
    """Return all tenants where the customer is a member (pending, approved, rejected)."""
    try:
        return await get_my_tenants(db, current_user.user_id, offset, limit)
    except Exception as e:
        logger.error(f"Error fetching tenants: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch tenants") from e


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
            db, tenant_id, current_user.user_id,
            status=request.status, date_from=request.date_from, date_to=request.date_to,
            offset=request.offset, limit=request.limit,
            order_by=request.order_by, order_dir=request.order_dir,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error fetching orders: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch orders") from e


@router.post("/tenants/{tenant_id}/orders", response_model=OrderResponse)
async def portal_create_order_endpoint(
    tenant_id: UUID,
    order_create: OrderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis_client: Annotated[Redis, Depends(get_redis)],
    current_user: Annotated[TokenData, Depends(require_approved_tenant_member)],
) -> OrderResponse:
    """Create a new order from the customer portal."""
    try:
        return await portal_create_order(db, redis_client, tenant_id, current_user.user_id, order_create)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error creating portal order: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create order") from e


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error fetching order: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch order") from e


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
        return await get_my_books(db, tenant_id, current_user.user_id, title=title, subject=subject, offset=offset, limit=limit, order_by=order_by, order_dir=order_dir)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error fetching books: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch books") from e


@router.post("/tenants/{tenant_id}/books", response_model=BookResponse)
async def portal_create_book_endpoint(
    tenant_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_approved_tenant_member)],
    title: str = Form(...),
    total_pages: int = Form(..., gt=0),
    subject: str | None = Form(None),
    color_mode: str = Form("bw"),
    sides_per_page: int = Form(1, ge=1, le=4),
    copies: int = Form(1, gt=0),
    binding_type: str | None = Form(None),
    has_lamination: bool = Form(False),
    notes: str | None = Form(None),
    file: UploadFile | None = File(None),
) -> BookResponse:
    """Create a new book from the customer portal."""
    try:
        book_data = BookCreate(
            title=title,
            subject=subject,
            total_pages=total_pages,
            color_mode=color_mode,
            sides_per_page=sides_per_page,
            copies=copies,
            binding_type=binding_type,
            has_lamination=has_lamination,
            notes=notes,
            file=file,
        )
        return await portal_create_book(db, tenant_id, current_user.user_id, book_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error creating portal book: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create book") from e


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error fetching balance: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch balance") from e


@router.post("/tenants/{tenant_id}/payments", response_model=PaymentResponse)
async def portal_create_payment_endpoint(
    tenant_id: UUID,
    payment_data: PortalPaymentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_approved_tenant_member)],
) -> PaymentResponse:
    """Create a payment from the customer portal."""
    try:
        return await portal_create_payment(
            db, tenant_id, current_user.user_id,
            payment_data.order_id, payment_data.amount,
            payment_data.payment_method,
            payment_data.reference, payment_data.notes,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error creating portal payment: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create payment") from e


@router.get("/tenants/{tenant_id}/notifications", response_model=NotificationListResponse)
async def get_my_notifications_endpoint(
    tenant_id: UUID,
    request: Annotated[NotificationListRequest, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
) -> NotificationListResponse:
    """Return the customer's notifications for a specific tenant."""
    try:
        return await get_my_notifications(db, tenant_id, current_user.user_id, request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch notifications") from e


@router.patch("/tenants/{tenant_id}/notifications/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_my_notification_read_endpoint(
    tenant_id: UUID,
    notification_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
) -> None:
    """Mark a specific notification as read."""
    try:
        await mark_my_notification_read(db, tenant_id, current_user.user_id, notification_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to mark notification as read") from e


@router.patch("/tenants/{tenant_id}/notifications/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_my_notifications_read_endpoint(
    tenant_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer)],
) -> None:
    """Mark all notifications as read for the customer in a tenant."""
    try:
        await mark_all_my_notifications_read(db, tenant_id, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to mark all notifications as read") from e