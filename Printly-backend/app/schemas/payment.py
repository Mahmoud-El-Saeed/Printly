from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from app.enums import PaymentMethod


class PaymentCreate(BaseModel):
    order_id: UUID = Field(...)
    amount: Decimal = Field(..., gt=0)
    payment_method: PaymentMethod = Field(...)
    reference: str | None = Field(None, max_length=100)
    notes: str | None = None
    add_to_balance: bool = False
    split_cash_amount: Decimal | None = None


class PaymentUpdate(BaseModel):
    amount: Decimal | None = Field(None, gt=0)
    payment_method: PaymentMethod | None = None
    reference: str | None = Field(None, max_length=100)
    notes: str | None = None
    add_to_balance: bool | None = None
    split_cash_amount: Decimal | None = None


class PaymentRequest(BaseModel):
    order_id: UUID | None = None
    payment_method: PaymentMethod | None = None
    reference: str | None = Field(None, max_length=100)
    offset: int = 0
    limit: int = 10
    order_by: str = "created_at"
    order_dir: str = "desc"


class PaymentResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    order_id: UUID
    amount: Decimal
    payment_method: PaymentMethod
    reference: str | None
    notes: str | None
    received_by: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentListResponse(BaseModel):
    payments: list[PaymentResponse]
    total: int


class SettlePaymentCreate(BaseModel):
    customer_id: UUID = Field(...)
    amount: Decimal = Field(..., gt=0)
    payment_method: PaymentMethod = Field(...)
    reference: str | None = Field(None, max_length=100)
    notes: str | None = None


class SettlePaymentResponse(BaseModel):
    payments: list[PaymentResponse]
    total_settled: Decimal
    added_to_balance: Decimal
    new_balance: Decimal


class CustomerBalanceResponse(BaseModel):
    customer_id: UUID
    balance: Decimal
    unpaid_total: Decimal
    net_balance: Decimal
