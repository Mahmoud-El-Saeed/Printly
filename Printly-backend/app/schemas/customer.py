from pydantic import BaseModel, Field, ConfigDict, EmailStr
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from app.enums import LinkStatus

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
    name: str | None = None
    phone: str | None = None
    notes: str | None = None


class WalkInCustomerListRequest(BaseModel):
    offset: int = 0
    limit: int = 100
    order_by: str = "created_at"
    order_dir: str = "desc"


class WalkInCustomerListResponse(BaseModel):
    customers: list[WalkInCustomerResponse]
    total: int


class CustomerMemberCreate(BaseModel):
    name: str = Field(..., min_length=3)
    email: EmailStr | None = Field(None, max_length=255)
    phone: str = Field(...)
    balance: Decimal = Field(Decimal("0"), ge=0)


class CustomerMemberResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    phone: str | None
    tenant_id: UUID
    is_approved: bool
    balance: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CustomerMemberUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None

class CustomerMemberListRequest(BaseModel):
    search_query: str | None = None
    offset: int = 0
    limit: int = 100
    order_by: str = "created_at"
    order_dir: str = "desc"

class CustomerMemberListResponse(BaseModel):
    members: list[CustomerMemberResponse]
    total: int
    

class CustomerLinkRequest(BaseModel):
    slug: str = Field(..., min_length=3)
    

class CustomerLinkResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    customer_user_id: UUID
    customer_name: str | None
    customer_email: EmailStr | None
    status: LinkStatus
    requested_at: datetime
    approved_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

class CustomerLinkListRequest(BaseModel):
    offset: int = 0
    limit: int = 100
    order_by: str = "requested_at"
    order_dir: str = "desc"

class CustomerLinkListResponse(BaseModel):
    links: list[CustomerLinkResponse]
    total: int

class CustomerLinkApprovalRequest(BaseModel):
    customer_user_id: UUID
    approve: bool
    