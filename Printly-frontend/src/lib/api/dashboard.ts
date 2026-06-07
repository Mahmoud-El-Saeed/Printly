import type {
	DashboardOverviewResponse,
	ExpenseStatsResponse,
	OrdersStatsResponse,
	ProfitStatsResponse,
	RevenueStatsResponse,
	TopCustomersResponse,
	TopMaterialsResponse,
} from "@/types";
import apiClient from "./client";

export const dashboardApi = {
	getOverview: async (): Promise<DashboardOverviewResponse> => {
		const response = await apiClient.get<DashboardOverviewResponse>(
			"/dashboard/overview",
		);
		return response.data;
	},
	getRevenue: async (): Promise<RevenueStatsResponse> => {
		const response =
			await apiClient.get<RevenueStatsResponse>("/dashboard/revenue");
		return response.data;
	},
	getExpenses: async (): Promise<ExpenseStatsResponse> => {
		const response = await apiClient.get<ExpenseStatsResponse>(
			"/dashboard/expenses",
		);
		return response.data;
	},
	getProfit: async (): Promise<ProfitStatsResponse> => {
		const response =
			await apiClient.get<ProfitStatsResponse>("/dashboard/profit");
		return response.data;
	},
	getOrdersStats: async (): Promise<OrdersStatsResponse> => {
		const response =
			await apiClient.get<OrdersStatsResponse>("/dashboard/orders");
		return response.data;
	},
	getTopMaterials: async (): Promise<TopMaterialsResponse> => {
		const response = await apiClient.get<TopMaterialsResponse>(
			"/dashboard/top-materials",
		);
		return response.data;
	},
	getTopCustomers: async (): Promise<TopCustomersResponse> => {
		const response = await apiClient.get<TopCustomersResponse>(
			"/dashboard/top-customers",
		);
		return response.data;
	},
};
