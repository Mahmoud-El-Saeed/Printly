from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.routes.deps import get_db, require_tenant_staff
from app.schemas import TenantProfileResponse, TenantUpdateRequest, TokenData
from app.services import get_my_tenant, update_my_tenant


router = APIRouter(prefix="/tenants", tags=["Tenants"])
logger = logging.getLogger(__name__)


@router.get("/me", response_model=TenantProfileResponse)
async def get_tenant_profile(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    try:
        return await get_my_tenant(db, user.tenant_id)
    except ValueError as e:
        logger.warning(f"Tenant not found: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching tenant profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch tenant profile",
        )

@router.put("/me", response_model=TenantProfileResponse)
async def update_tenant_profile(
    update_data: TenantUpdateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    try:
        return await update_my_tenant(db, user.tenant_id, update_data)
    except ValueError as e:
        logger.warning(f"Tenant not found: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating tenant profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update tenant profile",
        )