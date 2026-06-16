// ==================== Book Types ====================

export interface BookMaterialItem {
	material_id: string;
	quantity_per_copy: number;
}

export interface BookMaterialResponse {
	material_id: string;
	material_name: string;
	quantity_per_copy: number;
	price_per_unit: number;
}

export interface BookResponse {
	id: string;
	title: string;
	subject: string | null;
	total_pages: number;
	color_mode: string;
	sides_per_page: number;
	copies: number;
	binding_type: string | null;
	has_lamination: boolean;
	notes: string | null;
	file_size: number | null;
	file_url: string | null;
	created_at: string;
	updated_at: string;
	book_materials: BookMaterialResponse[];
}

export interface BookCreate {
	title: string;
	subject?: string;
	total_pages: number;
	color_mode?: string;
	sides_per_page?: number;
	copies?: number;
	binding_type?: string;
	has_lamination?: boolean;
	notes?: string;
	materials?: BookMaterialItem[];
	file?: File;
}

export interface BookUpdate {
	title?: string;
	subject?: string;
	total_pages?: number;
	color_mode?: string;
	sides_per_page?: number;
	copies?: number;
	binding_type?: string;
	has_lamination?: boolean;
	notes?: string;
}

export interface BooksRequest {
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
