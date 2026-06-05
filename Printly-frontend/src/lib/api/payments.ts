import type {
	CustomerBalanceResponse,
	PaymentCreate,
	PaymentListResponse,
	PaymentResponse,
	PaymentUpdate,
	SettlePaymentCreate,
	SettlePaymentResponse,
} from "@/types";
import apiClient from "./client";

export const paymentsApi = {
	list: async (params?: {
		order_id?: string;
		payment_method?: string;
		offset?: number;
		limit?: number;
	}): Promise<PaymentListResponse> => {
		const response = await apiClient.get<PaymentListResponse>("/payments/", {
			params,
		});
		return response.data;
	},
	get: async (id: string): Promise<PaymentResponse> => {
		const response = await apiClient.get<PaymentResponse>(`/payments/${id}`);
		return response.data;
	},
	create: async (data: PaymentCreate): Promise<PaymentResponse> => {
		const response = await apiClient.post<PaymentResponse>("/payments/", data);
		return response.data;
	},
	update: async (id: string, data: PaymentUpdate): Promise<PaymentResponse> => {
		const response = await apiClient.put<PaymentResponse>(
			`/payments/${id}`,
			data,
		);
		return response.data;
	},
	delete: async (id: string): Promise<void> => {
		await apiClient.delete(`/payments/${id}`);
	},
	settle: async (data: SettlePaymentCreate): Promise<SettlePaymentResponse> => {
		const response = await apiClient.post<SettlePaymentResponse>(
			"/payments/settle",
			data,
		);
		return response.data;
	},
	getCustomerBalance: async (
		customerId: string,
	): Promise<CustomerBalanceResponse> => {
		const response = await apiClient.get<CustomerBalanceResponse>(
			`/customers/${customerId}/balance`,
		);
		return response.data;
	},
};
