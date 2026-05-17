from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from app.enums import MaterialTransactionType


class MaterialCreate(BaseModel):
    name: str = Field(..., max_length=200)
    unit: str = Field(..., max_length=20)
    current_stock: Decimal = Field(0, ge=0)
    min_stock_alert: Decimal = Field(0, ge=0)
    cost_per_unit: Decimal = Field(0, ge=0)


class MaterialUpdate(BaseModel):
    name: str | None = Field(None, max_length=200)
    unit: str | None = Field(None, max_length=20)
    min_stock_alert: Decimal | None = Field(None, ge=0)
    cost_per_unit: Decimal | None = Field(None, ge=0)
    is_active: bool | None = None


class MaterialResponse(BaseModel):
    id: UUID
    name: str
    unit: str
    current_stock: Decimal
    min_stock_alert: Decimal
    cost_per_unit: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MaterialsRequest(BaseModel):
    name: str | None = None
    unit: str | None = None
    is_active: bool = True
    offset: int = 0
    limit: int = 10
    order_by: str = "created_at"
    order_dir: str = "desc"


class MaterialListResponse(BaseModel):
    total: int
    items: list[MaterialResponse]


class TransactionCreate(BaseModel):
    quantity: Decimal = Field(..., gt=0)
    transaction_type: MaterialTransactionType
    order_id: UUID | None = None
    notes: str | None = Field(None, max_length=500)


class TransactionResponse(BaseModel):
    id: UUID
    material_id: UUID
    quantity: Decimal
    transaction_type: MaterialTransactionType
    order_id: UUID | None
    notes: str | None
    created_by: UUID | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionsRequest(BaseModel):
    transaction_type: MaterialTransactionType | None = None
    order_id: UUID | None = None
    offset: int = 0
    limit: int = 10
    order_by: str = "created_at"
    order_dir: str = "desc"


class TransactionListResponse(BaseModel):
    total: int
    items: list[TransactionResponse]
