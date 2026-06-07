import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface Column<T> {
	key: string;
	header: string;
	render?: (row: T) => React.ReactNode;
	className?: string;
}

interface DataTableProps<T> {
	columns: Column<T>[];
	data: T[];
	total: number;
	page: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onRowClick?: (row: T) => void;
	rowKey: (row: T) => string;
	emptyMessage?: string;
}

export function DataTable<T>({
	columns,
	data,
	total,
	page,
	pageSize,
	onPageChange,
	onRowClick,
	rowKey,
	emptyMessage,
}: DataTableProps<T>) {
	const totalPages = Math.ceil(total / pageSize);
	const hasNext = page < totalPages;
	const hasPrev = page > 1;

	return (
		<div className="border border-border rounded-xl overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-left border-collapse">
					<thead>
						<tr className="bg-muted/50 text-muted-foreground">
							{columns.map((col) => (
								<th
									key={col.key}
									className={cn(
										"px-6 py-4 font-medium text-sm border-b border-border",
										col.className,
									)}
								>
									{col.header}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{data.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length}
									className="px-6 py-8 text-center text-muted-foreground"
								>
									{emptyMessage || "No data found"}
								</td>
							</tr>
						) : (
							data.map((row) => (
								<tr
									key={rowKey(row)}
									className={cn(
										"hover:bg-muted/30 transition-colors",
										onRowClick && "cursor-pointer",
									)}
									onClick={() => onRowClick?.(row)}
								>
									{columns.map((col) => (
										<td
											key={col.key}
											className={cn("px-6 py-4 text-sm", col.className)}
										>
											{col.render
												? col.render(row)
												: String(
														(row as Record<string, unknown>)[col.key] ?? "—",
													)}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			{total > pageSize && (
				<div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/30">
					<span className="text-sm text-muted-foreground">
						{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{" "}
						{total}
					</span>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							disabled={!hasPrev}
							onClick={() => onPageChange(page - 1)}
						>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							disabled={!hasNext}
							onClick={() => onPageChange(page + 1)}
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
