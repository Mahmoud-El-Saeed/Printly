from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from app.enums import PricingComponentType, PricingUnitType


class PricingRuleCreate(BaseModel):
    component_name: str = Field(..., max_length=100)
    component_type: PricingComponentType
    price: Decimal = Field(..., gt=0)
    unit_type: PricingUnitType
    description: str | None = Field(None, max_length=255)


class PricingRuleUpdate(BaseModel):
    component_name: str | None = Field(None, max_length=100)
    component_type: PricingComponentType | None = None
    price: Decimal | None = Field(None, gt=0)
    unit_type: PricingUnitType | None = None
    description: str | None = Field(None, max_length=255)
    is_active: bool | None = None


class PricingRuleResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    component_name: str
    component_type: PricingComponentType
    price: Decimal
    unit_type: PricingUnitType
    description: str | None 
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PricingRuleListRequest(BaseModel):
    component_name: str | None = None
    component_type: PricingComponentType | None = None
    is_active: bool | None = None
    offset: int = 0
    limit: int = 10
    order_by: str = "created_at"
    order_dir: str = "desc"


class PricingRuleListResponse(BaseModel):
    total: int
    items: list[PricingRuleResponse]


class CustomerPricingCreate(BaseModel):
    customer_id: UUID
    custom_price: Decimal = Field(..., gt=0)


class CustomerPricingUpdate(BaseModel):
    custom_price: Decimal | None = Field(None, gt=0)
    is_active: bool | None = None


class CustomerPricingResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    customer_id: UUID
    pricing_rule_id: UUID
    custom_price: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerPricingListResponse(BaseModel):
    total: int
    items: list[CustomerPricingResponse]
