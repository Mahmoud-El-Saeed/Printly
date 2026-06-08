import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Download,
	Eye,
	FileText,
	Pencil,
	Trash2,
	UserCheck,
	UserPlus,
	Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { FilterBar } from "@/components/shared/FilterBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { DataTable } from "@/components/tables/DataTable";
import { useLanguage } from "@/contexts/LanguageContext";
import { customersApi } from "@/lib/api/customers";
import { formatDate } from "@/lib/utils/formatDate";
import { getInitials } from "@/lib/utils/getInitials";
import type { WalkInCustomerResponse } from "@/types/customer";

export default function WalkInCustomersPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["walkInCustomers", search, page],
		queryFn: () =>
			customersApi.listWalkIn({
				search: search || undefined,
				offset: (page - 1) * pageSize,
				limit: pageSize,
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => customersApi.deleteWalkIn(id),
		onSuccess: () => {
			toast.success(t("common.delete_success"));
			queryClient.invalidateQueries({ queryKey: ["walkInCustomers"] });
			setDeleteId(null);
		},
		onError: () => {
			toast.error(t("common.delete_failed"));
		},
	});

	const stats = useMemo(() => {
		const customers = data?.customers ?? [];
		const withNotes = customers.filter((c) => c.notes !== null).length;
		return { withNotes };
	}, [data]);

	const columns = [
		{
			key: "name",
			header: t("customers.name"),
			render: (row: WalkInCustomerResponse) => (
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
						{getInitials(row.name)}
					</div>
					<span className="font-semibold text-primary">{row.name}</span>
				</div>
			),
		},
		{
			key: "phone",
			header: t("customers.phone"),
			render: (row: WalkInCustomerResponse) => (
				<span className="text-on-surface-variant">{row.phone ?? "—"}</span>
			),
		},
		{
			key: "notes",
			header: t("customers.notes"),
			render: (row: WalkInCustomerResponse) => (
				<span className="text-on-surface-variant line-clamp-1 max-w-[200px] block">
					{row.notes ?? "—"}
				</span>
			),
		},
		{
			key: "created_at",
			header: t("customers.created_date"),
			render: (row: WalkInCustomerResponse) => (
				<span className="text-on-surface-variant text-xs">
					{formatDate(row.created_at, language)}
				</span>
			),
		},
		{
			key: "actions",
			header: t("common.actions"),
			render: (row: WalkInCustomerResponse) => (
				<div className="flex justify-end gap-1">
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/customers/walk-in/${row.id}`);
						}}
					>
						<Eye className="h-4 w-4" />
					</button>
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/customers/walk-in/${row.id}/edit`);
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

	const onSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
		[],
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("customers.walk_in_title")}
				subtitle={t("customers.walk_in_subtitle")}
				actionLabel={t("customers.add_customer")}
				actionIcon={UserPlus}
				onAction={() => navigate("/customers/walk-in/new")}
			/>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<StatsCard
					icon={Users}
					label={t("customers.total_customers")}
					value={String(data?.total ?? 0)}
				/>
				<StatsCard
					icon={UserCheck}
					label={t("customers.active_this_week")}
					value="0"
				/>
				<StatsCard
					icon={FileText}
					label={t("customers.total_notes")}
					value={String(stats.withNotes)}
				/>
				<StatsCard
					icon={Download}
					label={t("customers.quick_export")}
					value="—"
				/>
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-4">
				<FilterBar
					searchValue={search}
					onSearchChange={onSearchChange}
					searchPlaceholder={t("customers.search_placeholder")}
				/>
			</div>

			<DataTable
				columns={columns}
				data={data?.customers ?? []}
				total={data?.total ?? 0}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				onRowClick={(row) => navigate(`/customers/walk-in/${row.id}`)}
				rowKey={(row) => row.id}
				emptyMessage={isLoading ? t("common.loading") : t("customers.no_data")}
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
