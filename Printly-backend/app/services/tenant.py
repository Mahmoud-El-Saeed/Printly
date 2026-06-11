from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.db.tenant_crud import TenantCRUD
from app.schemas import TenantProfileResponse, TenantUpdateRequest


async def get_my_tenant(
    db: AsyncSession,
    tenant_id: UUID,
) -> TenantProfileResponse:
    tenant = await TenantCRUD.get_by_id(db, tenant_id)
    if not tenant:
        raise ValueError("Tenant not found")
    return tenant


async def update_my_tenant(
    db: AsyncSession,
    tenant_id: UUID,
    update_data: TenantUpdateRequest,
) -> TenantProfileResponse:
    tenant = await TenantCRUD.get_by_id(db, tenant_id)
    if not tenant:
        raise ValueError("Tenant not found")
    update_dict = update_data.model_dump(exclude_unset=True, exclude_none=True)
    if not update_dict:
        return tenant
    try:
        updated = await TenantCRUD.update(db, tenant, **update_dict)
        await db.commit()
        return updated

    except Exception as e:
        await db.rollback()
        raise e


