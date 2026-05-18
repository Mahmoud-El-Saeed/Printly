from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import date
from decimal import Decimal

from app.enums import OrderStatus

class OrderItemCreate(BaseModel):
    book_id: UUID | None = None
    book_title: str
    copies: int = Field(..., gt=0)
    pages_per_copy: int = Field(..., gt=0)
    sides_per_page: int = Field(1, ge=1, le=4)
    printing_price: Decimal
    cover_type: str | None = None
    cover_price: Decimal = 0
    binding_type: str | None = None
    binding_price: Decimal = 0
    has_lamination: bool = False
    lamination_price: Decimal = 0
    extra_services: list[dict] = Field(default_factory=list)

class OrderCreate(BaseModel):
    customer_id: UUID | None = Field(default=None)
    walk_in_customer_id: UUID | None = Field(default=None)
    notes: str | None = Field(default=None)
    due_date: date | None = Field(default=None)
    items: list[OrderItemCreate] = Field(..., min_items=1)


class OrderItemResponse(BaseModel):
    id: UUID
    book_id: UUID | None
    book_title: str
    copies: int
    pages_per_copy: int
    sides_per_page: int
    printing_price: Decimal
    cover_type: str | None
    cover_price: Decimal
    binding_type: str | None
    binding_price: Decimal
    has_lamination: bool
    lamination_price: Decimal
    extra_services: list[dict]
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)

class OrderResponse(BaseModel):
    id: UUID
    order_number: str
    customer_id: UUID | None
    walk_in_customer_id: UUID | None
    created_by: UUID
    status: OrderStatus
    total_amount: Decimal
    paid_amount: Decimal
    notes: str | None
    due_date: date | None
    items: list[OrderItemResponse] = list()
    created_at: date
    updated_at: date

    model_config = ConfigDict(from_attributes=True)


    model_config = ConfigDict(from_attributes=True)


class OrderUpdate(BaseModel):
    due_date: date | None = Field(default=None)
    notes: str | None = Field(default=None)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrdersRequest(BaseModel):
    status: OrderStatus | None = None
    customer_id: UUID | None = None
    walk_in_customer_id: UUID | None = None
    date_from: date | None = None
    date_to: date | None = None
    order_number: str | None = None
    offset: int = 0
    limit: int = 10
    order_by: str = "created_at"
    order_dir: str = "desc"


class OrdersListResponse(BaseModel):
    total: int
    orders: list[OrderResponse]








