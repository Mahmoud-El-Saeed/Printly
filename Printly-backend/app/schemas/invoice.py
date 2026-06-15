from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class InvoiceResponse(BaseModel):
    id: UUID
    invoice_number: str
    order_id: UUID
    customer_id: UUID | None
    customer_name: str | None
    total_amount: Decimal
    paid_amount: Decimal
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvoicesRequest(BaseModel):
    customer_id: UUID | None = None
    order_id: UUID | None = None
    offset: int = 0
    limit: int = 10
    order_by: str = "created_at"
    order_dir: str = "desc"


class InvoiceListResponse(BaseModel):
    total: int
    items: list[InvoiceResponse]


class InvoiceDetailResponse(BaseModel):
    id: UUID
    invoice_number: str
    order_id: UUID
    order_number: str
    customer_id: UUID | None
    customer_name: str | None
    total_amount: Decimal
    paid_amount: Decimal
    notes: str | None
    created_at: datetime
    items: list[dict] = []
    payments: list[dict] = []

    model_config = ConfigDict(from_attributes=True)
