import type {
	CustomerPricingCreate,
	CustomerPricingListResponse,
	CustomerPricingResponse,
	CustomerPricingUpdate,
	PricingRuleCreate,
	PricingRuleListResponse,
	PricingRuleResponse,
	PricingRuleUpdate,
} from "@/types";
import apiClient from "./client";

export const pricingApi = {
	listRules: async (params?: {
		offset?: number;
		limit?: number;
		component_name?: string;
		component_type?: string;
		is_active?: boolean;
	}): Promise<PricingRuleListResponse> => {
		const response = await apiClient.get<PricingRuleListResponse>(
			"/pricing/pricing-rules/",
			{ params },
		);
		return response.data;
	},
	getRule: async (id: string): Promise<PricingRuleResponse> => {
		const response = await apiClient.get<PricingRuleResponse>(
			`/pricing/pricing-rules/${id}`,
		);
		return response.data;
	},
	createRule: async (data: PricingRuleCreate): Promise<PricingRuleResponse> => {
		const response = await apiClient.post<PricingRuleResponse>(
			"/pricing/pricing-rules/",
			data,
		);
		return response.data;
	},
	updateRule: async (
		id: string,
		data: PricingRuleUpdate,
	): Promise<PricingRuleResponse> => {
		const response = await apiClient.put<PricingRuleResponse>(
			`/pricing/pricing-rules/${id}`,
			data,
		);
		return response.data;
	},
	deleteRule: async (id: string): Promise<void> => {
		await apiClient.delete(`/pricing/pricing-rules/${id}`);
	},
	// Customer pricing
	listCustomerPricings: async (
		ruleId: string,
		params?: { offset?: number; limit?: number },
	): Promise<CustomerPricingListResponse> => {
		const response = await apiClient.get<CustomerPricingListResponse>(
			`/pricing/pricing-rules/${ruleId}/customer-pricings/`,
			{ params },
		);
		return response.data;
	},
	getCustomerPricing: async (
		ruleId: string,
		customerPricingId: string,
	): Promise<CustomerPricingResponse> => {
		const response = await apiClient.get<CustomerPricingResponse>(
			`/pricing/pricing-rules/${ruleId}/customer-pricings/${customerPricingId}`,
		);
		return response.data;
	},
	createCustomerPricing: async (
		ruleId: string,
		data: CustomerPricingCreate,
	): Promise<CustomerPricingResponse> => {
		const response = await apiClient.post<CustomerPricingResponse>(
			`/pricing/pricing-rules/${ruleId}/customer-pricings/`,
			data,
		);
		return response.data;
	},
	updateCustomerPricing: async (
		ruleId: string,
		customerPricingId: string,
		data: CustomerPricingUpdate,
	): Promise<CustomerPricingResponse> => {
		const response = await apiClient.put<CustomerPricingResponse>(
			`/pricing/pricing-rules/${ruleId}/customer-pricings/${customerPricingId}`,
			data,
		);
		return response.data;
	},
	deleteCustomerPricing: async (
		ruleId: string,
		customerPricingId: string,
	): Promise<void> => {
		await apiClient.delete(
			`/pricing/pricing-rules/${ruleId}/customer-pricings/${customerPricingId}`,
		);
	},
};
