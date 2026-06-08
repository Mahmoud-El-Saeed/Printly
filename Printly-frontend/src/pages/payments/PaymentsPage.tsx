import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Calendar,
	CreditCard,
	Eye,
	Pencil,
	Plus,
	Trash2,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { FilterBar } from "@/components/shared/FilterBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { DataTable } from "@/components/tables/DataTable";
import { useLanguage } from "@/contexts/LanguageContext";
import { paymentsApi } from "@/lib/api/payments";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { PaymentResponse } from "@/types/payment";

export default function PaymentsPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [methodFilter, setMethodFilter] = useState("");
	const [page, setPage] = useState(1);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["payments", methodFilter, page],
		queryFn: () =>
			paymentsApi.list({
				payment_method: methodFilter || undefined,
				offset: (page - 1) * pageSize,
				limit: pageSize,
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => paymentsApi.delete(id),
		onSuccess: () => {
			toast.success(t("common.delete_success"));
			queryClient.invalidateQueries({ queryKey: ["payments"] });
			setDeleteId(null);
		},
		onError: () => {
			toast.error(t("common.delete_failed"));
		},
	});

	const stats = useMemo(() => {
		const items = data?.payments ?? [];
		const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
		const now = new Date();
		const thisMonth = items
			.filter((i) => {
				const d = new Date(i.created_at);
				return (
					d.getMonth() === now.getMonth() &&
					d.getFullYear() === now.getFullYear()
				);
			})
			.reduce((sum, i) => sum + i.amount, 0);
		const avgPayment = items.length > 0 ? totalAmount / items.length : 0;
		return { totalAmount, thisMonth, avgPayment };
	}, [data]);

	const columns = [
		{
			key: "order_id",
			header: t("payments.order_id"),
			render: (row: PaymentResponse) => (
				<span className="font-semibold text-primary">
					{row.order_id.length > 8
						? `${row.order_id.slice(0, 8)}...`
						: row.order_id}
				</span>
			),
		},
		{
			key: "amount",
			header: t("payments.amount"),
			render: (row: PaymentResponse) => (
				<span className="tabular-nums">
					{formatCurrency(row.amount, language)}
				</span>
			),
		},
		{
			key: "payment_method",
			header: t("payments.method"),
			render: (row: PaymentResponse) => (
				<span className="text-on-surface-variant">
					{t(`payments.method_${row.payment_method}`)}
				</span>
			),
		},
		{
			key: "reference",
			header: t("payments.reference"),
			render: (row: PaymentResponse) => <span>{row.reference ?? "—"}</span>,
		},
		{
			key: "received_by",
			header: t("payments.received_by"),
			render: (row: PaymentResponse) => <span>{row.received_by ?? "—"}</span>,
		},
		{
			key: "created_at",
			header: t("payments.created"),
			render: (row: PaymentResponse) => (
				<span className="text-on-surface-variant">
					{formatDate(row.created_at, language)}
				</span>
			),
		},
		{
			key: "actions",
			header: t("payments.actions"),
			render: (row: PaymentResponse) => (
				<div className="flex justify-end gap-1">
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/payments/${row.id}`);
						}}
					>
						<Eye className="h-4 w-4" />
					</button>
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/payments/${row.id}/edit`);
						}}
					>
						<Pencil className="h-4 w-4" />
					</button>
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-error-container text-error transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							setDeleteId(row.id);
						}}
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("payments.title")}
				subtitle={t("payments.subtitle")}
				actionLabel={t("payments.record_payment")}
				actionIcon={Plus}
				onAction={() => navigate("/payments/new")}
			/>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<StatsCard
					icon={CreditCard}
					label={t("payments.total_payments")}
					value={String(data?.total ?? 0)}
				/>
				<StatsCard
					icon={Wallet}
					label={t("payments.total_amount")}
					value={formatCurrency(stats.totalAmount, language)}
				/>
				<StatsCard
					icon={Calendar}
					label={t("payments.this_month")}
					value={formatCurrency(stats.thisMonth, language)}
				/>
				<StatsCard
					icon={TrendingUp}
					label={t("payments.avg_payment")}
					value={formatCurrency(stats.avgPayment, language)}
				/>
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-4">
				<FilterBar
					filters={[
						{
							key: "method",
							placeholder: t("payments.all_methods"),
							options: [
								{ value: "cash", label: t("payments.method_cash") },
								{
									value: "bank_transfer",
									label: t("payments.method_bank_transfer"),
								},
								{
									value: "mobile_wallet",
									label: t("payments.method_mobile_wallet"),
								},
								{ value: "balance", label: t("payments.method_balance") },
								{ value: "other", label: t("payments.method_other") },
							],
							value: methodFilter,
							onChange: setMethodFilter,
						},
					]}
				/>
			</div>

			<DataTable
				columns={columns}
				data={data?.payments ?? []}
				total={data?.total ?? 0}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				onRowClick={(row) => navigate(`/payments/${row.id}`)}
				rowKey={(row) => row.id}
				emptyMessage={isLoading ? t("common.loading") : t("payments.no_data")}
			/>

			<ConfirmDeleteDialog
				open={deleteId !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteId(null);
				}}
				title={t("common.delete")}
				description={t("common.delete_confirm")}
				onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}