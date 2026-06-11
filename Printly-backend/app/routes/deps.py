from typing import AsyncGenerator
from uuid import UUID
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.routes.db import AsyncSessionLocal
from app.routes.redis_client import get_redis_client
from app.db import TenantMemberCRUD
from app.services import verify_current_user
from app.schemas import TokenData
from app.enums import UserRole


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get a database session"""
    async with AsyncSessionLocal() as session:
        yield session
    # No need to explicitly close the session as it is handled by the context manager


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> TokenData:
    """Dependency to get the current user from the access token"""

    try:
        return await verify_current_user(db, token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

async def require_customer_or_staff(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    if current_user.role not in [UserRole.CUSTOMER.value, UserRole.SHOP_OWNER.value, UserRole.STAFF.value]:
        raise HTTPException(status_code=403, detail="Access denied")
    return current_user

async def require_customer(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    if current_user.role != UserRole.CUSTOMER.value:
        raise HTTPException(status_code=403, detail="Access denied")
    return current_user


async def require_tenant_staff(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    if (
        current_user.role not in [UserRole.SHOP_OWNER.value, UserRole.STAFF.value]
        or not current_user.tenant_id
    ):
        raise HTTPException(status_code=403, detail="Access denied")
    return current_user


async def require_admin(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Access denied")
    return current_user


async def get_redis() -> AsyncGenerator:
    redis_client = get_redis_client()
    try:
        yield redis_client
    finally:
        await redis_client.close()


async def require_approved_tenant_member(
    tenant_id: UUID,
    current_user: TokenData = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> TokenData:
    member = await TenantMemberCRUD.get_tenant_member(db, tenant_id, current_user.user_id)
    if not member or not member.is_approved:
        raise HTTPException(status_code=403, detail="Not an approved member of this tenant")
    return current_user
