import apiClient from "./client";

export interface TenantProfileResponse {
	id: string;
	name: string;
	slug: string | null;
	address: string | null;
	phone: string | null;
	email: string | null;
	logo_url: string | null;
	is_active: boolean;
	created_at: string;
}

export interface TenantUpdateRequest {
	name?: string;
	phone?: string;
	address?: string;
	email?: string;
}

// TODO: Backend endpoint /tenants/me GET and PUT needed
export const tenantApi = {
	getProfile: async (): Promise<TenantProfileResponse> => {
		const response = await apiClient.get<TenantProfileResponse>("/tenants/me");
		return response.data;
	},
	updateProfile: async (
		data: TenantUpdateRequest,
	): Promise<TenantProfileResponse> => {
		const response = await apiClient.put<TenantProfileResponse>(
			"/tenants/me",
			data,
		);
		return response.data;
	},
};
