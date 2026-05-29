from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime


class ActivationCodeCreate(BaseModel):
    plan_id: UUID = Field(..., description="ID of the subscription plan")
    duration_days: int = Field(..., description="Duration of the subscription in days", ge=1)
    max_uses: int = Field(1, description="Maximum number of times the code can be used", ge=1)


class ActivationCodeResponse(BaseModel):
    id: UUID = Field(..., description="ID of the activation code")
    plan_id: UUID = Field(..., description="ID of the subscription plan")
    code: str = Field(..., description="Unique activation code")
    duration_days: int = Field(..., description="Duration of the subscription in days")
    max_uses: int = Field(
        ..., description="Maximum number of times the code can be used"
    )
    used_count: int = Field(..., description="Number of times the code has been used")
    is_active: bool = Field(..., description="Whether the activation code is active")
    created_at: datetime = Field(
        ..., description="Timestamp when the activation code was created"
    )

    model_config = ConfigDict(from_attributes=True)

class ActivationsRequest(BaseModel):
    plan_id: UUID | None = Field(None, description="Filter by subscription plan ID")
    is_active: bool | None = Field(None, description="Filter by active status")
    offset: int = 0
    limit: int = 10
    order_by: str = "created_at"
    order_dir: str = "desc"

class ActivationCodeListResponse(BaseModel):
    activation_codes: list[ActivationCodeResponse]
    total: int


class ActivationCodeApplyRequest(BaseModel):
    code: str = Field(..., description="Activation code to apply")


class ActivationCodeApplyResponse(BaseModel):
    success: bool
    message: str
    plan_name: str
    new_expiry_date: datetime | None = None
