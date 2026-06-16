export interface PortalProfileResponse {
	user_id: string;
	email: string;
	full_name: string;
	phone: string | null;
	role: string;
	created_at: string;
}

export interface PortalTenantInfo {
	tenant_id: string;
	tenant_name: string;
	tenant_slug: string | null;
	linked_at: string;
	display_name: string | null;
	balance: number;
	is_approved: boolean;
}

export interface PortalTenantsResponse {
	tenants: PortalTenantInfo[];
	total: number;
}

export interface PortalPaymentCreate {
	order_id: string;
	amount: number;
	payment_method: "cash" | "mobile_wallet";
	reference?: string;
	notes?: string;
}

export interface PortalProfileUpdateRequest {
	full_name?: string;
	phone?: string;
}
