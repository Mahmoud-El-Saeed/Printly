import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AddTransactionDialog } from "@/components/materials/AddTransactionDialog";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { materialsApi } from "@/lib/api/materials";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { TransactionResponse } from "@/types/material";

export default function MaterialDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const materialId = id ?? "";
	const queryClient = useQueryClient();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [transactionOpen, setTransactionOpen] = useState(false);

	const {
		data: material,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["material", materialId],
		queryFn: () => materialsApi.get(materialId),
		enabled: !!materialId,
	});

	const { data: transactionsData, isError: transactionsError } = useQuery({
		queryKey: ["material-transactions", materialId],
		queryFn: () => materialsApi.listTransactions(materialId, { limit: 50 }),
		enabled: !!materialId,
	});

	const deleteMutation = useMutation({
		mutationFn: () => materialsApi.delete(materialId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["materials"] });
			navigate("/materials");
		},
	});

	if (isError || transactionsError) {
		return (
			<div className="max-w-7xl mx-auto space-y-6">
				<Link to="/materials">
					<Button variant="ghost" size="sm" className="gap-2">
						<ArrowLeft className="h-4 w-4" />
						{t("common.back")}
					</Button>
				</Link>
				<div className="flex items-center justify-center py-12 text-error">
					{t("common.error")}
				</div>
			</div>
		);
	}

	if (isLoading || !material) {
		return (
			<div className="max-w-7xl mx-auto space-y-6">
				<Link to="/materials">
					<Button variant="ghost" size="sm" className="gap-2">
						<ArrowLeft className="h-4 w-4" />
						{t("common.back")}
					</Button>
				</Link>
				<div className="flex items-center justify-center py-12">
					<div className="text-on-surface-variant">{t("common.loading")}</div>
				</div>
			</div>
		);
	}

	const isLowStock = material.current_stock <= material.min_stock_alert;

	const transactionColumns = [
		{
			key: "transaction_type",
			header: t("materials.type"),
			render: (row: TransactionResponse) => {
				const colorMap: Record<string, string> = {
					restock: "bg-green-100 text-green-800",
					consumption: "bg-red-100 text-red-800",
					adjustment: "bg-blue-100 text-blue-800",
					return: "bg-yellow-100 text-yellow-800",
				};
				return (
					<span
						className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[row.transaction_type] ?? "bg-gray-100 text-gray-600"}`}
					>
						{t(`material_transaction.${row.transaction_type}`)}
					</span>
				);
			},
		},
		{
			key: "quantity",
			header: t("materials.quantity"),
			render: (row: TransactionResponse) => (
				<span className="tabular-nums">{row.quantity}</span>
			),
		},
		{
			key: "notes",
			header: t("materials.transaction_notes"),
			render: (row: TransactionResponse) => (
				<span className="text-on-surface-variant">{row.notes ?? "—"}</span>
			),
		},
		{
			key: "created_at",
			header: t("materials.created_at"),
			render: (row: TransactionResponse) => (
				<span className="text-on-surface-variant text-xs">
					{new Date(row.created_at).toLocaleDateString(
						language === "ar" ? "ar-EG" : "en-GB",
					)}
				</span>
			),
		},
	];

	return (
		<div className="max-w-7xl mx-auto space-y-6">
			<div className="flex items-center justify-between">
				<Link to="/materials">
					<Button variant="ghost" size="sm" className="gap-2">
						<ArrowLeft className="h-4 w-4" />
						{t("common.back")}
					</Button>
				</Link>
			</div>

			<div className="text-2xl font-bold text-on-surface">
				{t("materials.detail_title")}
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
				<div className="bg-surface-container px-6 py-3 border-b border-outline-variant flex items-center justify-between">
					<span className="text-sm font-bold text-on-surface">
						{t("materials.material_info")}
					</span>
					<div className="flex gap-2">
						<Button
							variant="ghost"
							size="sm"
							className="gap-2"
							onClick={() => navigate(`/materials/${id}/edit`)}
						>
							<Pencil className="h-4 w-4" />
							{t("common.edit")}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="gap-2 text-destructive hover:text-destructive"
							onClick={() => setDeleteOpen(true)}
						>
							<Trash2 className="h-4 w-4" />
							{t("common.delete")}
						</Button>
					</div>
				</div>
				<div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("materials.name")}
						</span>
						<span className="text-sm text-on-surface">{material.name}</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("materials.unit")}
						</span>
						<span className="text-sm text-on-surface">{material.unit}</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("materials.current_stock")}
						</span>
						{isLowStock ? (
							<span className="text-sm inline-flex items-center gap-1 text-error tabular-nums">
								{material.current_stock}
								<AlertTriangle className="h-3.5 w-3.5" />
								<span className="text-xs">
									({t("materials.low_stock_warning")})
								</span>
							</span>
						) : (
							<span className="text-sm text-on-surface tabular-nums">
								{material.current_stock}
							</span>
						)}
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("materials.min_alert")}
						</span>
						<span className="text-sm text-on-surface tabular-nums">
							{material.min_stock_alert}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("materials.cost_per_unit")}
						</span>
						<span className="text-sm text-on-surface tabular-nums">
							{formatCurrency(material.cost_per_unit, language)}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("materials.status")}
						</span>
						<span
							className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
								material.is_active
									? "bg-green-100 text-green-800"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{material.is_active
								? t("materials.active")
								: t("materials.inactive")}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("materials.created_at")}
						</span>
						<span className="text-sm text-on-surface">
							{new Date(material.created_at).toLocaleDateString(
								language === "ar" ? "ar-EG" : "en-GB",
							)}
						</span>
					</div>
				</div>
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
				<div className="bg-surface-container px-6 py-3 border-b border-outline-variant flex items-center justify-between">
					<span className="text-sm font-bold text-on-surface">
						{t("materials.transactions")}
					</span>
					<Button
						variant="outline"
						size="sm"
						className="gap-2"
						onClick={() => setTransactionOpen(true)}
					>
						<Plus className="h-4 w-4" />
						{t("materials.add_transaction")}
					</Button>
				</div>
				<div className="px-4 py-4">
					<DataTable
						columns={transactionColumns}
						data={transactionsData?.items ?? []}
						total={transactionsData?.total ?? 0}
						page={1}
						pageSize={50}
						onPageChange={() => {}}
						rowKey={(row) => row.id}
						emptyMessage={t("common.no_data")}
					/>
				</div>
			</div>

			<ConfirmDeleteDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title={t("common.delete")}
				description={t("common.delete_confirm")}
				onConfirm={() => deleteMutation.mutate()}
				isLoading={deleteMutation.isPending}
			/>

			<AddTransactionDialog
				materialId={materialId}
				open={transactionOpen}
				onOpenChange={setTransactionOpen}
			/>
		</div>
	);
}
