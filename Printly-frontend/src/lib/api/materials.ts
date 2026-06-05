import type {
	MaterialCreate,
	MaterialListResponse,
	MaterialResponse,
	MaterialUpdate,
	TransactionCreate,
	TransactionListResponse,
	TransactionResponse,
} from "@/types";
import apiClient from "./client";

export const materialsApi = {
	list: async (params?: {
		offset?: number;
		limit?: number;
		name?: string;
		is_active?: boolean;
	}): Promise<MaterialListResponse> => {
		const response = await apiClient.get<MaterialListResponse>("/materials/", {
			params,
		});
		return response.data;
	},
	get: async (id: string): Promise<MaterialResponse> => {
		const response = await apiClient.get<MaterialResponse>(`/materials/${id}`);
		return response.data;
	},
	create: async (data: MaterialCreate): Promise<MaterialResponse> => {
		const response = await apiClient.post<MaterialResponse>(
			"/materials/",
			data,
		);
		return response.data;
	},
	update: async (
		id: string,
		data: MaterialUpdate,
	): Promise<MaterialResponse> => {
		const response = await apiClient.put<MaterialResponse>(
			`/materials/${id}`,
			data,
		);
		return response.data;
	},
	delete: async (id: string): Promise<void> => {
		await apiClient.delete(`/materials/${id}`);
	},
	// Transactions
	listTransactions: async (
		materialId: string,
		params?: { offset?: number; limit?: number; transaction_type?: string },
	): Promise<TransactionListResponse> => {
		const response = await apiClient.get<TransactionListResponse>(
			`/materials/${materialId}/transactions`,
			{ params },
		);
		return response.data;
	},
	getTransaction: async (
		materialId: string,
		transactionId: string,
	): Promise<TransactionResponse> => {
		const response = await apiClient.get<TransactionResponse>(
			`/materials/${materialId}/transactions/${transactionId}`,
		);
		return response.data;
	},
	createTransaction: async (
		materialId: string,
		data: TransactionCreate,
	): Promise<TransactionResponse> => {
		const response = await apiClient.post<TransactionResponse>(
			`/materials/${materialId}/transactions`,
			data,
		);
		return response.data;
	},
};
