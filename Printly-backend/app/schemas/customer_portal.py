from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class PortalProfileResponse(BaseModel):
    """Customer's own profile data."""
    user_id: UUID
    email: str
    full_name: str
    phone: str | None
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PortalTenantInfo(BaseModel):
    """A single tenant the customer is linked to, with membership details."""
    tenant_id: UUID
    tenant_name: str
    tenant_slug: str | None
    linked_at: datetime
    display_name: str | None
    balance: Decimal
    is_approved: bool

    model_config = ConfigDict(from_attributes=True)


class PortalTenantsResponse(BaseModel):
    """List of tenants the customer is linked to."""
    tenants: list[PortalTenantInfo]
    total: int