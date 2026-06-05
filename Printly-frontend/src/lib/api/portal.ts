import type {
	BookResponse,
	CustomerBalanceResponse,
	NotificationListResponse,
	OrderResponse,
	PortalProfileResponse,
	PortalTenantsResponse,
} from "@/types";
import apiClient from "./client";

export const portalApi = {
	getProfile: async (): Promise<PortalProfileResponse> => {
		const response =
			await apiClient.get<PortalProfileResponse>("/portal/me/profile");
		return response.data;
	},
	getTenants: async (): Promise<PortalTenantsResponse> => {
		const response =
			await apiClient.get<PortalTenantsResponse>("/portal/me/tenants");
		return response.data;
	},
	getOrders: async (
		tenantId: string,
		params?: {
			status?: string;
			date_from?: string;
			date_to?: string;
			offset?: number;
			limit?: number;
		},
	): Promise<{ total: number; orders: OrderResponse[] }> => {
		const response = await apiClient.get(`/portal/tenants/${tenantId}/orders`, {
			params,
		});
		return response.data;
	},
	getOrder: async (
		tenantId: string,
		orderId: string,
	): Promise<OrderResponse> => {
		const response = await apiClient.get(
			`/portal/tenants/${tenantId}/orders/${orderId}`,
		);
		return response.data;
	},
	getBooks: async (
		tenantId: string,
		params?: { offset?: number; limit?: number },
	): Promise<{ total: number; books: BookResponse[] }> => {
		const response = await apiClient.get(`/portal/tenants/${tenantId}/books`, {
			params,
		});
		return response.data;
	},
	getBalance: async (tenantId: string): Promise<CustomerBalanceResponse> => {
		const response = await apiClient.get(`/portal/tenants/${tenantId}/balance`);
		return response.data;
	},
	getNotifications: async (
		tenantId: string,
		params?: { offset?: number; limit?: number },
	): Promise<NotificationListResponse> => {
		const response = await apiClient.get(
			`/portal/tenants/${tenantId}/notifications`,
			{ params },
		);
		return response.data;
	},
	markNotificationRead: async (
		tenantId: string,
		notificationId: string,
	): Promise<void> => {
		await apiClient.patch(
			`/portal/tenants/${tenantId}/notifications/${notificationId}/read`,
		);
	},
	markAllNotificationsRead: async (tenantId: string): Promise<void> => {
		await apiClient.patch(`/portal/tenants/${tenantId}/notifications/read`);
	},
};
