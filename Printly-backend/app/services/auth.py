from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.models import (
    Users,
    Tenants,
    RefreshTokens,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
)
from app.core.config import get_settings
from app.db import UserCRUD, TenantCRUD, SubscriptionCRUD, PlanCRUD, RefreshCRUD
from app.enums import UserRole
from app.schemas import (
    RefreshRequest,
    TokenResponse,
    ShopOwnerRegister,
    CustomerResponse,
    CustomerRegister,
    ShopOwnerResponse,
    LoginRequest,
    TokenData,
)

import re

settings = get_settings()


async def register_shop_owner(
    db: AsyncSession, data: ShopOwnerRegister
) -> ShopOwnerResponse:
    """Register a new shop owner and create a tenant"""

    user: Users | None = await UserCRUD.get_by_email(db, email=data.email)
    if user:
        raise ValueError("Email already registered")

    slug = re.sub(r"[^a-z0-9ا-ي\s-]", "", data.shop_name.lower())
    slug = re.sub(r"[\s]+", "-", slug).strip("-")

    try:
        tenant: Tenants = await TenantCRUD.create(
            db=db,
            name=data.shop_name,
            slug=slug,
            phone=data.shop_phone,
            email=data.email,
            address=data.shop_address,
        )

        user: Users = await UserCRUD.create(
            db=db,
            tenant_id=tenant.id,
            email=data.email,
            full_name=data.full_name,
            password_hash=hash_password(data.password),
            role=UserRole.SHOP_OWNER,
        )

        free_plan = await PlanCRUD.get_by_name(db=db, name="Free")
        await SubscriptionCRUD.create(
            db=db,
            tenant_id=tenant.id,
            plan_id=free_plan.id,
            starts_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(days=15),
        )

        await db.commit()
        return ShopOwnerResponse(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            tenant_id=tenant.id,
            shop_name=tenant.name,
        )
    except Exception as e:
        await db.rollback()
        raise e


async def register_customer(
    db: AsyncSession, data: CustomerRegister
) -> CustomerResponse:
    """Register a new customer"""

    user: Users | None = await UserCRUD.get_by_email(db, email=data.email)
    if user:
        raise ValueError("Email already registered")
    try:
        user: Users = await UserCRUD.create(
            db=db,
            email=data.email,
            full_name=data.full_name,
            password_hash=hash_password(data.password),
            role=UserRole.CUSTOMER,
        )
        await db.commit()
        return CustomerResponse(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
        )
    except Exception as e:
        await db.rollback()
        raise e


async def login(db: AsyncSession, data: LoginRequest) -> TokenResponse:
    """Authenticate user and return access and refresh tokens"""

    user: Users | None = await UserCRUD.get_by_email(db, email=data.email)
    if not user or not verify_password(data.password, user.password_hash):
        raise ValueError("Invalid email or password")
    if not user.is_active:
        raise ValueError("User account is inactive")

    access_token = create_access_token(
        data={
            "user_id": str(user.id),
            "tenant_id": str(user.tenant_id) if user.tenant_id else None,
            "role": user.role.value,
            "full_name": user.full_name,
        },
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token()
    try:
        await RefreshCRUD.create(
            db=db,
            user_id=user.id,
            token=refresh_token,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        await db.commit()
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
        )
    except Exception as e:
        await db.rollback()
        raise e


async def _get_valid_refresh_token(
    db: AsyncSession, token_str: str
) -> RefreshTokens | None:
    refresh_token: RefreshTokens | None = await RefreshCRUD.get_by_field(
        db=db, field="token", value=token_str
    )

    if (
        not refresh_token
        or refresh_token.is_revoked
        or refresh_token.expires_at < datetime.now(timezone.utc)
    ):
        return None

    return refresh_token


async def refresh_tokens(db: AsyncSession, data: RefreshRequest) -> TokenResponse:
    """Refresh access token using a valid refresh token"""

    refresh_token = await _get_valid_refresh_token(db, data.refresh_token)
    if not refresh_token:
        raise ValueError("Invalid or expired refresh token")
    user: Users | None = await UserCRUD.get_by_id(db=db, id=refresh_token.user_id)
    if not user or not user.is_active:
        raise ValueError("User account is inactive")

    access_token = create_access_token(
        data={
            "user_id": str(user.id),
            "tenant_id": str(user.tenant_id) if user.tenant_id else None,
            "role": user.role.value,
            "full_name": user.full_name,
        },
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    new_refresh_token = create_refresh_token()

    try:
        await RefreshCRUD.update(
            db=db,
            db_obj=refresh_token,
            is_revoked=True,
        )
        await RefreshCRUD.create(
            db=db,
            user_id=user.id,
            token=new_refresh_token,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        await db.commit()
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
        )
    except Exception as e:
        await db.rollback()
        raise e


async def _verify_access_token(token: str) -> dict:
    """Verify access token and return payload"""

    try:
        payload = decode_access_token(token)
        return payload
    except Exception as e:
        raise ValueError("Invalid or expired access token") from e


async def verify_current_user(db: AsyncSession, token: str) -> TokenData:
    """Get current user from access token"""

    try:
        payload = await _verify_access_token(token)
        user_id = payload.get("user_id")
        if not user_id:
            raise ValueError("Invalid token payload")
        user: Users | None = await UserCRUD.get_active_by_id(
            db=db, user_id= UUID(user_id)
        )
        if not user or not user.is_active:
            raise ValueError("User account is inactive")
        return TokenData(
            user_id=UUID(user_id),
            tenant_id=user.tenant_id if user.tenant_id else None,
            role=user.role.value,
        )
    except Exception as e:
        raise ValueError("Invalid or expired access token") from e
