import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CheckCircle,
	Eye,
	Layers,
	Pencil,
	Plus,
	Trash2,
	TrendingUp,
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
import { pricingApi } from "@/lib/api/pricing";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { PricingRuleResponse } from "@/types/pricing";

export default function PricingPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [componentTypeFilter, setComponentTypeFilter] = useState("");
	const [page, setPage] = useState(1);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["pricing-rules", search, componentTypeFilter, page],
		queryFn: () =>
			pricingApi.listRules({
				component_name: search || undefined,
				component_type: componentTypeFilter || undefined,
				offset: (page - 1) * pageSize,
				limit: pageSize,
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => pricingApi.deleteRule(id),
		onSuccess: () => {
			toast.success(t("common.delete_success"));
			queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
			setDeleteId(null);
		},
		onError: () => {
			toast.error(t("common.delete_failed"));
		},
	});

	const stats = useMemo(() => {
		const items = data?.items ?? [];
		const activeCount = items.filter((i) => i.is_active).length;
		const avgPrice =
			items.length > 0
				? items.reduce((sum, i) => sum + i.price, 0) / items.length
				: 0;
		const componentTypes = new Set(items.map((i) => i.component_type)).size;
		return { activeCount, avgPrice, componentTypes };
	}, [data]);

	const columns = [
		{
			key: "component_name",
			header: t("pricing.component_name"),
			render: (row: PricingRuleResponse) => (
				<span className="font-semibold text-primary">{row.component_name}</span>
			),
		},
		{
			key: "component_type",
			header: t("pricing.component_type"),
			render: (row: PricingRuleResponse) => (
				<span className="text-on-surface-variant">
					{t(`pricing.type_${row.component_type}`)}
				</span>
			),
		},
		{
			key: "price",
			header: t("pricing.price"),
			render: (row: PricingRuleResponse) => (
				<span className="tabular-nums">
					{formatCurrency(row.price, language)}
				</span>
			),
		},
		{
			key: "unit_type",
			header: t("pricing.unit"),
			render: (row: PricingRuleResponse) => (
				<span className="text-on-surface-variant">
					{t(`pricing.unit_${row.unit_type}`)}
				</span>
			),
		},
		{
			key: "description",
			header: t("pricing.description"),
			render: (row: PricingRuleResponse) => (
				<span className="line-clamp-1 max-w-[200px]">
					{row.description ?? "—"}
				</span>
			),
		},
		{
			key: "status",
			header: t("pricing.status"),
			render: (row: PricingRuleResponse) => (
				<span
					className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
						row.is_active
							? "bg-green-100 text-green-800"
							: "bg-gray-100 text-gray-600"
					}`}
				>
					{row.is_active ? t("pricing.active") : t("pricing.inactive")}
				</span>
			),
		},
		{
			key: "actions",
			header: t("pricing.actions"),
			render: (row: PricingRuleResponse) => (
				<div className="flex justify-end gap-1">
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/pricing/${row.id}`);
						}}
					>
						<Eye className="h-4 w-4" />
					</button>
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/pricing/${row.id}/edit`);
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
				title={t("pricing.title")}
				subtitle={t("pricing.subtitle")}
				actionLabel={t("pricing.add_rule")}
				actionIcon={Plus}
				onAction={() => navigate("/pricing/new")}
			/>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<StatsCard
					icon={Layers}
					label={t("pricing.total_rules")}
					value={String(data?.total ?? 0)}
				/>
				<StatsCard
					icon={CheckCircle}
					label={t("pricing.active_rules")}
					value={String(stats.activeCount)}
					changeColor="text-primary"
				/>
				<StatsCard
					icon={TrendingUp}
					label={t("pricing.avg_price")}
					value={formatCurrency(stats.avgPrice, language)}
				/>
				<StatsCard
					icon={Layers}
					label={t("pricing.component_types")}
					value={String(stats.componentTypes)}
				/>
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-4">
				<FilterBar
					searchValue={search}
					onSearchChange={onSearchChange}
					searchPlaceholder={t("pricing.search_placeholder")}
					filters={[
						{
							key: "component_type",
							placeholder: t("pricing.all_types"),
							options: [
								{
									value: "page_print",
									label: t("pricing.type_page_print"),
								},
								{ value: "cover", label: t("pricing.type_cover") },
								{ value: "binding", label: t("pricing.type_binding") },
								{
									value: "lamination",
									label: t("pricing.type_lamination"),
								},
								{
									value: "extra_service",
									label: t("pricing.type_extra_service"),
								},
							],
							value: componentTypeFilter,
							onChange: setComponentTypeFilter,
						},
					]}
				/>
			</div>

			<DataTable
				columns={columns}
				data={data?.items ?? []}
				total={data?.total ?? 0}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				onRowClick={(row) => navigate(`/pricing/${row.id}`)}
				rowKey={(row) => row.id}
				emptyMessage={isLoading ? t("common.loading") : t("pricing.no_data")}
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