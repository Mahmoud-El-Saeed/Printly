from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime


class TenantProfileResponse(BaseModel):
    id: UUID
    name: str
    slug: str | None
    address: str | None
    phone: str | None
    email: str | None
    logo_url: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantUpdateRequest(BaseModel):
    name: str | None = Field(None, max_length=200)
    address: str | None = None
    phone: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    logo_url: str | None = Field(None, max_length=500)