import type {
	OrderCreate,
	OrderResponse,
	OrderStatusUpdate,
	OrdersListResponse,
	OrdersRequest,
	OrderUpdate,
} from "@/types";
import apiClient from "./client";

export const ordersApi = {
	list: async (params?: OrdersRequest): Promise<OrdersListResponse> => {
		const response = await apiClient.get<OrdersListResponse>("/orders/", {
			params,
		});
		return response.data;
	},

	get: async (orderId: string): Promise<OrderResponse> => {
		const response = await apiClient.get<OrderResponse>(`/orders/${orderId}`);
		return response.data;
	},

	create: async (data: OrderCreate): Promise<OrderResponse> => {
		const response = await apiClient.post<OrderResponse>("/orders/", data);
		return response.data;
	},

	update: async (
		orderId: string,
		data: OrderUpdate,
	): Promise<OrderResponse> => {
		const response = await apiClient.put<OrderResponse>(
			`/orders/${orderId}`,
			data,
		);
		return response.data;
	},

	updateStatus: async (
		orderId: string,
		data: OrderStatusUpdate,
	): Promise<OrderResponse> => {
		const response = await apiClient.patch<OrderResponse>(
			`/orders/${orderId}/status`,
			data,
		);
		return response.data;
	},

	delete: async (orderId: string): Promise<void> => {
		await apiClient.delete(`/orders/${orderId}`);
	},
};
