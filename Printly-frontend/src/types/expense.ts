// ==================== Expense Types ====================

export type ExpenseCategory =
	| "rent"
	| "salaries"
	| "maintenance"
	| "utilities"
	| "supplies"
	| "other";

export interface ExpenseResponse {
	id: string;
	tenant_id: string;
	category: ExpenseCategory;
	amount: number;
	description: string | null;
	expense_date: string;
	created_by: string | null;
	created_at: string;
	updated_at: string;
}

export interface ExpenseCreate {
	category: ExpenseCategory;
	amount: number;
	description?: string;
	expense_date: string;
}

export interface ExpenseUpdate {
	category?: ExpenseCategory;
	amount?: number;
	description?: string;
	expense_date?: string;
}

export interface ExpenseListResponse {
	expenses: ExpenseResponse[];
	total: number;
}

export interface ExpenseRequest {
	category?: ExpenseCategory;
	start_date?: string;
	end_date?: string;
	offset?: number;
	limit?: number;
}
