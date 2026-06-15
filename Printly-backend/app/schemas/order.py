from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

from app.enums import OrderStatus


class OrderItemCreate(BaseModel):
    book_id: UUID
    copies: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    customer_id: UUID | None = Field(default=None)
    walk_in_customer_id: UUID | None = Field(default=None)
    notes: str | None = Field(default=None)
    due_date: date | None = Field(default=None)
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderItemResponse(BaseModel):
    id: UUID
    book_id: UUID | None
    book_title: str
    copies: int
    unit_price: Decimal
    total_pages: int
    color_mode: str
    sides_per_page: int
    binding_type: str | None
    has_lamination: bool
    materials_snapshot: list[dict]
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
    created_at: datetime
    updated_at: datetime

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


class OrdersCustomerRequest(BaseModel):
    status: OrderStatus | None = None
    date_from: date | None = None
    date_to: date | None = None
    offset: int = 0
    limit: int = 10
    order_by: str = "created_at"
    order_dir: str = "desc"
