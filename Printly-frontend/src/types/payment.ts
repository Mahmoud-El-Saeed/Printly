// ==================== Payment Types ====================

export type PaymentMethod =
	| "cash"
	| "bank_transfer"
	| "mobile_wallet"
	| "balance"
	| "other";

export interface PaymentResponse {
	id: string;
	tenant_id: string;
	order_id: string;
	amount: number;
	payment_method: PaymentMethod;
	reference: string | null;
	notes: string | null;
	received_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface PaymentCreate {
	order_id: string;
	amount: number;
	payment_method: PaymentMethod;
	reference?: string;
	notes?: string;
	add_to_balance?: boolean;
	split_cash_amount?: number;
}

export interface PaymentUpdate {
	amount?: number;
	payment_method?: PaymentMethod;
	reference?: string;
	notes?: string;
	add_to_balance?: boolean;
	split_cash_amount?: number;
}

export interface PaymentListResponse {
	payments: PaymentResponse[];
	total: number;
}

export interface SettlePaymentCreate {
	customer_id: string;
	amount: number;
	payment_method: PaymentMethod;
	reference?: string;
	notes?: string;
}

export interface SettlePaymentResponse {
	payments: PaymentResponse[];
	total_settled: number;
	added_to_balance: number;
	new_balance: number;
}
