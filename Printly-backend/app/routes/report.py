from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.routes.deps import get_db, require_tenant_staff
from app.schemas import DebtsResponse, TokenData
from app.services import get_debts

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/debts", response_model=DebtsResponse)
async def get_debts_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    return await get_debts(db, user.tenant_id)