import type {
	CustomerBalanceResponse,
	CustomerLinkApprovalRequest,
	CustomerLinkListResponse,
	CustomerLinkRequest,
	CustomerLinkResponse,
	CustomerMemberCreate,
	CustomerMemberListResponse,
	CustomerMemberResponse,
	CustomerMemberUpdate,
	WalkInCustomerCreate,
	WalkInCustomerListResponse,
	WalkInCustomerResponse,
	WalkInCustomerUpdate,
} from "@/types";
import apiClient from "./client";

export const customersApi = {
	// Walk-in customers
	listWalkIn: async (params?: {
		offset?: number;
		limit?: number;
		search?: string;
	}): Promise<WalkInCustomerListResponse> => {
		const response = await apiClient.get<WalkInCustomerListResponse>(
			"/customers/walk-in",
			{ params },
		);
		return response.data;
	},
	getWalkIn: async (id: string): Promise<WalkInCustomerResponse> => {
		const response = await apiClient.get<WalkInCustomerResponse>(
			`/customers/walk-in/${id}`,
		);
		return response.data;
	},
	createWalkIn: async (
		data: WalkInCustomerCreate,
	): Promise<WalkInCustomerResponse> => {
		const response = await apiClient.post<WalkInCustomerResponse>(
			"/customers/walk-in",
			data,
		);
		return response.data;
	},
	updateWalkIn: async (
		id: string,
		data: WalkInCustomerUpdate,
	): Promise<WalkInCustomerResponse> => {
		const response = await apiClient.put<WalkInCustomerResponse>(
			`/customers/walk-in/${id}`,
			data,
		);
		return response.data;
	},
	deleteWalkIn: async (id: string): Promise<void> => {
		await apiClient.delete(`/customers/walk-in/${id}`);
	},

	// Customer members
	listMembers: async (params?: {
		offset?: number;
		limit?: number;
		search_query?: string;
	}): Promise<CustomerMemberListResponse> => {
		const response = await apiClient.get<CustomerMemberListResponse>(
			"/customers/member",
			{ params },
		);
		return response.data;
	},
	getMember: async (id: string): Promise<CustomerMemberResponse> => {
		const response = await apiClient.get<CustomerMemberResponse>(
			`/customers/member/${id}`,
		);
		return response.data;
	},
	createMember: async (
		data: CustomerMemberCreate,
	): Promise<CustomerMemberResponse> => {
		const response = await apiClient.post<CustomerMemberResponse>(
			"/customers/member",
			data,
		);
		return response.data;
	},
	updateMember: async (
		id: string,
		data: CustomerMemberUpdate,
	): Promise<CustomerMemberResponse> => {
		const response = await apiClient.put<CustomerMemberResponse>(
			`/customers/member/${id}`,
			data,
		);
		return response.data;
	},
	deleteMember: async (id: string): Promise<void> => {
		await apiClient.delete(`/customers/member/${id}`);
	},

	// Balance
	getBalance: async (customerId: string): Promise<CustomerBalanceResponse> => {
		const response = await apiClient.get<CustomerBalanceResponse>(
			`/customers/${customerId}/balance`,
		);
		return response.data;
	},

	// Link requests
	requestLink: async (
		data: CustomerLinkRequest,
	): Promise<CustomerLinkResponse> => {
		const response = await apiClient.post<CustomerLinkResponse>(
			"/customers/link",
			data,
		);
		return response.data;
	},
	getLinkRequests: async (params?: {
		offset?: number;
		limit?: number;
	}): Promise<CustomerLinkListResponse> => {
		const response = await apiClient.get<CustomerLinkListResponse>(
			"/customers/link",
			{ params },
		);
		return response.data;
	},
	getPendingLinks: async (params?: {
		offset?: number;
		limit?: number;
	}): Promise<CustomerLinkListResponse> => {
		const response = await apiClient.get<CustomerLinkListResponse>(
			"/customers/link/requests",
			{ params },
		);
		return response.data;
	},
	approveOrRejectLink: async (
		linkId: string,
		data: CustomerLinkApprovalRequest,
	): Promise<void> => {
		await apiClient.post(`/customers/link/${linkId}/approve`, data);
	},
};
