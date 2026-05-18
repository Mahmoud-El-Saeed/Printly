from typing import Annotated
from fastapi import HTTPException, status, Depends, APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import logging

from app.schemas import (
    PricingRuleCreate,
    PricingRuleUpdate,
    PricingRuleResponse,
    PricingRuleListRequest,
    PricingRuleListResponse,
    CustomerPricingCreate,
    CustomerPricingUpdate,
    CustomerPricingResponse,
    CustomerPricingListResponse,
    TokenData,
)

from app.services import (
    create_pricing_rule,
    get_pricing_rule,
    update_pricing_rule,
    delete_pricing_rule,
    list_pricing_rules,
    create_customer_pricing,
    get_customer_pricing,
    update_customer_pricing,
    delete_customer_pricing,
    list_customer_pricings,
)

from app.routes.deps import get_db, require_tenant_staff

router = APIRouter(prefix="/pricing", tags=["pricing"])
logger = logging.getLogger(__name__)


@router.post(
    "/pricing-rules/",
    response_model=PricingRuleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_pricing_rule_endpoint(
    pricing_rule: Annotated[PricingRuleCreate, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to create a new pricing rule."""
    try:
        new_pricing_rule = await create_pricing_rule(db, user.tenant_id, pricing_rule)
        return new_pricing_rule
    except ValueError as e:
        logger.warning(f"Validation error creating pricing rule: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating pricing rule: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/pricing-rules/", response_model=PricingRuleListResponse)
async def list_pricing_rules_endpoint(
    request: Annotated[PricingRuleListRequest, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to list pricing rules with optional pagination, search, and sorting."""
    try:
        return await list_pricing_rules(db, user.tenant_id, request)
    except ValueError as e:
        logger.warning(f"Validation error listing pricing rules: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing pricing rules: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/pricing-rules/{pricing_rule_id}", response_model=PricingRuleResponse)
async def get_pricing_rule_endpoint(
    pricing_rule_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to get a pricing rule by ID."""
    try:
        return await get_pricing_rule(db, user.tenant_id, pricing_rule_id)
    except ValueError as e:
        logger.warning(f"Validation error getting pricing rule: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting pricing rule: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.put("/pricing-rules/{pricing_rule_id}", response_model=PricingRuleResponse)
async def update_pricing_rule_endpoint(
    pricing_rule_id: UUID,
    pricing_rule_update: Annotated[PricingRuleUpdate, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to update a pricing rule."""
    try:
        updated_pricing_rule = await update_pricing_rule(
            db, user.tenant_id, pricing_rule_id, pricing_rule_update
        )
        return updated_pricing_rule
    except ValueError as e:
        logger.warning(f"Validation error updating pricing rule: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating pricing rule: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete(
    "/pricing-rules/{pricing_rule_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_pricing_rule_endpoint(
    pricing_rule_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to delete a pricing rule."""
    try:
        await delete_pricing_rule(db, user.tenant_id, pricing_rule_id)
        return
    except ValueError as e:
        logger.warning(f"Validation error deleting pricing rule: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting pricing rule: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post(
    "/pricing-rules/{pricing_rule_id}/customer-pricings/",
    response_model=CustomerPricingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_customer_pricing_endpoint(
    pricing_rule_id: UUID,
    customer_pricing: Annotated[CustomerPricingCreate, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to create a new customer pricing for a specific pricing rule."""
    try:
        new_customer_pricing = await create_customer_pricing(
            db, user.tenant_id, pricing_rule_id, customer_pricing
        )
        return new_customer_pricing
    except ValueError as e:
        logger.warning(f"Validation error creating customer pricing: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating customer pricing: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get(
    "/pricing-rules/{pricing_rule_id}/customer-pricings/",
    response_model=CustomerPricingListResponse,
)
async def list_customer_pricings_endpoint(
    pricing_rule_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to list customer pricings for a specific pricing rule."""
    try:
        return await list_customer_pricings(db, user.tenant_id, pricing_rule_id)
    except ValueError as e:
        logger.warning(f"Validation error listing customer pricings: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing customer pricings: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get(
    "/pricing-rules/{pricing_rule_id}/customer-pricings/{customer_pricing_id}",
    response_model=CustomerPricingResponse,
)
async def get_customer_pricing_endpoint(
    pricing_rule_id: UUID,
    customer_pricing_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to get a specific customer pricing by ID."""
    try:
        return await get_customer_pricing(
            db, user.tenant_id, pricing_rule_id, customer_pricing_id
        )
    except ValueError as e:
        logger.warning(f"Validation error getting customer pricing: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting customer pricing: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.put(
    "/pricing-rules/{pricing_rule_id}/customer-pricings/{customer_pricing_id}",
    response_model=CustomerPricingResponse,
)
async def update_customer_pricing_endpoint(
    pricing_rule_id: UUID,
    customer_pricing_id: UUID,
    customer_pricing_update: Annotated[CustomerPricingUpdate, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to update a specific customer pricing."""
    try:
        updated_customer_pricing = await update_customer_pricing(
            db,
            user.tenant_id,
            pricing_rule_id,
            customer_pricing_id,
            customer_pricing_update,
        )
        return updated_customer_pricing
    except ValueError as e:
        logger.warning(f"Validation error updating customer pricing: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating customer pricing: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.delete(
    "/pricing-rules/{pricing_rule_id}/customer-pricings/{customer_pricing_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_customer_pricing_endpoint(
    pricing_rule_id: UUID,
    customer_pricing_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    """Endpoint to delete a specific customer pricing."""
    try:
        await delete_customer_pricing(
            db, user.tenant_id, pricing_rule_id, customer_pricing_id
        )
    except ValueError as e:
        logger.warning(f"Validation error deleting customer pricing: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting customer pricing: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
