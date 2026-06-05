// ==================== Common Types ====================

export interface PaginatedResponse<T> {
	total: number;
	items?: T[];
	// Some endpoints use different field names
	orders?: T[];
	customers?: T[];
	members?: T[];
	payments?: T[];
	expenses?: T[];
	notifications?: T[];
	materials?: T[];
	transactions?: T[];
	activation_codes?: T[];
}

export interface ApiError {
	detail: string;
}
