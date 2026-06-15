from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from uuid import UUID
import logging

from app.routes.deps import get_db, get_redis_client, require_tenant_staff
from app.schemas import (
    InvoiceDetailResponse,
    InvoiceListResponse,
    InvoicesRequest,
    TokenData,
)
from app.services import generate_invoice, get_invoice, list_invoices

router = APIRouter(prefix="/invoices", tags=["Invoices"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=InvoiceDetailResponse, status_code=status.HTTP_201_CREATED)
async def generate_invoice_endpoint(
    order_id: UUID = Query(...),
    notes: str | None = Query(None),
    db: Annotated[AsyncSession, Depends(get_db)] = None,
    redis_client: Annotated[Redis, Depends(get_redis_client)] = None,
    current_user: Annotated[TokenData, Depends(require_tenant_staff)] = None,
):
    try:
        return await generate_invoice(db, redis_client, current_user.tenant_id, order_id, notes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating invoice: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", response_model=InvoiceListResponse)
async def list_invoices_endpoint(
    request: Annotated[InvoicesRequest, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    try:
        return await list_invoices(db, current_user.tenant_id, request)
    except Exception as e:
        logger.error(f"Error listing invoices: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{invoice_id}", response_model=InvoiceDetailResponse)
async def get_invoice_endpoint(
    invoice_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    try:
        return await get_invoice(db, current_user.tenant_id, invoice_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting invoice: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
