from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.models import Expenses
from app.db import ExpenseCRUD

from app.schemas import (
    ExpenseCreate,
    ExpenseResponse,
    ExpenseUpdate,
    ExpenseListResponse,
    ExpenseRequest,
)

async def create_expense(
    db: AsyncSession,
    tenant_id: UUID,
    created_by: UUID,
    expense_data: ExpenseCreate,
) -> ExpenseResponse:
    
    
    try:
        expense = await ExpenseCRUD.create(
            db=db,
            tenant_id=tenant_id,
            created_by=created_by,
            **expense_data.model_dump()
        )
        await db.commit()
        return ExpenseResponse.model_validate(expense)
    except Exception as e:
        await db.rollback()
        raise Exception(f"Error creating expense: {str(e)}") from e

async def get_expenses(
    db: AsyncSession,
    tenant_id: UUID,
    request: ExpenseRequest,
) -> ExpenseListResponse:
    
    expenses, total = await ExpenseCRUD.get_list_of_expenses(
        db=db,
        tenant_id=tenant_id,
        category=request.category,
        start_date=request.start_date,
        end_date=request.end_date,
        offset=request.offset,
        limit=request.limit,
        order_by=request.order_by,
        order_dir=request.order_dir,
    )
    return ExpenseListResponse(
        expenses=[ExpenseResponse.model_validate(expense) for expense in expenses],
        total=total,
    )

async def get_expense_by_id(
    db: AsyncSession,
    tenant_id: UUID,
    expense_id: UUID,
) -> ExpenseResponse:
    expense: Expenses | None = await ExpenseCRUD.get_by_id(db=db, id=expense_id)
    if not expense or expense.tenant_id != tenant_id:
        raise ValueError("Expense not found")
    return ExpenseResponse.model_validate(expense)


async def update_expense(
    db: AsyncSession,
    tenant_id: UUID,
    expense_id: UUID,
    update_data: ExpenseUpdate,
) -> ExpenseResponse:
    expense: Expenses | None = await ExpenseCRUD.get_by_id(db=db, id=expense_id)
    if not expense or expense.tenant_id != tenant_id:
        raise ValueError("Expense not found")
    
    update_fields = update_data.model_dump(exclude_unset=True, exclude_none=True)
    try:
        expense = await ExpenseCRUD.update(
            db=db,
            db_obj=expense,
            **update_fields
        )
        await db.commit()
        return ExpenseResponse.model_validate(expense)  
    except Exception as e:
        await db.rollback()
        raise Exception(f"Error updating expense: {str(e)}") from e


async def delete_expense(
    db: AsyncSession,
    tenant_id: UUID,
    expense_id: UUID,
) -> None:
    expense: Expenses | None = await ExpenseCRUD.get_by_id(db=db, id=expense_id)
    if not expense or expense.tenant_id != tenant_id:
        raise ValueError("Expense not found")
    try:
        await ExpenseCRUD.delete(db=db, id=expense_id)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise Exception(f"Error deleting expense: {str(e)}") from e