import type {
	BookResponse,
	CustomerBalanceResponse,
	NotificationListResponse,
	OrderResponse,
	PortalProfileResponse,
	PortalTenantsResponse,
} from "@/types";
import type { OrderCreate } from "@/types/order";
import type { PaymentResponse } from "@/types/payment";
import type { PortalPaymentCreate } from "@/types/portal";
import apiClient from "./client";

export const portalApi = {
	getProfile: async (): Promise<PortalProfileResponse> => {
		const response =
			await apiClient.get<PortalProfileResponse>("/portal/me/profile");
		return response.data;
	},
	updateProfile: async (data: { full_name?: string; phone?: string }) => {
		const response = await apiClient.put("/portal/me/profile", data);
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
	createOrder: async (tenantId: string, data: OrderCreate) => {
		const response = await apiClient.post(
			`/portal/tenants/${tenantId}/orders`,
			data,
		);
		return response.data as OrderResponse;
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
	): Promise<{ total: number; items: BookResponse[] }> => {
		const response = await apiClient.get(`/portal/tenants/${tenantId}/books`, {
			params,
		});
		return response.data;
	},
	createBook: async (tenantId: string, formData: FormData) => {
		const response = await apiClient.post(
			`/portal/tenants/${tenantId}/books`,
			formData,
			{
				headers: { "Content-Type": "multipart/form-data" },
			},
		);
		return response.data as BookResponse;
	},
	getBalance: async (tenantId: string): Promise<CustomerBalanceResponse> => {
		const response = await apiClient.get(`/portal/tenants/${tenantId}/balance`);
		return response.data;
	},
	createPayment: async (tenantId: string, data: PortalPaymentCreate) => {
		const response = await apiClient.post(
			`/portal/tenants/${tenantId}/payments`,
			data,
		);
		return response.data as PaymentResponse;
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
