import { useQuery } from "@tanstack/react-query";
import {
	Calendar,
	Eye,
	Pencil,
	Plus,
	Receipt,
	Trash2,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilterBar } from "@/components/shared/FilterBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { DataTable } from "@/components/tables/DataTable";
import { useLanguage } from "@/contexts/LanguageContext";
import { expensesApi } from "@/lib/api/expenses";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { ExpenseCategory, ExpenseResponse } from "@/types/expense";

export default function ExpensesPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const [categoryFilter, setCategoryFilter] = useState("");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["expenses", categoryFilter, page],
		queryFn: () =>
			expensesApi.list({
				category: (categoryFilter || undefined) as ExpenseCategory | undefined,
				offset: (page - 1) * pageSize,
				limit: pageSize,
			}),
	});

	const items = data?.expenses ?? [];

	const stats = useMemo(() => {
		const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
		const now = new Date();
		const thisMonthItems = items.filter((i) => {
			const d = new Date(i.created_at);
			return (
				d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
			);
		});
		const thisMonthAmount = thisMonthItems.reduce(
			(sum, i) => sum + i.amount,
			0,
		);
		const categoryTotals: Record<string, number> = {};
		for (const i of items) {
			categoryTotals[i.category] = (categoryTotals[i.category] ?? 0) + i.amount;
		}
		const topCategory =
			Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
		return { totalAmount, thisMonthAmount, topCategory };
	}, [items]);

	const columns = [
		{
			key: "category",
			header: t("expenses.category"),
			render: (row: ExpenseResponse) => (
				<span className="font-semibold text-primary">
					{t(`expenses.cat_${row.category}`)}
				</span>
			),
		},
		{
			key: "amount",
			header: t("expenses.amount"),
			render: (row: ExpenseResponse) => (
				<span className="tabular-nums text-error">
					{formatCurrency(row.amount, language)}
				</span>
			),
		},
		{
			key: "description",
			header: t("expenses.description"),
			render: (row: ExpenseResponse) => (
				<span className="line-clamp-1 max-w-[200px]">
					{row.description ?? "—"}
				</span>
			),
		},
		{
			key: "expense_date",
			header: t("expenses.date"),
			render: (row: ExpenseResponse) => (
				<span className="text-on-surface-variant">
					{formatDate(row.expense_date, language)}
				</span>
			),
		},
		{
			key: "created_by",
			header: t("expenses.created_by"),
			render: (row: ExpenseResponse) => (
				<span className="text-on-surface-variant">{row.created_by ?? "—"}</span>
			),
		},
		{
			key: "actions",
			header: t("expenses.actions"),
			render: (row: ExpenseResponse) => (
				<div className="flex justify-end gap-1">
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={() => navigate(`/expenses/${row.id}`)}
					>
						<Eye className="h-4 w-4" />
					</button>
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={() => navigate(`/expenses/${row.id}/edit`)}
					>
						<Pencil className="h-4 w-4" />
					</button>
					<button
						type="button"
						className="p-1.5 rounded-md hover:bg-error-container text-error transition-colors"
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
				title={t("expenses.title")}
				subtitle={t("expenses.subtitle")}
				actionLabel={t("expenses.add_expense")}
				actionIcon={Plus}
				onAction={() => navigate("/expenses/new")}
			/>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<StatsCard
					icon={Receipt}
					label={t("expenses.total_expenses")}
					value={String(data?.total ?? 0)}
				/>
				<StatsCard
					icon={Wallet}
					label={t("expenses.total_amount")}
					value={formatCurrency(stats.totalAmount, language)}
					changeColor="text-error"
				/>
				<StatsCard
					icon={Calendar}
					label={t("expenses.this_month")}
					value={formatCurrency(stats.thisMonthAmount, language)}
					changeColor="text-error"
				/>
				<StatsCard
					icon={TrendingUp}
					label={t("expenses.top_category")}
					value={
						stats.topCategory ? t(`expenses.cat_${stats.topCategory}`) : "—"
					}
				/>
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-4">
				<FilterBar
					searchValue={search}
					onSearchChange={onSearchChange}
					searchPlaceholder={t("expenses.all_categories")}
					filters={[
						{
							key: "category",
							placeholder: t("expenses.all_categories"),
							options: [
								{ value: "rent", label: t("expenses.cat_rent") },
								{ value: "salaries", label: t("expenses.cat_salaries") },
								{ value: "maintenance", label: t("expenses.cat_maintenance") },
								{ value: "utilities", label: t("expenses.cat_utilities") },
								{ value: "supplies", label: t("expenses.cat_supplies") },
								{ value: "other", label: t("expenses.cat_other") },
							],
							value: categoryFilter,
							onChange: (v) => setCategoryFilter(v as ExpenseCategory | ""),
						},
					]}
				/>
			</div>

			<DataTable
				columns={columns}
				data={items}
				total={data?.total ?? 0}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				onRowClick={(row) => navigate(`/expenses/${row.id}`)}
				rowKey={(row) => row.id}
				emptyMessage={isLoading ? t("common.loading") : t("expenses.no_data")}
			/>
		</div>
	);
}
