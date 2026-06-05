// ==================== Pricing Types ====================

export type PricingComponentType =
	| "page_print"
	| "cover"
	| "binding"
	| "lamination"
	| "extra_service";
export type PricingUnitType = "per_page" | "per_unit";

export interface PricingRuleResponse {
	id: string;
	tenant_id: string;
	component_name: string;
	component_type: PricingComponentType;
	price: number;
	unit_type: PricingUnitType;
	description: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface PricingRuleCreate {
	component_name: string;
	component_type: PricingComponentType;
	price: number;
	unit_type?: PricingUnitType;
	description?: string;
}

export interface PricingRuleUpdate {
	component_name?: string;
	component_type?: PricingComponentType;
	price?: number;
	unit_type?: PricingUnitType;
	description?: string;
	is_active?: boolean;
}

export interface PricingRuleListResponse {
	total: number;
	items: PricingRuleResponse[];
}

export interface CustomerPricingResponse {
	id: string;
	tenant_id: string;
	customer_id: string;
	pricing_rule_id: string;
	custom_price: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface CustomerPricingCreate {
	customer_id: string;
	custom_price: number;
}

export interface CustomerPricingUpdate {
	custom_price?: number;
	is_active?: boolean;
}

export interface CustomerPricingListResponse {
	total: number;
	items: CustomerPricingResponse[];
}
