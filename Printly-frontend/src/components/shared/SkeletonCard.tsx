import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STAT_KEYS = ["stat-0", "stat-1", "stat-2", "stat-3"];

export function SkeletonStatsCards() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{STAT_KEYS.map((key) => (
				<Card key={key}>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-4 rounded" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-8 w-20 mb-1" />
						<Skeleton className="h-3 w-16" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export function SkeletonTable({
	rows = 5,
	cols = 4,
}: {
	rows?: number;
	cols?: number;
}) {
	return (
		<div className="space-y-3 p-4">
			{Array.from({ length: rows }, (_, r) => `row-${r}`).map((rowKey) => (
				<div key={rowKey} className="flex gap-4">
					{Array.from({ length: cols }, (_, c) => `col-${rowKey}-${c}`).map(
						(cellKey) => (
							<Skeleton key={cellKey} className="h-4 flex-1" />
						),
					)}
				</div>
			))}
		</div>
	);
}
