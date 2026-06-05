// ==================== Dashboard Types ====================

export interface RevenueComparison {
	yesterday_vs_today_percent: number;
	last_month_vs_this_month_percent: number;
}

export interface RevenueStatsResponse {
	today: number;
	this_month: number;
	this_year: number;
	comparison: RevenueComparison;
}

export interface ExpenseCategoryItem {
	category: string;
	total: number;
}

export interface ExpenseStatsResponse {
	today: number;
	this_month: number;
	this_year: number;
	by_category: ExpenseCategoryItem[];
}

export interface ProfitMargins {
	today: number;
	this_month: number;
	this_year: number;
}

export interface ProfitStatsResponse {
	today: number;
	this_month: number;
	this_year: number;
	margins: ProfitMargins;
}

export interface OrdersStatsResponse {
	total: number;
	by_status: Record<string, number>;
	today_new: number;
	avg_completion_hours: number;
}

export interface TopMaterialItem {
	material_id: string;
	material_name: string;
	total_quantity_used: number;
	total_cost: number;
}

export interface TopMaterialsResponse {
	materials: TopMaterialItem[];
}

export interface TopCustomerItem {
	customer_id: string;
	customer_name: string;
	total_spent: number;
	total_orders: number;
}

export interface TopCustomersResponse {
	customers: TopCustomerItem[];
}

export interface DashboardOverviewResponse {
	revenue: RevenueStatsResponse;
	expenses: ExpenseStatsResponse;
	profit: ProfitStatsResponse;
	orders: OrdersStatsResponse;
	top_materials: TopMaterialsResponse;
	top_customers: TopCustomersResponse;
}
