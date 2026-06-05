// ==================== Notification Types ====================

export type NotificationType = "order" | "payment" | "system" | "alert";

export interface NotificationResponse {
	id: string;
	tenant_id: string;
	user_id: string | null;
	title: string;
	message: string;
	notification_type: NotificationType;
	is_read: boolean;
	created_at: string;
}

export interface NotificationListResponse {
	notifications: NotificationResponse[];
	unread_count: number;
	total_count: number;
}

export interface NotificationListRequest {
	user_id?: string;
	notification_type?: NotificationType;
	is_read?: boolean;
	offset?: number;
	limit?: number;
	order_by?: "created_at";
	order_dir?: "asc" | "desc";
}
