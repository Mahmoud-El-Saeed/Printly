from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import secrets
import string

from app.db import ActivationCodeCRUD, PlanCRUD, SubscriptionCRUD

from app.schemas import (
    ActivationCodeCreate,
    ActivationCodeResponse,
    ActivationCodeListResponse,
    ActivationsRequest,
    ActivationCodeApplyRequest,
    ActivationCodeApplyResponse,
)


def _generate_unique_code(plan_name: str):
    """Generate a unique activation code based on the plan name and random characters."""
    prefix = plan_name.upper()[:4]
    random_part = "".join(
        secrets.choice(string.ascii_uppercase + string.digits) for _ in range(10)
    )
    return f"{prefix}{random_part}"


async def create_activation_code(
    db: AsyncSession,
    code_data: ActivationCodeCreate,
) -> ActivationCodeResponse:
    """Create a new activation code for a subscription plan."""

    plan = await PlanCRUD.get_by_id(db, code_data.plan_id)
    if not plan:
        raise ValueError("Subscription plan not found")

    code = _generate_unique_code(plan.name)

    # Ensure the generated code is unique
    while await ActivationCodeCRUD.get_by_code(db, code):
        code = _generate_unique_code(plan.name)

    try:
        activation_code = await ActivationCodeCRUD.create(
            db=db,
            plan_id=code_data.plan_id,
            code=code,
            duration_days=code_data.duration_days,
            max_uses=code_data.max_uses,
        )
        await db.commit()
        return ActivationCodeResponse.model_validate(activation_code)
    except Exception as e:
        await db.rollback()
        raise Exception(f"Failed to create activation code: {str(e)}") from e


async def list_activation_codes(
    db: AsyncSession,
    request: ActivationsRequest,
) -> ActivationCodeListResponse:
    """List activation codes with optional filtering and pagination."""
    filters = {}
    if request.plan_id:
        filters["plan_id"] = request.plan_id
    if request.is_active is not None:
        filters["is_active"] = request.is_active

    activation_codes, total = await ActivationCodeCRUD.get_list(
        db=db,
        filters=filters,
        offset=request.offset,
        limit=request.limit,
        order_by=request.order_by,
        order_dir=request.order_dir,
    )
    return ActivationCodeListResponse(
        activation_codes=[
            ActivationCodeResponse.model_validate(ac) for ac in activation_codes
        ],
        total=total,
    )


async def apply_activation_code(
    db: AsyncSession,
    tenant_id: UUID,
    apply_data: ActivationCodeApplyRequest,
) -> ActivationCodeApplyResponse:
    """Apply an activation code to activate or extend a subscription for a tenant."""

    activation_code = await ActivationCodeCRUD.get_by_code(db, apply_data.code)
    if not activation_code:
        return ActivationCodeApplyResponse(
            success=False,
            message="Invalid activation code",
            plan_name="",
            new_expiry_date=None,
        )
    if not activation_code.is_active:
        return ActivationCodeApplyResponse(
            success=False,
            message="Activation code is inactive",
            plan_name="",
            new_expiry_date=None,
        )
    if activation_code.used_count >= activation_code.max_uses:
        return ActivationCodeApplyResponse(
            success=False,
            message="Activation code has reached its maximum uses",
            plan_name="",
            new_expiry_date=None,
        )
    plan = await PlanCRUD.get_by_id(db, activation_code.plan_id)
    if not plan:
        return ActivationCodeApplyResponse(
            success=False,
            message="Associated subscription plan not found",
            plan_name="",
            new_expiry_date=None,
        )

    subscription = await SubscriptionCRUD.get_active_by_tenant_id(db, tenant_id)
    now = datetime.now(timezone.utc)
    """
    we have 5 cases here:
    1. No active subscription: we create a new one with expiry date = current_expiry_date + duration
    2. Active subscription that is not expired and the new plan is the same as the current one: we extend the expiry date by the duration
    3. Active subscription that is not expired and the new plan is different from the current one: we raise an error because we don't allow changing plans before the current one expires
    4. Active subscription that is expired and the new plan is the same as the current one: we create a new subscription with expiry date = now + duration
    5. Active subscription that is expired and the new plan is different from the current one: we create a new subscription with expiry date = now + duration
    """
    try:
        # Case 1: No active subscription
        if not subscription:
            new_expiry_date = now + timedelta(days=activation_code.duration_days)
            await SubscriptionCRUD.create(
                db=db,
                tenant_id=tenant_id,
                plan_id=plan.id,
                expires_at=new_expiry_date,
                starts_at=now,
            )
            message = "Subscription activated successfully"
        # Case 2: Active subscription that is not expired and the new plan is the same as the current one
        elif (
            subscription.expires_at
            and subscription.expires_at > now
            and subscription.plan_id == plan.id
        ):
            subscription.expires_at += timedelta(days=activation_code.duration_days)
            new_expiry_date = subscription.expires_at
            message = "Subscription extended successfully"

        # Case 3: Active subscription that is not expired and the new plan is different from the current one
        elif (
            subscription.expires_at
            and subscription.expires_at > now
            and subscription.plan_id != plan.id
        ):
            return ActivationCodeApplyResponse(
                success=False,
                message="Cannot change subscription plan before current one expires",
                plan_name=plan.name,
                new_expiry_date=subscription.expires_at,
            )
        # Case 4 & 5: Active subscription that is expired
        else:
            new_expiry_date = now + timedelta(days=activation_code.duration_days)
            subscription.is_active = False
            await SubscriptionCRUD.create(
                db=db,
                tenant_id=tenant_id,
                plan_id=plan.id,
                expires_at=new_expiry_date,
                starts_at=now,
            )
            message = "Subscription activated successfully"

        activation_code.used_count += 1
        if activation_code.used_count >= activation_code.max_uses:
            activation_code.is_active = False

        await db.commit()
        return ActivationCodeApplyResponse(
            success=True,
            message=message,
            plan_name=plan.name,
            new_expiry_date=new_expiry_date,
        )

    except Exception as e:
        await db.rollback()
        raise Exception(f"Failed to process activation code: {str(e)}") from e
