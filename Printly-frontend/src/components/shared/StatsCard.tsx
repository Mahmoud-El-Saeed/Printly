import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StatsCardProps {
	icon: LucideIcon;
	label: string;
	value: string;
	change?: string;
	changeColor?: string;
	className?: string;
}

export function StatsCard({
	icon: Icon,
	label,
	value,
	change,
	changeColor,
	className,
}: StatsCardProps) {
	return (
		<div
			className={cn(
				"bg-background border border-outline-variant rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group",
				className,
			)}
		>
			<div className="flex items-center justify-between">
				<span className="font-medium text-sm text-on-surface-variant">
					{label}
				</span>
				<Icon className="h-4 w-4" />
			</div>
			<div>
				<div className="flex items-baseline gap-2">
					<span className="font-semibold text-xl tabular-nums text-on-surface">
						{value}
					</span>
					{change && (
						<span
							className={cn("text-xs font-bold", changeColor || "text-primary")}
						>
							{change}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
