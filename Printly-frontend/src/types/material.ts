// ==================== Material Types ====================

export interface MaterialResponse {
	id: string;
	name: string;
	unit: string;
	current_stock: number;
	min_stock_alert: number;
	cost_per_unit: number;
	price_per_unit: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface MaterialCreate {
	name: string;
	unit: string;
	current_stock?: number;
	min_stock_alert?: number;
	cost_per_unit?: number;
	price_per_unit?: number;
}

export interface MaterialUpdate {
	name?: string;
	unit?: string;
	min_stock_alert?: number;
	cost_per_unit?: number;
	price_per_unit?: number;
	is_active?: boolean;
}

export interface MaterialListResponse {
	total: number;
	items: MaterialResponse[];
}

export type TransactionType =
	| "restock"
	| "consumption"
	| "adjustment"
	| "return";

export interface TransactionResponse {
	id: string;
	material_id: string;
	quantity: number;
	transaction_type: TransactionType;
	order_id: string | null;
	notes: string | null;
	created_by: string | null;
	created_at: string;
}

export interface TransactionCreate {
	quantity: number;
	transaction_type: TransactionType;
	order_id?: string;
	notes?: string;
}

export interface TransactionListResponse {
	total: number;
	items: TransactionResponse[];
}
