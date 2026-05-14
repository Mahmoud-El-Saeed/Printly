from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from typing import Annotated
from uuid import UUID

from app.routes.deps import get_db, get_current_user, require_tenant_staff
from app.services import (
    create_walk_in_customer,
    list_walk_in_customers,
    update_walk_in_customer,
    delete_walk_in_customer,
    get_walk_in_customer_by_id,
)
from app.schemas import (
    WalkInCustomerCreate,
    WalkInCustomerResponse,
    WalkInCustomerUpdate,
    WalkInCustomerListResponse,
    WalkInCustomerListRequest,
    TokenData,
)

router = APIRouter(prefix="/customers", tags=["customers"])
logger = logging.getLogger(__name__)


@router.post(
    "/walk-in", response_model=WalkInCustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_walk_in_customer_endpoint(
    data: WalkInCustomerCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> WalkInCustomerResponse:
    """Endpoint to create a new walk-in customer for the tenant"""
    try:
        return await create_walk_in_customer(db, current_user.tenant_id, data)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    except Exception as e:
        logger.error(f"Error creating walk-in customer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the walk-in customer",
        ) from e

@router.get("/walk-in", response_model=WalkInCustomerListResponse)
async def list_walk_in_customers_endpoint(
    data: Annotated[WalkInCustomerListRequest, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> WalkInCustomerListResponse:
    """Endpoint to list walk-in customers for the tenant with pagination"""
    try:
        return await list_walk_in_customers(db, current_user.tenant_id, data)

    except Exception as e:
        logger.error(f"Error listing walk-in customers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while listing walk-in customers",
        ) from e
        

@router.get("/walk-in/{customer_id}", response_model=WalkInCustomerResponse)
async def get_walk_in_customer_by_id_endpoint(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> WalkInCustomerResponse:
    """Endpoint to get a walk-in customer by ID"""
    try:
        return await get_walk_in_customer_by_id(db,current_user.tenant_id, customer_id)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    except Exception as e:
        logger.error(f"Error getting walk-in customer by ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while getting the walk-in customer",
        ) from e

@router.put("/walk-in/{customer_id}", response_model=WalkInCustomerResponse)
async def update_walk_in_customer_endpoint(
    customer_id: UUID,
    data: WalkInCustomerUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> WalkInCustomerResponse:
    """Endpoint to update a walk-in customer's details"""
    try:
        return await update_walk_in_customer(db,current_user.tenant_id, customer_id, data)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    except Exception as e:
        logger.error(f"Error updating walk-in customer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the walk-in customer",
        ) from e
    

@router.delete("/walk-in/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_walk_in_customer_endpoint(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> None:
    """Endpoint to delete a walk-in customer"""
    try:

        await delete_walk_in_customer(db,current_user.tenant_id, customer_id)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    except Exception as e:
        logger.error(f"Error deleting walk-in customer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the walk-in customer",
        ) from e