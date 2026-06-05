import type {
	NotificationListRequest,
	NotificationListResponse,
} from "@/types";
import apiClient from "./client";

export const notificationsApi = {
	list: async (
		params?: NotificationListRequest,
	): Promise<NotificationListResponse> => {
		const response = await apiClient.get<NotificationListResponse>(
			"/notifications/",
			{ params },
		);
		return response.data;
	},
	markAsRead: async (notificationId: string): Promise<void> => {
		await apiClient.patch(`/notifications/${notificationId}/read`);
	},
	markAllAsRead: async (): Promise<void> => {
		await apiClient.patch("/notifications/read");
	},
};
