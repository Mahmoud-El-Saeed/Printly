// ==================== Order Types ====================

export type OrderStatus =
	| "new"
	| "printing"
	| "ready"
	| "delivered"
	| "cancelled";

export interface MaterialSnapshotItem {
	material_id: string;
	material_name: string;
	quantity_per_copy: number;
	price_per_unit: number;
}

export interface OrderItemResponse {
	id: string;
	book_id: string | null;
	book_title: string;
	copies: number;
	unit_price: number;
	total_pages: number;
	color_mode: string;
	sides_per_page: number;
	binding_type: string | null;
	has_lamination: boolean;
	materials_snapshot: MaterialSnapshotItem[];
	subtotal: number;
	created_at: string;
	updated_at: string;
}

export interface OrderItemCreate {
	book_id: string;
	copies: number;
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
	paid_amount?: number;
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
