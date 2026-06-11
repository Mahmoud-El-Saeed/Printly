from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Literal


class PortalProfileResponse(BaseModel):
    user_id: UUID
    email: str
    full_name: str
    phone: str | None
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PortalProfileUpdateRequest(BaseModel):
    full_name: str | None = Field(None, min_length=3, max_length=200)
    phone: str | None = Field(None, max_length=20)


class PortalTenantInfo(BaseModel):
    tenant_id: UUID
    tenant_name: str
    tenant_slug: str | None
    linked_at: datetime
    display_name: str | None
    balance: Decimal
    is_approved: bool

    model_config = ConfigDict(from_attributes=True)


class PortalTenantsResponse(BaseModel):
    tenants: list[PortalTenantInfo]
    total: int


class PortalPaymentCreate(BaseModel):
    order_id: UUID
    amount: Decimal = Field(..., gt=0)
    payment_method: Literal["cash", "mobile_wallet"]
    reference: str | None = Field(None, max_length=100)
    notes: str | None = None


class PortalPricingItem(BaseModel):
    component_name: str
    component_type: str
    price: Decimal
    unit_type: str


class PortalPricingResponse(BaseModel):
    rules: list[PortalPricingItem]