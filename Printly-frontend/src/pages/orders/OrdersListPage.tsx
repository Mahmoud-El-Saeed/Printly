import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { FilterBar } from "@/components/shared/FilterBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "@/components/tables/DataTable";
import { useLanguage } from "@/contexts/LanguageContext";
import { ordersApi } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { OrderResponse, OrderStatus } from "@/types/order";

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [];

export default function OrdersListPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const statusOptions = STATUS_OPTIONS.length
		? STATUS_OPTIONS
		: (
				["new", "printing", "ready", "delivered", "cancelled"] as OrderStatus[]
			).map((s) => ({ value: s, label: t(`status.${s}`) }));

	const { data, isLoading } = useQuery({
		queryKey: ["orders", search, statusFilter, page],
		queryFn: () =>
			ordersApi.list({
				order_number: search || undefined,
				status: (statusFilter as OrderStatus) || undefined,
				offset: (page - 1) * pageSize,
				limit: pageSize,
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: () => {
			if (!deleteId) throw new Error("No order selected for deletion");
			return ordersApi.delete(deleteId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			setDeleteId(null);
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const columns = [
		{
			key: "order_number",
			header: t("orders.order_number"),
			render: (row: OrderResponse) => (
				<span className="font-semibold text-primary tabular-nums">
					#{row.order_number}
				</span>
			),
		},
		{
			key: "customer",
			header: t("orders.customer"),
			render: (row: OrderResponse) => (
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
						{(row.walk_in_customer_id || row.customer_id || "?")
							.substring(0, 2)
							.toUpperCase()}
					</div>
					<span className="text-on-surface">
						{row.walk_in_customer_id || row.customer_id || "—"}
					</span>
				</div>
			),
		},
		{
			key: "status",
			header: t("orders.status"),
			render: (row: OrderResponse) => (
				<div className="text-center">
					<StatusBadge status={row.status} />
				</div>
			),
		},
		{
			key: "total_amount",
			header: t("orders.total"),
			render: (row: OrderResponse) => (
				<span className="tabular-nums font-semibold">
					{formatCurrency(row.total_amount, language)}
				</span>
			),
		},
		{
			key: "paid_amount",
			header: t("orders.paid"),
			render: (row: OrderResponse) =>
				row.paid_amount > 0 ? (
					<CheckCircle className="h-4 w-4 text-primary" />
				) : (
					<X className="h-4 w-4 text-error" />
				),
		},
		{
			key: "created_at",
			header: t("orders.created"),
			render: (row: OrderResponse) => (
				<span className="text-on-surface-variant text-xs">
					{formatDate(row.created_at, language)}
				</span>
			),
		},
		{
			key: "actions",
			header: t("orders.actions"),
			render: (row: OrderResponse) => (
				<div className="flex justify-end gap-1">
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={() => navigate(`/orders/${row.id}`)}
					>
						<Eye className="h-4 w-4" />
					</button>
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={() => navigate(`/orders/${row.id}/edit`)}
					>
						<Pencil className="h-4 w-4" />
					</button>
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-error-container text-error transition-colors"
						onClick={() => setDeleteId(row.id)}
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>
			),
		},
	];

	const onSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
		[],
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("orders.title")}
				subtitle={t("orders.subtitle")}
				actionLabel={t("orders.new_order")}
				actionIcon={Plus}
				onAction={() => navigate("/orders/new")}
			/>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-4">
				<FilterBar
					searchValue={search}
					onSearchChange={onSearchChange}
					searchPlaceholder={t("orders.search_placeholder")}
					filters={[
						{
							key: "status",
							placeholder: t("orders.all_statuses"),
							options: statusOptions,
							value: statusFilter,
							onChange: setStatusFilter,
						},
					]}
				/>
			</div>

			<DataTable
				columns={columns}
				data={data?.orders ?? []}
				total={data?.total ?? 0}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				onRowClick={(row) => navigate(`/orders/${row.id}`)}
				rowKey={(row) => row.id}
				emptyMessage={isLoading ? t("common.loading") : t("common.no_data")}
			/>
			<ConfirmDeleteDialog
				open={!!deleteId}
				onOpenChange={(open) => {
					if (!open) setDeleteId(null);
				}}
				onConfirm={() => deleteMutation.mutate()}
				title={t("common.delete")}
				description={t("common.delete_confirm")}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
