from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from typing import Annotated
from uuid import UUID

from app.routes.deps import get_db, require_tenant_staff, require_customer_or_staff
from app.services import (
    create_walk_in_customer,
    list_walk_in_customers,
    update_walk_in_customer,
    delete_walk_in_customer,
    get_walk_in_customer_by_id,
    create_customer_member,
    list_customer_members,
    update_customer_member,
    delete_customer_member,
    get_customer_member_by_id,
    request_customer_link,
    get_pending_link_requests,
    get_customer_link_requests,
    approve_or_reject_link_request,
    get_customer_balance,
)
from app.schemas import (
    WalkInCustomerCreate,
    WalkInCustomerResponse,
    WalkInCustomerUpdate,
    WalkInCustomerListResponse,
    WalkInCustomerListRequest,
    CustomerMemberCreate,
    CustomerMemberResponse,
    CustomerMemberUpdate,
    CustomerLinkResponse,
    CustomerLinkListRequest,
    CustomerLinkListResponse,
    CustomerLinkRequest,
    CustomerMemberListRequest,
    CustomerMemberListResponse,
    CustomerLinkApprovalRequest,
    TokenData,
    CustomerBalanceResponse,
)

router = APIRouter(prefix="/customers", tags=["customers"])
logger = logging.getLogger(__name__)


@router.post(
    "/walk-in",
    response_model=WalkInCustomerResponse,
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
        return await get_walk_in_customer_by_id(db, current_user.tenant_id, customer_id)

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
        return await update_walk_in_customer(
            db, current_user.tenant_id, customer_id, data
        )

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
        await delete_walk_in_customer(db, current_user.tenant_id, customer_id)

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


@router.post(
    "/member",
    response_model=CustomerMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_customer_member_endpoint(
    data: CustomerMemberCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> CustomerMemberResponse:
    """Endpoint to create a new customer member for the tenant"""
    try:
        return await create_customer_member(db, current_user.tenant_id, data)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    except Exception as e:
        logger.error(f"Error creating customer member: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the customer member",
        ) from e


@router.get("/member", response_model=CustomerMemberListResponse)
async def list_customer_members_endpoint(
    data: Annotated[CustomerMemberListRequest, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> CustomerMemberListResponse:
    """Endpoint to list customer members for the tenant with pagination"""
    try:
        return await list_customer_members(db, current_user.tenant_id, data)

    except Exception as e:
        logger.error(f"Error listing customer members: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while listing customer members",
        ) from e


@router.get("/member/{customer_id}", response_model=CustomerMemberResponse)
async def get_customer_member_by_id_endpoint(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> CustomerMemberResponse:
    """Endpoint to get a customer member by ID"""
    try:
        return await get_customer_member_by_id(db, current_user.tenant_id, customer_id)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    except Exception as e:
        logger.error(f"Error getting customer member by ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while getting the customer member",
        ) from e


@router.put("/member/{customer_id}", response_model=CustomerMemberResponse)
async def update_customer_member_endpoint(
    customer_id: UUID,
    data: CustomerMemberUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> CustomerMemberResponse:
    """Endpoint to update a customer member's details"""
    try:
        return await update_customer_member(
            db, current_user.tenant_id, customer_id, data
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    except Exception as e:
        logger.error(f"Error updating customer member: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the customer member",
        ) from e


@router.delete("/member/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer_member_endpoint(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> None:
    """Endpoint to delete a customer member"""
    try:
        await delete_customer_member(db, current_user.tenant_id, customer_id)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    except Exception as e:
        logger.error(f"Error deleting customer member: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the customer member",
        ) from e


@router.post(
    "/link", response_model=CustomerLinkResponse, status_code=status.HTTP_201_CREATED
)
async def request_customer_link_endpoint(
    data: CustomerLinkRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer_or_staff)],
) -> CustomerLinkResponse:
    """Endpoint for customers to request a link to the tenant"""
    try:
        return await request_customer_link(db, current_user.user_id, data)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    except Exception as e:
        logger.error(f"Error requesting customer link: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while requesting the customer link",
        ) from e


@router.get("/link", response_model=CustomerLinkListResponse)
async def get_customer_link_requests_endpoint(
    data: Annotated[CustomerLinkListRequest, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_customer_or_staff)],
) -> CustomerLinkListResponse:
    """Endpoint for customers to get their link requests to tenants"""
    try:
        return await get_customer_link_requests(db, current_user.user_id, data)

    except Exception as e:
        logger.error(f"Error getting customer link requests: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while getting customer link requests",
        ) from e


@router.get("/link/requests", response_model=CustomerLinkListResponse)
async def get_pending_link_requests_endpoint(
    data: Annotated[CustomerLinkListRequest, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> CustomerLinkListResponse:
    """Endpoint for tenant staff to get pending customer link requests"""
    try:
        return await get_pending_link_requests(db, current_user.tenant_id, data)

    except Exception as e:
        logger.error(f"Error getting customer link requests: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while getting customer link requests",
        ) from e


@router.post("/link/{link_id}/approve", response_model=CustomerLinkResponse)
async def approve_or_reject_link_request_endpoint(
    link_id: UUID,
    data: CustomerLinkApprovalRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> CustomerLinkResponse:
    """Endpoint for tenant staff to approve or reject a customer link request"""
    try:
        return await approve_or_reject_link_request(
            db, current_user.tenant_id, link_id, data
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    except Exception as e:
        logger.error(f"Error approving/rejecting customer link request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while approving/rejecting the customer link request",
        ) from e


@router.get("/{customer_id}/balance", response_model=CustomerBalanceResponse)
async def get_customer_balance_endpoint(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
) -> CustomerBalanceResponse:
    """Endpoint to get the balance information of a customer"""
    try:
        return await get_customer_balance(db, current_user.tenant_id, customer_id)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    except Exception as e:
        logger.error(f"Error getting customer balance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while getting the customer balance",
        ) from e
