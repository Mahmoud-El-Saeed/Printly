from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.routes.deps import get_db, require_tenant_staff

from app.services import (
    get_expenses_stats,
    get_profit_stats,
    get_orders_stats,
    get_top_materials,
    get_top_customers,
    get_overview_stats,
    get_revenue_stats,
)
from app.schemas import (
    DashboardOverviewResponse,
    ExpenseStatsResponse,
    OrdersStatsResponse,
    ProfitStatsResponse,
    RevenueStatsResponse,
    TopCustomersResponse,
    TopMaterialsResponse,
    TokenData,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
logger = logging.getLogger(__name__)


@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    try:
        return await get_overview_stats(db, user.tenant_id)
    except Exception as e:
        logger.error(f"Error fetching dashboard overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard overview",
        )


@router.get("/revenue", response_model=RevenueStatsResponse)
async def get_revenue_stats_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    try:
        return await get_revenue_stats(db, user.tenant_id)
    except Exception as e:
        logger.error(f"Error fetching revenue stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch revenue stats",
        )


@router.get("/expenses", response_model=ExpenseStatsResponse)
async def get_expenses_stats_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    try:
        return await get_expenses_stats(db, user.tenant_id)
    except Exception as e:
        logger.error(f"Error fetching expenses stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch expenses stats",
        )


@router.get("/profit", response_model=ProfitStatsResponse)
async def get_profit_stats_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    try:
        return await get_profit_stats(db, user.tenant_id)
    except Exception as e:
        logger.error(f"Error fetching profit stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch profit stats",
        )


@router.get("/orders", response_model=OrdersStatsResponse)
async def get_orders_stats_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    try:
        return await get_orders_stats(db, user.tenant_id)
    except Exception as e:
        logger.error(f"Error fetching orders stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch orders stats",
        )


@router.get("/top-materials", response_model=TopMaterialsResponse)
async def get_top_materials_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    try:
        return await get_top_materials(db, user.tenant_id)
    except Exception as e:
        logger.error(f"Error fetching top materials: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch top materials",
        )


@router.get("/top-customers", response_model=TopCustomersResponse)
async def get_top_customers_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_tenant_staff)],
):
    try:
        return await get_top_customers(db, user.tenant_id)
    except Exception as e:
        logger.error(f"Error fetching top customers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch top customers",
        )
