import type { DashboardOverviewResponse } from "@/types";
import apiClient from "./client";

export const dashboardApi = {
	getOverview: async (): Promise<DashboardOverviewResponse> => {
		const response = await apiClient.get<DashboardOverviewResponse>(
			"/dashboard/overview",
		);
		return response.data;
	},
	getRevenue: async (): Promise<import("@/types").RevenueStatsResponse> => {
		const response = await apiClient.get("/dashboard/revenue");
		return response.data;
	},
	getExpenses: async (): Promise<import("@/types").ExpenseStatsResponse> => {
		const response = await apiClient.get("/dashboard/expenses");
		return response.data;
	},
	getProfit: async (): Promise<import("@/types").ProfitStatsResponse> => {
		const response = await apiClient.get("/dashboard/profit");
		return response.data;
	},
	getOrdersStats: async (): Promise<import("@/types").OrdersStatsResponse> => {
		const response = await apiClient.get("/dashboard/orders");
		return response.data;
	},
	getTopMaterials: async (): Promise<
		import("@/types").TopMaterialsResponse
	> => {
		const response = await apiClient.get("/dashboard/top-materials");
		return response.data;
	},
	getTopCustomers: async (): Promise<
		import("@/types").TopCustomersResponse
	> => {
		const response = await apiClient.get("/dashboard/top-customers");
		return response.data;
	},
};
