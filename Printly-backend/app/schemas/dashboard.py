from pydantic import BaseModel


class RevenueComparison(BaseModel):
    yesterday_vs_today_percent: float
    last_month_vs_this_month_percent: float


class RevenueStatsResponse(BaseModel):
    today: float
    this_month: float
    this_year: float
    comparison: RevenueComparison


class ExpenseCategoryItem(BaseModel):
    category: str
    total: float


class ExpenseStatsResponse(BaseModel):
    today: float
    this_month: float
    this_year: float
    by_category: list[ExpenseCategoryItem]


class ProfitMargins(BaseModel):
    today: float
    this_month: float
    this_year: float


class ProfitStatsResponse(BaseModel):
    today: float
    this_month: float
    this_year: float
    margins: ProfitMargins


class OrdersStatsResponse(BaseModel):
    total: int
    by_status: dict[str, int]
    today_new: int
    avg_completion_hours: float


class TopMaterialItem(BaseModel):
    material_id: str
    material_name: str
    total_quantity_used: int
    total_cost: float


class TopMaterialsResponse(BaseModel):
    materials: list[TopMaterialItem]


class TopCustomerItem(BaseModel):
    customer_id: str
    customer_name: str
    total_spent: float
    total_orders: int


class TopCustomersResponse(BaseModel):
    customers: list[TopCustomerItem]


class DashboardOverviewResponse(BaseModel):
    revenue: RevenueStatsResponse
    expenses: ExpenseStatsResponse
    profit: ProfitStatsResponse
    orders: OrdersStatsResponse
    top_materials: TopMaterialsResponse
    top_customers: TopCustomersResponse
