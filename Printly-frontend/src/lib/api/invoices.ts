import type {
	InvoiceDetailResponse,
	InvoiceListResponse,
	InvoicesRequest,
} from "@/types";
import apiClient from "./client";

export const invoicesApi = {
	list: async (params?: InvoicesRequest): Promise<InvoiceListResponse> => {
		const response = await apiClient.get<InvoiceListResponse>("/invoices/", {
			params,
		});
		return response.data;
	},

	get: async (invoiceId: string): Promise<InvoiceDetailResponse> => {
		const response = await apiClient.get<InvoiceDetailResponse>(
			`/invoices/${invoiceId}`,
		);
		return response.data;
	},

	generate: async (
		orderId: string,
		notes?: string,
	): Promise<InvoiceDetailResponse> => {
		const response = await apiClient.post<InvoiceDetailResponse>(
			"/invoices/",
			null,
			{
				params: { order_id: orderId, notes },
			},
		);
		return response.data;
	},
};
