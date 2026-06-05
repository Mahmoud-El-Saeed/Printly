import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";
import type { OrderStatus } from "@/types/order";

interface StatusBadgeProps {
	status: OrderStatus | string;
	className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const colorClass = ORDER_STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
	const label = ORDER_STATUS_LABELS[status] || status;

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
				colorClass,
				className,
			)}
		>
			{label}
		</span>
	);
}
