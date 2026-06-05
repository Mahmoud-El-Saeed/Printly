// ==================== Order Types ====================

export type OrderStatus =
	| "new"
	| "printing"
	| "ready"
	| "delivered"
	| "cancelled";

export interface OrderItemResponse {
	id: string;
	book_id: string | null;
	book_title: string;
	copies: number;
	pages_per_copy: number;
	sides_per_page: number;
	printing_price: number;
	cover_type: string | null;
	cover_price: number;
	binding_type: string | null;
	binding_price: number;
	has_lamination: boolean;
	lamination_price: number;
	extra_services: Record<string, number>;
	subtotal: number;
	created_at: string;
	updated_at: string;
}

export interface OrderItemCreate {
	book_id?: string;
	book_title: string;
	copies: number;
	pages_per_copy: number;
	sides_per_page?: number;
	printing_price: number;
	cover_type?: string;
	cover_price?: number;
	binding_type?: string;
	binding_price?: number;
	has_lamination?: boolean;
	lamination_price?: number;
	extra_services?: Record<string, number>;
}

export interface OrderResponse {
	id: string;
	order_number: string;
	customer_id: string | null;
	walk_in_customer_id: string | null;
	created_by: string;
	status: OrderStatus;
	total_amount: number;
	paid_amount: number;
	notes: string | null;
	due_date: string | null;
	completed_at: string | null;
	items: OrderItemResponse[];
	created_at: string;
	updated_at: string;
}

export interface OrderCreate {
	customer_id?: string;
	walk_in_customer_id?: string;
	notes?: string;
	due_date?: string;
	items: OrderItemCreate[];
}

export interface OrderUpdate {
	due_date?: string;
	notes?: string;
}

export interface OrderStatusUpdate {
	status: OrderStatus;
}

export interface OrdersRequest {
	status?: OrderStatus;
	customer_id?: string;
	walk_in_customer_id?: string;
	date_from?: string;
	date_to?: string;
	order_number?: string;
	offset?: number;
	limit?: number;
}

export interface OrdersListResponse {
	total: number;
	orders: OrderResponse[];
}
