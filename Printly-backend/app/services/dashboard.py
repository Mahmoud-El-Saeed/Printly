from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db import DashboardDB
from app.schemas import (
    DashboardOverviewResponse,
    ExpenseCategoryItem,
    ExpenseStatsResponse,
    OrdersStatsResponse,
    ProfitMargins,
    ProfitStatsResponse,
    RevenueComparison,
    RevenueStatsResponse,
    TopCustomerItem,
    TopCustomersResponse,
    TopMaterialItem,
    TopMaterialsResponse,
)


def _calc_change(new: float, old: float) -> float:
    if old == 0:
        return 100.0 if new > 0 else 0.0
    return round(((new - old) / old) * 100, 1)


def _calc_margin(profit: float, revenue: float) -> float:
    if revenue == 0:
        return 0.0
    return round((profit / revenue) * 100, 1)


async def get_revenue_stats(db: AsyncSession, tenant_id: UUID) -> RevenueStatsResponse:
    data = await DashboardDB.get_revenue_stats(db, tenant_id)
    return RevenueStatsResponse(
        today=data["today"],
        this_month=data["this_month"],
        this_year=data["this_year"],
        comparison=RevenueComparison(
            yesterday_vs_today_percent=_calc_change(data["today"], data["yesterday"]),
            last_month_vs_this_month_percent=_calc_change(data["this_month"], data["last_month"]),
        ),
    )


async def get_expenses_stats(db: AsyncSession, tenant_id: UUID) -> ExpenseStatsResponse:
    amounts = await DashboardDB.get_expense_stats(db, tenant_id)
    categories = await DashboardDB.get_expenses_by_category(db, tenant_id)

    return ExpenseStatsResponse(
        today=amounts["today"],
        this_month=amounts["this_month"],
        this_year=amounts["this_year"],
        by_category=[ExpenseCategoryItem(**c) for c in categories],
    )


async def get_profit_stats(db: AsyncSession, tenant_id: UUID) -> ProfitStatsResponse:
    revenue = await DashboardDB.get_revenue_stats(db, tenant_id)
    expenses = await DashboardDB.get_expense_stats(db, tenant_id)

    p_today = revenue["today"] - expenses["today"]
    p_month = revenue["this_month"] - expenses["this_month"]
    p_year = revenue["this_year"] - expenses["this_year"]

    return ProfitStatsResponse(
        today=p_today,
        this_month=p_month,
        this_year=p_year,
        margins=ProfitMargins(
            today=_calc_margin(p_today, revenue["today"]),
            this_month=_calc_margin(p_month, revenue["this_month"]),
            this_year=_calc_margin(p_year, revenue["this_year"]),
        ),
    )


async def get_orders_stats(db: AsyncSession, tenant_id: UUID) -> OrdersStatsResponse:
    data = await DashboardDB.get_orders_stats(db, tenant_id)
    return OrdersStatsResponse(**data)


async def get_top_materials(db: AsyncSession, tenant_id: UUID) -> TopMaterialsResponse:
    data = await DashboardDB.get_top_materials(db, tenant_id)
    return TopMaterialsResponse(
        materials=[TopMaterialItem(**m) for m in data],
    )


async def get_top_customers(db: AsyncSession, tenant_id: UUID) -> TopCustomersResponse:
    data = await DashboardDB.get_top_customers(db, tenant_id)
    return TopCustomersResponse(
        customers=[TopCustomerItem(**c) for c in data],
    )


async def get_overview_stats(db: AsyncSession, tenant_id: UUID) -> DashboardOverviewResponse:
    revenue = await DashboardDB.get_revenue_stats(db, tenant_id)
    expenses = await DashboardDB.get_expense_stats(db, tenant_id)
    orders = await DashboardDB.get_orders_stats(db, tenant_id)
    materials = await DashboardDB.get_top_materials(db, tenant_id)
    customers = await DashboardDB.get_top_customers(db, tenant_id)

    p_today = revenue["today"] - expenses["today"]
    p_month = revenue["this_month"] - expenses["this_month"]
    p_year = revenue["this_year"] - expenses["this_year"]

    return DashboardOverviewResponse(
        revenue=RevenueStatsResponse(
            today=revenue["today"],
            this_month=revenue["this_month"],
            this_year=revenue["this_year"],
            comparison=RevenueComparison(
                yesterday_vs_today_percent=_calc_change(revenue["today"], revenue["yesterday"]),
                last_month_vs_this_month_percent=_calc_change(revenue["this_month"], revenue["last_month"]),
            ),
        ),
        expenses=ExpenseStatsResponse(
            today=expenses["today"],
            this_month=expenses["this_month"],
            this_year=expenses["this_year"],
            by_category=[ExpenseCategoryItem(**c) for c in expenses["by_category"]],
        ),
        profit=ProfitStatsResponse(
            today=p_today,
            this_month=p_month,
            this_year=p_year,
            margins=ProfitMargins(
                today=_calc_margin(p_today, revenue["today"]),
                this_month=_calc_margin(p_month, revenue["this_month"]),
                this_year=_calc_margin(p_year, revenue["this_year"]),
            ),
        ),
        orders=OrdersStatsResponse(**orders),
        top_materials=TopMaterialsResponse(
            materials=[TopMaterialItem(**m) for m in materials],
        ),
        top_customers=TopCustomersResponse(
            customers=[TopCustomerItem(**c) for c in customers],
        ),
    )
