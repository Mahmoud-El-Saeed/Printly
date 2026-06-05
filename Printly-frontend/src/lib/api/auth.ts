import type {
	CustomerRegister,
	CustomerResponse,
	LoginRequest,
	RefreshRequest,
	ShopOwnerRegister,
	ShopOwnerResponse,
	TokenResponse,
} from "@/types";
import apiClient, { setTokens } from "./client";

export const authApi = {
	login: async (data: LoginRequest): Promise<TokenResponse> => {
		// Backend uses OAuth2PasswordRequestForm (form-data), not JSON
		const formData = new URLSearchParams();
		formData.append("username", data.email);
		formData.append("password", data.password);

		const response = await apiClient.post<TokenResponse>(
			"/auth/login",
			formData,
			{ headers: { "Content-Type": "application/x-www-form-urlencoded" } },
		);
		setTokens(response.data);
		return response.data;
	},

	registerShopOwner: async (
		data: ShopOwnerRegister,
	): Promise<ShopOwnerResponse> => {
		const response = await apiClient.post<ShopOwnerResponse>(
			"/auth/register/shop-owner",
			data,
		);
		return response.data;
	},

	registerCustomer: async (
		data: CustomerRegister,
	): Promise<CustomerResponse> => {
		const response = await apiClient.post<CustomerResponse>(
			"/auth/register/customer",
			data,
		);
		return response.data;
	},

	refreshTokens: async (refreshToken: string): Promise<TokenResponse> => {
		const response = await apiClient.post<TokenResponse>("/auth/refresh", {
			refresh_token: refreshToken,
		} satisfies RefreshRequest);
		setTokens(response.data);
		return response.data;
	},

	getProtected: async (): Promise<{ Hello: string }> => {
		const response = await apiClient.get("/auth/protected");
		return response.data;
	},
};
