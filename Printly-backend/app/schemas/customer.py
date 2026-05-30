from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime


class WalkInCustomerCreate(BaseModel):
    name: str = Field(..., min_length=3)
    phone: str | None = None
    notes: str | None = None


class WalkInCustomerResponse(BaseModel):
    id: UUID
    name: str
    phone: str | None
    notes: str | None
    tenant_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class WalkInCustomerUpdate(BaseModel):
    name: str | None 
    phone: str | None 
    notes: str | None 


class WalkInCustomerListRequest(BaseModel):
    offset: int = 0
    limit: int = 100
    order_by: str = "created_at"
    order_dir: str = "desc"

class WalkInCustomerListResponse(BaseModel):
    customers: list[WalkInCustomerResponse]
    total: int

