// ==================== Book Types ====================

export interface BookResponse {
	id: string;
	created_by: string;
	customer_id: string | null;
	title: string;
	subject: string | null;
	total_pages: number;
	file_size: number | null;
	local_file_path: string | null;
	created_at: string;
	updated_at: string;
}

export interface BookCreate {
	customer_id?: string;
	title: string;
	subject?: string;
	total_pages: number;
	file?: File;
}

export interface BookUpdate {
	customer_id?: string;
	title?: string;
	subject?: string;
	total_pages?: number;
	local_file_path?: string;
}

export interface BooksRequest {
	customer_id?: string;
	title?: string;
	subject?: string;
	has_file?: boolean;
	offset?: number;
	limit?: number;
	order_by?: string;
	order_dir?: string;
}

export interface BookListResponse {
	total: number;
	items: BookResponse[];
}
