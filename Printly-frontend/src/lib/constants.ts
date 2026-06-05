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

export const ORDER_STATUS = {
	NEW: "new",
	PRINTING: "printing",
	READY: "ready",
	DELIVERED: "delivered",
	CANCELLED: "cancelled",
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
	new: "جديد",
	printing: "قيد الطباعة",
	ready: "جاهز",
	delivered: "تم التسليم",
	cancelled: "ملغي",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
	new: "bg-blue-100 text-blue-800",
	printing: "bg-yellow-100 text-yellow-800",
	ready: "bg-green-100 text-green-800",
	delivered: "bg-gray-100 text-gray-800",
	cancelled: "bg-red-100 text-red-800",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
	cash: "كاش",
	bank_transfer: "تحويل بنكي",
	mobile_wallet: "محفظة موبايل",
	balance: "رصيد",
	other: "أخرى",
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
	rent: "إيجار",
	salaries: "مرتبات",
	maintenance: "صيانة",
	utilities: "مرافق",
	supplies: "مستلزمات",
	other: "أخرى",
};

export const MATERIAL_TRANSACTION_TYPE_LABELS: Record<string, string> = {
	restock: "توريد",
	consumption: "استهلاك",
	adjustment: "تعديل",
	return: "مرتجع",
};

export const PRICING_COMPONENT_TYPE_LABELS: Record<string, string> = {
	page_print: "طباعة صفحة",
	cover: "غلاف",
	binding: "تجليد",
	lamination: "لمينيشن",
	extra_service: "خدمة إضافية",
};

export const PRICING_UNIT_TYPE_LABELS: Record<string, string> = {
	per_page: "لكل صفحة",
	per_unit: "لكل وحدة",
};
