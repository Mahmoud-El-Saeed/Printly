export const APP_NAME = "Printly";
export const API_BASE_URL =
	import.meta.env.VITE_API_URL || "http://localhost:8000";

export const ROLES = {
	ADMIN: "admin",
	SHOP_OWNER: "shop_owner",
	STAFF: "staff",
	CUSTOMER: "customer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// CSS classes for order status badges (not translatable — colors stay the same)
export const ORDER_STATUS_COLORS: Record<string, string> = {
	new: "bg-blue-100 text-blue-800",
	printing: "bg-yellow-100 text-yellow-800",
	ready: "bg-green-100 text-green-800",
	delivered: "bg-gray-100 text-gray-800",
	cancelled: "bg-red-100 text-red-800",
};
