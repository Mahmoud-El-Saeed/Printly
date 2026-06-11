from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from datetime import date


class DebtorItem(BaseModel):
    order_id: UUID
    order_number: str
    customer_name: str
    total_amount: Decimal
    paid_amount: Decimal
    outstanding: Decimal
    due_date: date | None
    days_overdue: int | None


class DebtsResponse(BaseModel):
    total_outstanding: Decimal
    total_overdue: Decimal
    debtors_count: int
    debtors: list[DebtorItem]