// ==================== Customer Types ====================

export interface WalkInCustomerResponse {
	id: string;
	name: string;
	phone: string | null;
	notes: string | null;
	tenant_id: string;
	created_at: string;
}

export interface WalkInCustomerCreate {
	name: string;
	phone?: string;
	notes?: string;
}

export interface WalkInCustomerUpdate {
	name?: string;
	phone?: string;
	notes?: string;
}

export interface WalkInCustomerListResponse {
	customers: WalkInCustomerResponse[];
	total: number;
}

export interface CustomerMemberResponse {
	id: string;
	name: string;
	email: string | null;
	phone: string | null;
	tenant_id: string;
	is_approved: boolean;
	balance: number;
	created_at: string;
}

export interface CustomerMemberCreate {
	name: string;
	email?: string;
	phone: string;
	balance?: number;
}

export interface CustomerMemberUpdate {
	name?: string;
	email?: string;
	phone?: string;
}

export interface CustomerMemberListResponse {
	members: CustomerMemberResponse[];
	total: number;
}

export type LinkStatus = "pending" | "approved" | "rejected";

export interface CustomerLinkResponse {
	id: string;
	tenant_id: string;
	customer_user_id: string;
	customer_name: string;
	customer_email: string;
	status: LinkStatus;
	requested_at: string;
	approved_at: string | null;
}

export interface CustomerLinkRequest {
	slug: string;
}

export interface CustomerLinkListResponse {
	links: CustomerLinkResponse[];
	total: number;
}

export interface CustomerLinkApprovalRequest {
	customer_user_id: string;
	approve: boolean;
}

export interface CustomerBalanceResponse {
	customer_id: string;
	balance: number;
	unpaid_total: number;
	net_balance: number;
}
