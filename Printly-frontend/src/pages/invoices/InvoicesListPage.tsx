import { useQuery } from "@tanstack/react-query";
import { Eye, FileText } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { DataTable } from "@/components/tables/DataTable";
import { useLanguage } from "@/contexts/LanguageContext";
import { invoicesApi } from "@/lib/api/invoices";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { InvoiceResponse } from "@/types/invoice";

export default function InvoicesListPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["invoices", page],
		queryFn: () =>
			invoicesApi.list({
				offset: (page - 1) * pageSize,
				limit: pageSize,
			}),
	});

	const columns = [
		{
			key: "invoice_number",
			header: t("invoices.invoice_number"),
			render: (row: InvoiceResponse) => (
				<span className="font-semibold text-primary">{row.invoice_number}</span>
			),
		},
		{
			key: "customer_name",
			header: t("invoices.customer"),
			render: (row: InvoiceResponse) => <span>{row.customer_name ?? "—"}</span>,
		},
		{
			key: "total_amount",
			header: t("invoices.total_amount"),
			render: (row: InvoiceResponse) => (
				<span className="tabular-nums">
					{formatCurrency(row.total_amount, language)}
				</span>
			),
		},
		{
			key: "paid_amount",
			header: t("invoices.paid_amount"),
			render: (row: InvoiceResponse) => (
				<span className="tabular-nums">
					{formatCurrency(row.paid_amount, language)}
				</span>
			),
		},
		{
			key: "created_at",
			header: t("invoices.created"),
			render: (row: InvoiceResponse) => (
				<span className="text-on-surface-variant">
					{formatDate(row.created_at, language)}
				</span>
			),
		},
		{
			key: "actions",
			header: "",
			render: (row: InvoiceResponse) => (
				<div className="flex justify-end gap-1">
					<button
						type="button"
						aria-label="View"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/invoices/${row.id}`);
						}}
					>
						<Eye className="h-4 w-4" />
					</button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("invoices.title")}
				subtitle={t("invoices.subtitle")}
			/>

			<div className="grid grid-cols-2 gap-4">
				<StatsCard
					icon={FileText}
					label={t("invoices.title")}
					value={String(data?.total ?? 0)}
				/>
				<StatsCard
					icon={FileText}
					label={t("common.on_this_page")}
					value={String((data?.items ?? []).length)}
				/>
			</div>

			<DataTable
				columns={columns}
				data={data?.items ?? []}
				total={data?.total ?? 0}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				onRowClick={(row) => navigate(`/invoices/${row.id}`)}
				rowKey={(row) => row.id}
				emptyMessage={isLoading ? t("common.loading") : t("invoices.no_data")}
			/>
		</div>
	);
}
