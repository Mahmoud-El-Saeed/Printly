import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	Eye,
	Package,
	PackagePlus,
	Pencil,
	Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { FilterBar } from "@/components/shared/FilterBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { DataTable } from "@/components/tables/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { materialsApi } from "@/lib/api/materials";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { MaterialResponse } from "@/types/material";

export default function MaterialsPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["materials", search, page],
		queryFn: () =>
			materialsApi.list({
				name: search || undefined,
				offset: (page - 1) * pageSize,
				limit: pageSize,
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => materialsApi.delete(id),
		onSuccess: () => {
			toast.success(t("common.delete_success"));
			queryClient.invalidateQueries({ queryKey: ["materials"] });
			setDeleteId(null);
		},
		onError: () => {
			toast.error(t("common.delete_failed"));
		},
	});

	const columns = [
		{
			key: "name",
			header: t("materials.name"),
			render: (row: MaterialResponse) => (
				<span className="font-semibold text-primary">{row.name}</span>
			),
		},
		{
			key: "unit",
			header: t("materials.unit"),
			render: (row: MaterialResponse) => (
				<span className="text-on-surface-variant">{row.unit}</span>
			),
		},
		{
			key: "current_stock",
			header: t("materials.current_stock"),
			render: (row: MaterialResponse) =>
				row.current_stock <= row.min_stock_alert ? (
					<span className="inline-flex items-center gap-1 text-error tabular-nums">
						{row.current_stock}
						<AlertTriangle className="h-3.5 w-3.5" />
					</span>
				) : (
					<span className="tabular-nums">{row.current_stock}</span>
				),
		},
		{
			key: "cost_per_unit",
			header: t("materials.cost_per_unit"),
			render: (row: MaterialResponse) => (
				<span className="tabular-nums">
					{formatCurrency(row.cost_per_unit, language)}
				</span>
			),
		},
		{
			key: "price_per_unit",
			header: t("materials.price_per_unit"),
			render: (row: MaterialResponse) => (
				<span className="tabular-nums text-primary font-semibold">
					{formatCurrency(row.price_per_unit, language)}
				</span>
			),
		},
		{
			key: "min_stock_alert",
			header: t("materials.min_alert"),
			render: (row: MaterialResponse) => (
				<span className="tabular-nums">{row.min_stock_alert}</span>
			),
		},
		{
			key: "status",
			header: t("materials.status"),
			render: (row: MaterialResponse) => (
				<span
					className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
						row.is_active
							? "bg-green-100 text-green-800"
							: "bg-gray-100 text-gray-600"
					}`}
				>
					{row.is_active ? t("materials.active") : t("materials.inactive")}
				</span>
			),
		},
		{
			key: "actions",
			header: t("materials.actions"),
			render: (row: MaterialResponse) => (
				<div className="flex justify-end gap-1">
					<button
						type="button"
						aria-label="View"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/materials/${row.id}`);
						}}
					>
						<Eye className="h-4 w-4" />
					</button>
					<button
						type="button"
						aria-label="Edit"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/materials/${row.id}/edit`);
						}}
					>
						<Pencil className="h-4 w-4" />
					</button>
					<button
						type="button"
						aria-label="Delete"
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

	if (isLoading) {
		return (
			<div className="space-y-4" role="status" aria-label="Loading materials">
				<Skeleton className="h-8 w-48" />
				<div className="space-y-3">
					{Array.from({ length: 5 }, (_, i) => `skel-${i}`).map((key) => (
						<Skeleton key={key} className="h-16 w-full rounded-lg" />
					))}
				</div>
				<span className="sr-only">Loading...</span>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("materials.title")}
				subtitle={t("materials.subtitle")}
				actionLabel={t("materials.add_material")}
				actionIcon={PackagePlus}
				onAction={() => navigate("/materials/new")}
			/>

			<div className="grid grid-cols-2 gap-4">
				<StatsCard
					icon={Package}
					label={t("materials.total_materials")}
					value={String(data?.total ?? 0)}
				/>
				<StatsCard
					icon={Package}
					label={t("common.on_this_page")}
					value={String((data?.items ?? []).length)}
				/>
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-4">
				<FilterBar
					searchValue={search}
					onSearchChange={onSearchChange}
					searchPlaceholder={t("materials.search_placeholder")}
				/>
			</div>

			<DataTable
				columns={columns}
				data={data?.items ?? []}
				total={data?.total ?? 0}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				onRowClick={(row) => navigate(`/materials/${row.id}`)}
				rowKey={(row) => row.id}
				emptyMessage={isLoading ? t("common.loading") : t("materials.no_data")}
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
