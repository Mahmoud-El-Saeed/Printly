from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends, status
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.routes.deps import get_db, require_tenant_staff

from app.schemas import (
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentListResponse,
    PaymentRequest,
    SettlePaymentCreate,
    SettlePaymentResponse,
    TokenData,
)


from app.services import (
    create_payment,
    get_payment,
    list_payments,
    update_payment,
    delete_payment,
    settle_payments_for_customer,
)

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_endpoint(
    payment: PaymentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> PaymentResponse:
    """Create a new payment."""
    try:
        return await create_payment(db, user.tenant_id, user.user_id, payment)
    except ValueError as e:
        logger.error(f"Error creating payment: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error creating payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.post("/settle", response_model=SettlePaymentResponse)
async def settle_payments_endpoint(
    settle_request: SettlePaymentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> SettlePaymentResponse:
    """Settle outstanding balance for a customer."""
    try:
        return await settle_payments_for_customer(
            db, user.tenant_id, user.user_id, settle_request
        )

    except ValueError as e:
        logger.error(f"Error settling payments: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error settling payments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get("/", response_model=PaymentListResponse)
async def list_payments_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    request: Annotated[PaymentRequest, Depends()],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> PaymentListResponse:
    """List payments with optional filters."""
    try:
        return await list_payments(db, user.tenant_id, request)
    except Exception as e:
        logger.error(f"Error listing payments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment_endpoint(
    payment_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> PaymentResponse:
    """Get a specific payment by ID."""
    try:
        return await get_payment(db, user.tenant_id, payment_id)
    except ValueError as e:
        logger.error(f"Error retrieving payment: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error retrieving payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment_endpoint(
    payment_id: UUID,
    payment_update: PaymentUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> PaymentResponse:
    """Update an existing payment."""
    try:
        return await update_payment(db, user.tenant_id, payment_id, payment_update)
    except ValueError as e:
        logger.error(f"Error updating payment: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error updating payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment_endpoint(
    payment_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> None:
    """Delete a payment."""
    try:
        await delete_payment(db, user.tenant_id, payment_id)
    except ValueError as e:
        logger.error(f"Error deleting payment: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error deleting payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )
