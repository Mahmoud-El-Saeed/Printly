from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db import PricingRuleCRUD, CustomerPricingCRUD, UserCRUD

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
)

from app.enums import UserRole


async def create_pricing_rule(
    db: AsyncSession,
    tenant_id: UUID,
    pricing_rule: PricingRuleCreate,
) -> PricingRuleResponse:
    """Create a new pricing rule for the tenant."""
    pricing_rule_model = pricing_rule.model_dump()

    try:
        new_pricing_rule = await PricingRuleCRUD.create(
            db, tenant_id=tenant_id, **pricing_rule_model
        )
        await db.commit()
        return PricingRuleResponse.model_validate(new_pricing_rule)

    except Exception as e:
        await db.rollback()
        raise Exception(f"Error creating pricing rule: {str(e)}")


async def get_pricing_rule(
    db: AsyncSession,
    tenant_id: UUID,
    pricing_rule_id: UUID,
) -> PricingRuleResponse:
    """Get details of a specific pricing rule."""
    pricing_rule = await PricingRuleCRUD.get_by_id(db, pricing_rule_id)
    if (
        not pricing_rule
        or pricing_rule.tenant_id != tenant_id
        or not pricing_rule.is_active
    ):
        raise ValueError("Pricing rule not found")
    return PricingRuleResponse.model_validate(pricing_rule)


async def update_pricing_rule(
    db: AsyncSession,
    tenant_id: UUID,
    pricing_rule_id: UUID,
    pricing_rule_update: PricingRuleUpdate,
) -> PricingRuleResponse:
    """Update an existing pricing rule."""
    existing_pricing_rule = await PricingRuleCRUD.get_by_id(db, pricing_rule_id)

    if not existing_pricing_rule or existing_pricing_rule.tenant_id != tenant_id:
        raise ValueError("Pricing rule not found")

    update_data = pricing_rule_update.model_dump(exclude_unset=True, exclude_none=True)
    try:
        updated_pricing_rule = await PricingRuleCRUD.update(
            db, existing_pricing_rule, **update_data
        )
        await db.commit()
        return PricingRuleResponse.model_validate(updated_pricing_rule)
    except Exception as e:
        await db.rollback()
        raise Exception(f"Error updating pricing rule: {str(e)}")


async def delete_pricing_rule(
    db: AsyncSession,
    tenant_id: UUID,
    pricing_rule_id: UUID,
) -> None:
    """Delete a specific pricing rule."""
    existing_pricing_rule = await PricingRuleCRUD.get_by_id(db, pricing_rule_id)

    if not existing_pricing_rule or existing_pricing_rule.tenant_id != tenant_id:
        raise ValueError("Pricing rule not found")

    has_customer_pricings = await CustomerPricingCRUD.exists(
        db, pricing_rule_id=pricing_rule_id
    )

    if has_customer_pricings:
        try:
            await PricingRuleCRUD.update(
                db=db, db_obj=existing_pricing_rule, is_active=False
            )
            await db.commit()
            return
        except Exception as e:
            await db.rollback()
            raise Exception(f"Error deactivating pricing rule: {str(e)}")
    else:
        try:
            _ = await PricingRuleCRUD.delete(db, pricing_rule_id)
            await db.commit()
            return
        except Exception as e:
            await db.rollback()
            raise Exception(f"Error deleting pricing rule: {str(e)}")


async def list_pricing_rules(
    db: AsyncSession,
    tenant_id: UUID,
    request: PricingRuleListRequest,
) -> PricingRuleListResponse:
    """List pricing rules for the tenant with optional filters."""

    pricing_rules, total_count = await PricingRuleCRUD.search_pricing_rules(
        db=db,
        tenant_id=tenant_id,
        component_name=request.component_name,
        component_type=request.component_type,
        is_active=request.is_active,
        offset=request.offset,
        limit=request.limit,
        order_by=request.order_by,
        order_dir=request.order_dir,
    )

    return PricingRuleListResponse(
        items=[PricingRuleResponse.model_validate(pr) for pr in pricing_rules],
        total=total_count,
    )


async def create_customer_pricing(
    db: AsyncSession,
    tenant_id: UUID,
    pricing_rule_id: UUID,
    customer_pricing: CustomerPricingCreate,
) -> CustomerPricingResponse:
    """Create a custom pricing for a specific customer and pricing rule."""

    customer = await UserCRUD.get_by_id(db, customer_pricing.customer_id)
    if (
        not customer
        or customer.tenant_id != tenant_id
        or customer.role != UserRole.CUSTOMER
    ):
        raise ValueError("Customer not found")

    pricing_rule = await PricingRuleCRUD.get_by_id(db, pricing_rule_id)
    if (
        not pricing_rule
        or pricing_rule.tenant_id != tenant_id
        or not pricing_rule.is_active
    ):
        raise ValueError("Pricing rule not found")
    has_existing_pricing = await CustomerPricingCRUD.exists(
        db, customer_id=customer_pricing.customer_id, pricing_rule_id=pricing_rule_id
    )
    if has_existing_pricing:
        raise ValueError("Customer pricing already exists for this pricing rule")

    customer_pricing_model = customer_pricing.model_dump()

    try:
        new_customer_pricing = await CustomerPricingCRUD.create(
            db,
            tenant_id=tenant_id,
            customer_id=customer_pricing.customer_id,
            pricing_rule_id=pricing_rule_id,
            **customer_pricing_model,
        )
        await db.commit()
        return CustomerPricingResponse.model_validate(new_customer_pricing)

    except Exception as e:
        await db.rollback()
        raise Exception(f"Error creating customer pricing: {str(e)}")


async def get_customer_pricing(
    db: AsyncSession,
    tenant_id: UUID,
    pricing_rule_id: UUID,
    customer_pricing_id: UUID,
) -> CustomerPricingResponse:
    """Get details of a specific customer pricing."""
    customer_pricing = await CustomerPricingCRUD.get_by_id(db, customer_pricing_id)
    if (
        not customer_pricing
        or customer_pricing.tenant_id != tenant_id
        or not customer_pricing.is_active
        or customer_pricing.pricing_rule_id != pricing_rule_id
    ):
        raise ValueError("Customer pricing not found")
    return CustomerPricingResponse.model_validate(customer_pricing)


async def update_customer_pricing(
    db: AsyncSession,
    tenant_id: UUID,
    pricing_rule_id: UUID,
    customer_pricing_id: UUID,
    customer_pricing_update: CustomerPricingUpdate,
) -> CustomerPricingResponse:
    """Update an existing customer pricing."""
    existing_customer_pricing = await CustomerPricingCRUD.get_by_id(
        db, customer_pricing_id
    )

    if (
        not existing_customer_pricing
        or existing_customer_pricing.tenant_id != tenant_id
        or existing_customer_pricing.pricing_rule_id != pricing_rule_id
    ):
        raise ValueError("Customer pricing not found")

    update_data = customer_pricing_update.model_dump(
        exclude_unset=True, exclude_none=True
    )
    try:
        updated_customer_pricing = await CustomerPricingCRUD.update(
            db, existing_customer_pricing, **update_data
        )
        await db.commit()
        return CustomerPricingResponse.model_validate(updated_customer_pricing)
    except Exception as e:
        await db.rollback()
        raise Exception(f"Error updating customer pricing: {str(e)}")


async def delete_customer_pricing(
    db: AsyncSession,
    tenant_id: UUID,
    pricing_rule_id: UUID,
    customer_pricing_id: UUID,
) -> None:
    """Delete a specific customer pricing."""
    existing_customer_pricing = await CustomerPricingCRUD.get_by_id(
        db, customer_pricing_id
    )

    if (
        not existing_customer_pricing
        or existing_customer_pricing.tenant_id != tenant_id
        or existing_customer_pricing.pricing_rule_id != pricing_rule_id
    ):
        raise ValueError("Customer pricing not found")

    try:
        _ = await CustomerPricingCRUD.delete(db, customer_pricing_id)
        await db.commit()
        return
    except Exception as e:
        await db.rollback()
        raise Exception(f"Error deleting customer pricing: {str(e)}")


async def list_customer_pricings(
    db: AsyncSession,
    tenant_id: UUID,
    pricing_rule_id: UUID,
) -> CustomerPricingListResponse:
    """List custom pricings for a specific pricing rule."""
    customer_pricings, total = await CustomerPricingCRUD.get_list(
        db=db,
        filters={
            "tenant_id": tenant_id,
            "pricing_rule_id": pricing_rule_id,
            "is_active": True,
        },
        order_by="created_at",
        order_dir="desc",
    )
    return CustomerPricingListResponse(
        items=[CustomerPricingResponse.model_validate(cp) for cp in customer_pricings],
        total=total,
    )
