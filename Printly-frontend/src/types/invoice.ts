// ==================== Invoice Types ====================

export interface InvoiceResponse {
	id: string;
	invoice_number: string;
	order_id: string;
	customer_id: string | null;
	customer_name: string | null;
	total_amount: number;
	paid_amount: number;
	notes: string | null;
	created_at: string;
}

export interface InvoiceDetailResponse extends InvoiceResponse {
	order_number: string;
	items: InvoiceItem[];
	payments: InvoicePayment[];
}

export interface InvoiceItem {
	book_title: string;
	copies: number;
	unit_price: number;
	subtotal: number;
}

export interface InvoicePayment {
	id: string;
	amount: number;
	payment_method: string;
	reference: string | null;
	created_at: string;
}

export interface InvoicesRequest {
	customer_id?: string;
	order_id?: string;
	offset?: number;
	limit?: number;
	order_by?: string;
	order_dir?: string;
}

export interface InvoiceListResponse {
	total: number;
	items: InvoiceResponse[];
}
