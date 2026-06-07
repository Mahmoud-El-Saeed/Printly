import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	actionLabel?: string;
	actionIcon?: LucideIcon;
	onAction?: () => void;
}

export function PageHeader({
	title,
	subtitle,
	actionLabel,
	actionIcon: ActionIcon,
	onAction,
}: PageHeaderProps) {
	return (
		<div className="flex items-end justify-between">
			<div>
				<h2 className="font-bold text-2xl tracking-tight">{title}</h2>
				{subtitle && (
					<p className="text-sm text-muted-foreground">{subtitle}</p>
				)}
			</div>
			{actionLabel && onAction && (
				<Button onClick={onAction} className="gap-2">
					{ActionIcon && <ActionIcon className="h-4 w-4" />}
					{actionLabel}
				</Button>
			)}
		</div>
	);
}
