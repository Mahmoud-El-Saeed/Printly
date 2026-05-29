from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.schemas import (
    ActivationCodeCreate,
    ActivationCodeResponse,
    ActivationCodeListResponse,
    ActivationsRequest,
    ActivationCodeApplyRequest,
    ActivationCodeApplyResponse,
    TokenData,
)

from app.services import (
    create_activation_code,
    list_activation_codes,
    apply_activation_code,
)
from app.routes.deps import get_db, require_admin, require_tenant_staff

router = APIRouter(prefix="/activation-codes", tags=["Activation Codes"])
logger = logging.getLogger(__name__)


@router.post("/redeem", response_model=ActivationCodeApplyResponse)
async def redeem_activation_code(
    request: ActivationCodeApplyRequest,
    user: Annotated[TokenData, Depends(require_tenant_staff)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ActivationCodeApplyResponse:
    """Redeem an activation code to activate or extend a subscription."""
    try:
        return await apply_activation_code(db, user.tenant_id, request)

    except ValueError as ve:
        logger.warning(f"Failed to redeem activation code: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Error redeeming activation code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.post(
    "/", response_model=ActivationCodeResponse, dependencies=[Depends(require_admin)]
)
async def create_code(
    code_data: ActivationCodeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ActivationCodeResponse:
    """Create a new activation code for a subscription plan."""
    try:
        return await create_activation_code(db, code_data)
    except ValueError as ve:
        logger.warning(f"Failed to create activation code: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Error creating activation code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get(
    "/",
    response_model=ActivationCodeListResponse,
    dependencies=[Depends(require_admin)],
)
async def list_codes(
    db: Annotated[AsyncSession, Depends(get_db)],
    request: Annotated[ActivationsRequest, Depends()],
) -> ActivationCodeListResponse:
    """List all activation codes."""
    try:
        return await list_activation_codes(db, request)
    except Exception as e:
        logger.error(f"Error listing activation codes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )
