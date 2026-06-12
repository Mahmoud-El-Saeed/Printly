// ==================== Auth Types ====================

export interface TokenData {
	user_id: string;
	tenant_id: string | null;
	role: string;
	full_name?: string;
}

export interface TokenResponse {
	access_token: string;
	refresh_token: string;
	token_type: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface ShopOwnerRegister {
	email: string;
	password: string;
	full_name: string;
	shop_name: string;
	shop_phone?: string;
	shop_address?: string;
}

export interface ShopOwnerResponse {
	user_id: string;
	email: string;
	full_name: string;
	role: string;
	tenant_id: string;
	shop_name: string;
}

export interface CustomerRegister {
	email: string;
	password: string;
	full_name: string;
}

export interface CustomerResponse {
	user_id: string;
	email: string;
	full_name: string;
	role: string;
}

export interface RefreshRequest {
	refresh_token: string;
}
