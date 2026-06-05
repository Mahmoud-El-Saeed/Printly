import type {
	ExpenseCreate,
	ExpenseListResponse,
	ExpenseRequest,
	ExpenseResponse,
	ExpenseUpdate,
} from "@/types";
import apiClient from "./client";

export const expensesApi = {
	list: async (params?: ExpenseRequest): Promise<ExpenseListResponse> => {
		const response = await apiClient.get<ExpenseListResponse>("/expenses/", {
			params,
		});
		return response.data;
	},
	get: async (id: string): Promise<ExpenseResponse> => {
		const response = await apiClient.get<ExpenseResponse>(`/expenses/${id}`);
		return response.data;
	},
	create: async (data: ExpenseCreate): Promise<ExpenseResponse> => {
		const response = await apiClient.post<ExpenseResponse>("/expenses/", data);
		return response.data;
	},
	update: async (id: string, data: ExpenseUpdate): Promise<ExpenseResponse> => {
		const response = await apiClient.put<ExpenseResponse>(
			`/expenses/${id}`,
			data,
		);
		return response.data;
	},
	delete: async (id: string): Promise<void> => {
		await apiClient.delete(`/expenses/${id}`);
	},
};
