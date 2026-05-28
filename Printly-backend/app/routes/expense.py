from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import logging

from app.schemas import (
    ExpenseCreate,
    ExpenseResponse,
    ExpenseUpdate,
    ExpenseListResponse,
    ExpenseRequest,
    TokenData,
)
from app.services import (
    create_expense,
    get_expenses,
    get_expense_by_id,
    update_expense,
    delete_expense,
)
from app.routes.deps import require_tenant_staff, get_db

router = APIRouter(prefix="/expenses", tags=["Expenses"])
logger = logging.getLogger(__name__)

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    token_data: Annotated[TokenData, Depends(require_tenant_staff)],
    expense_data: ExpenseCreate,
) -> ExpenseResponse:
    try:
        return await create_expense(
            db=db,
            tenant_id=token_data.tenant_id,
            create_by=token_data.user_id,
            expense_data=expense_data,
        )
    except Exception as e:
        logger.error(f"Error creating expense: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/", response_model=ExpenseListResponse)
async def list_expenses_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    token_data: Annotated[TokenData, Depends(require_tenant_staff)],
    request: Annotated[ExpenseRequest, Depends()],
) -> ExpenseListResponse:
    try:
        return await get_expenses(
            db=db,
            tenant_id=token_data.tenant_id,
            request=request,
        )
    except Exception as e:
        logger.error(f"Error fetching expenses: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    token_data: Annotated[TokenData, Depends(require_tenant_staff)],
    expense_id: UUID,
) -> ExpenseResponse:
    try:
        return await get_expense_by_id(
            db=db,
            tenant_id=token_data.tenant_id,
            expense_id=expense_id,
        )
    except ValueError as ve:
        logger.warning(f"Expense not found: {str(ve)}")
        raise HTTPException(status_code=404, detail="Expense not found")
    except Exception as e:
        logger.error(f"Error fetching expense by ID: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    token_data: Annotated[TokenData, Depends(require_tenant_staff)],
    expense_id: UUID,
    expense_update: ExpenseUpdate,
) -> ExpenseResponse:
    try:
        return await update_expense(
            db=db,
            tenant_id=token_data.tenant_id,
            expense_id=expense_id,
            update_data=expense_update,
        )
    except ValueError as ve:
        logger.warning(f"Expense not found for update: {str(ve)}")
        raise HTTPException(status_code=404, detail="Expense not found")
    except Exception as e:
        logger.error(f"Error updating expense: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    token_data: Annotated[TokenData, Depends(require_tenant_staff)],
    expense_id: UUID,
) -> None:
    try:
        await delete_expense(
            db=db,
            tenant_id=token_data.tenant_id,
            expense_id=expense_id,
        )
    except ValueError as ve:
        logger.warning(f"Expense not found for deletion: {str(ve)}")
        raise HTTPException(status_code=404, detail="Expense not found")
    except Exception as e:
        logger.error(f"Error deleting expense: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
