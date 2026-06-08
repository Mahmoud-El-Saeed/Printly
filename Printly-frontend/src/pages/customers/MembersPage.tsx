import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Eye,
	Pencil,
	ShieldCheck,
	Trash2,
	UserPlus,
	Users,
	Wallet,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { FilterBar } from "@/components/shared/FilterBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { customersApi } from "@/lib/api/customers";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { getInitials } from "@/lib/utils/getInitials";
import type { CustomerMemberResponse } from "@/types/customer";

export default function MembersPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["members", search, page],
		queryFn: () =>
			customersApi.listMembers({
				search_query: search || undefined,
				offset: (page - 1) * pageSize,
				limit: pageSize,
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => customersApi.deleteMember(id),
		onSuccess: () => {
			toast.success(t("common.delete_success"));
			queryClient.invalidateQueries({ queryKey: ["members"] });
			setDeleteId(null);
		},
		onError: () => {
			toast.error(t("common.delete_failed"));
		},
	});

	const stats = useMemo(() => {
		const members = data?.members ?? [];
		const totalBalance = members.reduce((sum, m) => sum + m.balance, 0);
		const activeSubscriptions = members.filter((m) => m.is_approved).length;
		const newThisMonth = members.filter((m) => {
			const created = new Date(m.created_at);
			const now = new Date();
			return (
				created.getMonth() === now.getMonth() &&
				created.getFullYear() === now.getFullYear()
			);
		}).length;
		return { totalBalance, activeSubscriptions, newThisMonth };
	}, [data]);

	const columns = [
		{
			key: "name",
			header: t("customers.name"),
			render: (row: CustomerMemberResponse) => (
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
						{getInitials(row.name)}
					</div>
					<span className="font-semibold text-primary">{row.name}</span>
				</div>
			),
		},
		{
			key: "email",
			header: t("customers.email"),
			render: (row: CustomerMemberResponse) => (
				<span className="text-on-surface-variant">{row.email ?? "—"}</span>
			),
		},
		{
			key: "phone",
			header: t("customers.phone"),
			render: (row: CustomerMemberResponse) => (
				<span className="text-on-surface-variant">{row.phone ?? "—"}</span>
			),
		},
		{
			key: "balance",
			header: t("customers.balance"),
			render: (row: CustomerMemberResponse) => (
				<span
					className={`tabular-nums ${
						row.balance > 0
							? "text-green-600"
							: row.balance < 0
								? "text-error"
								: ""
					}`}
				>
					{formatCurrency(row.balance, language)}
				</span>
			),
		},
		{
			key: "created_at",
			header: t("customers.created_date"),
			render: (row: CustomerMemberResponse) => (
				<span className="text-on-surface-variant text-xs">
					{formatDate(row.created_at, language)}
				</span>
			),
		},
		{
			key: "actions",
			header: t("orders.actions"),
			render: (row: CustomerMemberResponse) => (
				<div className="flex justify-end gap-1">
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/customers/members/${row.id}`);
						}}
					>
						<Eye className="h-4 w-4" />
					</button>
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/customers/members/${row.id}/edit`);
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
			<div className="flex items-end justify-between">
				<PageHeader
					title={t("customers.members_title")}
					subtitle={t("customers.members_subtitle")}
				/>
				<div className="flex items-center gap-2">
					<Button variant="outline" className="gap-2">
						{t("customers.export_csv")}
					</Button>
					<Button
						className="gap-2"
						onClick={() => navigate("/customers/members/new")}
					>
						<UserPlus className="h-4 w-4" />
						{t("customers.add_member")}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<StatsCard
					icon={Users}
					label={t("customers.total_members")}
					value={String(data?.total ?? 0)}
				/>
				<StatsCard
					icon={ShieldCheck}
					label={t("customers.active_subscriptions")}
					value={String(stats.activeSubscriptions)}
				/>
				<StatsCard
					icon={Wallet}
					label={t("customers.total_balance")}
					value={formatCurrency(stats.totalBalance, language)}
				/>
				<StatsCard
					icon={UserPlus}
					label={t("customers.new_this_month")}
					value={String(stats.newThisMonth)}
				/>
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-4">
				<FilterBar
					searchValue={search}
					onSearchChange={onSearchChange}
					searchPlaceholder={t("customers.members_search")}
				/>
			</div>

			<DataTable
				columns={columns}
				data={data?.members ?? []}
				total={data?.total ?? 0}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				onRowClick={(row) => navigate(`/customers/members/${row.id}`)}
				rowKey={(row) => row.id}
				emptyMessage={
					isLoading ? t("common.loading") : t("customers.members_no_data")
				}
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
