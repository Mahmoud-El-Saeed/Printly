import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CheckCircle,
	Clock,
	Link2,
	Timer,
	Trash2,
	TrendingUp,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { customersApi } from "@/lib/api/customers";
import { formatDate } from "@/lib/utils/formatDate";
import type { CustomerLinkResponse } from "@/types/customer";

export default function LinkRequestsPage() {
	const { t, language } = useLanguage();
	const [page, setPage] = useState(1);
	const pageSize = 10;
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ["link-requests", page],
		queryFn: () =>
			customersApi.getPendingLinks({
				offset: (page - 1) * pageSize,
				limit: pageSize,
			}),
	});

	const approveMutation = useMutation({
		mutationFn: (params: {
			linkId: string;
			customerUserId: string;
			approve: boolean;
		}) =>
			customersApi.approveOrRejectLink(params.linkId, {
				customer_user_id: params.customerUserId,
				approve: params.approve,
			}),
		onSuccess: () => {
			toast.success(t("customers.action_success"));
			queryClient.invalidateQueries({ queryKey: ["link-requests"] });
		},
	});

	const stats = useMemo(() => {
		const links = data?.links ?? [];
		const pendingCount = links.filter((l) => l.status === "pending").length;
		const approvedCount = links.filter((l) => l.status === "approved").length;
		const totalDecided =
			approvedCount + links.filter((l) => l.status === "rejected").length;
		const approvalRate =
			totalDecided > 0
				? `${Math.round((approvedCount / totalDecided) * 100)}%`
				: "—";
		return { pendingCount, approvalRate };
	}, [data]);

	const columns = [
		{
			key: "customer_name",
			header: t("customers.name"),
			render: (row: CustomerLinkResponse) => (
				<span className="font-semibold text-primary">{row.customer_name}</span>
			),
		},
		{
			key: "customer_email",
			header: t("customers.email"),
			render: (row: CustomerLinkResponse) => (
				<span className="text-on-surface-variant">
					{row.customer_email ?? "—"}
				</span>
			),
		},
		{
			key: "status",
			header: t("orders.status"),
			render: (row: CustomerLinkResponse) => (
				<span
					className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
						row.status === "pending"
							? "bg-yellow-100 text-yellow-800"
							: row.status === "approved"
								? "bg-green-100 text-green-800"
								: "bg-red-100 text-red-800"
					}`}
				>
					{t(`customers.status_${row.status}`)}
				</span>
			),
		},
		{
			key: "requested_at",
			header: t("customers.requested_date"),
			render: (row: CustomerLinkResponse) => (
				<span className="text-on-surface-variant text-xs">
					{formatDate(row.requested_at, language)}
				</span>
			),
		},
		{
			key: "approved_at",
			header: t("customers.approved_date"),
			render: (row: CustomerLinkResponse) => (
				<span className="text-on-surface-variant text-xs">
					{row.approved_at ? formatDate(row.approved_at, language) : "—"}
				</span>
			),
		},
		{
			key: "actions",
			header: t("orders.actions"),
			render: (row: CustomerLinkResponse) => (
				<div className="flex justify-end gap-1">
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-green-100 text-green-700 transition-colors disabled:opacity-50"
						disabled={approveMutation.isPending}
						onClick={() =>
							approveMutation.mutate({
								linkId: row.id,
								customerUserId: row.customer_user_id,
								approve: true,
							})
						}
					>
						<CheckCircle className="h-4 w-4" />
					</button>
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-red-100 text-red-700 transition-colors disabled:opacity-50"
						disabled={approveMutation.isPending}
						onClick={() =>
							approveMutation.mutate({
								linkId: row.id,
								customerUserId: row.customer_user_id,
								approve: false,
							})
						}
					>
						<XCircle className="h-4 w-4" />
					</button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-end justify-between">
				<PageHeader
					title={t("customers.link_requests_title")}
					subtitle={t("customers.link_requests_subtitle")}
				/>
				<div className="flex items-center gap-2">
					<Button variant="outline" className="gap-2">
						{t("customers.filter")}
					</Button>
					<Button variant="outline" className="gap-2">
						<Trash2 className="h-4 w-4" />
						{t("customers.clear_logs")}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<StatsCard
					icon={Link2}
					label={t("customers.total_requests")}
					value={String(data?.total ?? 0)}
				/>
				<StatsCard
					icon={Clock}
					label={t("customers.pending_approval")}
					value={String(stats.pendingCount)}
				/>
				<StatsCard
					icon={TrendingUp}
					label={t("customers.approval_rate")}
					value={stats.approvalRate}
				/>
				<StatsCard
					icon={Timer}
					label={t("customers.avg_response_time")}
					value="—"
				/>
			</div>

			<DataTable
				columns={columns}
				data={data?.links ?? []}
				total={data?.total ?? 0}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				rowKey={(row) => row.id}
				emptyMessage={
					isLoading ? t("common.loading") : t("customers.link_no_data")
				}
			/>
		</div>
	);
}
