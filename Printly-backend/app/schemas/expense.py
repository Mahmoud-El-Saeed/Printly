from pydantic import BaseModel, Field, ConfigDict
from datetime import date,datetime
from uuid import UUID
from decimal import Decimal

from app.enums import ExpenseCategory

class ExpenseCreate(BaseModel):
    category: ExpenseCategory = Field(..., description="The category of the expense")
    amount: Decimal = Field(..., description="The amount of the expense")
    description: str | None = Field(None, description="A description of the expense")
    expense_date: date = Field(..., description="The date of the expense")
    

class ExpenseResponse(BaseModel):
    id: UUID 
    tenant_id: UUID
    category: ExpenseCategory 
    amount: Decimal 
    description: str | None 
    expense_date: date 
    created_by: UUID | None 
    created_at: datetime
    updated_at: datetime 

    model_config = ConfigDict(from_attributes=True)

class ExpenseUpdate(BaseModel):
    category: ExpenseCategory | None = Field(None, description="The category of the expense")
    amount: Decimal | None = Field(None, description="The amount of the expense")
    description: str | None = Field(None, description="A description of the expense")
    expense_date: date | None = Field(None, description="The date of the expense")

class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    total: int

class ExpenseRequest(BaseModel):
    category: ExpenseCategory | None = Field(None, description="The category of the expense")
    start_date: date | None = Field(None, description="Start date for filtering expenses")
    end_date: date | None = Field(None, description="End date for filtering expenses")
    offset: int = 0
    limit: int = 10
    order_by: str = "created_at"
    order_dir: str = "desc"