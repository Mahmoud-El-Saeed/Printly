import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import {
	Bar,
	BarChart,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { dashboardApi } from "@/lib/api/dashboard";
import { formatCurrency, formatNumber } from "@/lib/utils/formatCurrency";

const STATUS_COLORS: Record<string, string> = {
	new: "#3b82f6",
	printing: "#eab308",
	ready: "#22c55e",
	delivered: "#6b7280",
	cancelled: "#ef4444",
};

export default function DashboardPage() {
	const { t, language } = useLanguage();

	const {
		data: overview,
		isLoading: overviewLoading,
		isError: overviewError,
	} = useQuery({
		queryKey: ["dashboard-overview"],
		queryFn: dashboardApi.getOverview,
	});

	const stats = [
		{
			icon: TrendingUp,
			label: t("dashboard.total_revenue"),
			value: overviewLoading
				? "—"
				: formatCurrency(overview?.revenue?.this_month ?? 0, language),
			change: overview
				? `${formatNumber(overview.revenue.comparison.last_month_vs_this_month_percent, language)}%`
				: undefined,
			changeColor: "text-emerald-500",
		},
		{
			icon: TrendingDown,
			label: t("dashboard.total_expenses"),
			value: overviewLoading
				? "—"
				: formatCurrency(overview?.expenses?.this_month ?? 0, language),
			changeColor: "text-red-500",
		},
		{
			icon: Wallet,
			label: t("dashboard.net_profit"),
			value: overviewLoading
				? "—"
				: formatCurrency(overview?.profit?.this_month ?? 0, language),
			changeColor: "text-blue-500",
		},
		{
			icon: ShoppingCart,
			label: t("dashboard.total_orders"),
			value: overviewLoading
				? "—"
				: formatNumber(overview?.orders?.total ?? 0, language),
			changeColor: "text-violet-500",
		},
	];

	const revenueExpenseData = overview
		? [
				{
					name: t("dashboard.total_revenue"),
					value: overview.revenue.this_month,
					fill: "#6750a4",
				},
				{
					name: t("dashboard.total_expenses"),
					value: overview.expenses.this_month,
					fill: "#7a7582",
				},
			]
		: [];

	const ordersStatusData = overview?.orders?.by_status
		? Object.entries(overview.orders.by_status).map(([status, count]) => ({
				name: t(`status.${status}`),
				value: count,
				color: STATUS_COLORS[status] || "#6b7280",
			}))
		: [];

	if (overviewError) {
		return (
			<div className="flex items-center justify-center py-12 text-error">
				{t("common.error")}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("dashboard.title")}
				subtitle={t("dashboard.welcome")}
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{stats.map((stat) => (
					<StatsCard key={stat.label} {...stat} />
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div className="bg-background border border-border rounded-xl overflow-hidden">
					<div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
						<h3 className="font-bold text-sm">
							{t("dashboard.revenue_expenses_chart")}
						</h3>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-1.5">
								<span className="w-3 h-3 rounded-full bg-primary" />
								<span className="text-xs font-medium">
									{t("dashboard.total_revenue")}
								</span>
							</div>
							<div className="flex items-center gap-1.5">
								<span className="w-3 h-3 rounded-full bg-muted-foreground" />
								<span className="text-xs font-medium">
									{t("dashboard.total_expenses")}
								</span>
							</div>
						</div>
					</div>
					<div className="p-6">
						{overviewLoading ? (
							<div className="h-[300px] flex items-center justify-center text-muted-foreground">
								{t("common.loading")}
							</div>
						) : revenueExpenseData.length > 0 ? (
							<div dir={language === "ar" ? "rtl" : "ltr"}>
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={revenueExpenseData}>
										<XAxis
											dataKey="name"
											tick={{ fontSize: 12 }}
											axisLine={false}
											tickLine={false}
										/>
										<YAxis
											tick={{ fontSize: 12 }}
											axisLine={false}
											tickLine={false}
											tickFormatter={(v) =>
												formatCurrency(v, language).replace("EGP", "").trim()
											}
										/>
										<Tooltip
											formatter={(v) =>
												formatCurrency(Number(v ?? 0), language)
											}
										/>
										<Bar dataKey="value" radius={[4, 4, 0, 0]}>
											{revenueExpenseData.map((entry) => (
												<Cell key={entry.name} fill={entry.fill} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>
						) : (
							<div className="h-[300px] flex items-center justify-center text-muted-foreground">
								{t("common.no_data")}
							</div>
						)}
					</div>
				</div>

				<div className="bg-background border border-border rounded-xl overflow-hidden">
					<div className="p-5 border-b border-border bg-muted/30">
						<h3 className="font-bold text-sm">
							{t("dashboard.orders_status_chart")}
						</h3>
					</div>
					<div className="p-6">
						{overviewLoading ? (
							<div className="h-[300px] flex items-center justify-center text-muted-foreground">
								{t("common.loading")}
							</div>
						) : ordersStatusData.length > 0 ? (
							<div dir={language === "ar" ? "rtl" : "ltr"}>
								<ResponsiveContainer width="100%" height={300}>
									<PieChart>
										<Pie
											data={ordersStatusData}
											cx="50%"
											cy="50%"
											innerRadius={60}
											outerRadius={100}
											paddingAngle={2}
											dataKey="value"
										>
											{ordersStatusData.map((entry) => (
												<Cell key={entry.name} fill={entry.color} />
											))}
										</Pie>
										<Tooltip
											formatter={(v) => formatNumber(Number(v ?? 0), language)}
										/>
										<Legend
											verticalAlign="bottom"
											height={36}
											iconType="circle"
											iconSize={10}
										/>
									</PieChart>
								</ResponsiveContainer>
							</div>
						) : (
							<div className="h-[300px] flex items-center justify-center text-muted-foreground">
								{t("common.no_data")}
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div className="bg-background border border-border rounded-xl overflow-hidden">
					<div className="p-5 border-b border-border bg-muted/30">
						<h3 className="font-bold text-sm">
							{t("dashboard.top_materials")}
						</h3>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-start border-collapse">
							<thead>
								<tr className="bg-muted/50 text-muted-foreground">
									<th className="px-6 py-4 font-medium text-sm border-b border-border">
										{t("materials.name")}
									</th>
									<th className="px-6 py-4 font-medium text-sm border-b border-border">
										{t("materials.quantity")}
									</th>
									<th className="px-6 py-4 font-medium text-sm border-b border-border">
										{t("dashboard.total_cost")}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{!overview?.top_materials ||
								overview.top_materials.materials.length === 0 ? (
									<tr>
										<td
											colSpan={3}
											className="px-6 py-8 text-center text-muted-foreground"
										>
											{t("common.no_data")}
										</td>
									</tr>
								) : (
									overview.top_materials.materials.map((m) => (
										<tr key={m.material_id} className="hover:bg-muted/30">
											<td className="px-6 py-4 text-sm">{m.material_name}</td>
											<td className="px-6 py-4 text-sm tabular-nums">
												{formatNumber(m.total_quantity_used, language)}
											</td>
											<td className="px-6 py-4 text-sm tabular-nums">
												{formatCurrency(m.total_cost, language)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				<div className="bg-background border border-border rounded-xl overflow-hidden">
					<div className="p-5 border-b border-border bg-muted/30">
						<h3 className="font-bold text-sm">
							{t("dashboard.top_customers")}
						</h3>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-start border-collapse">
							<thead>
								<tr className="bg-muted/50 text-muted-foreground">
									<th className="px-6 py-4 font-medium text-sm border-b border-border">
										{t("customers.name")}
									</th>
									<th className="px-6 py-4 font-medium text-sm border-b border-border">
										{t("customers.total_spent")}
									</th>
									<th className="px-6 py-4 font-medium text-sm border-b border-border">
										{t("dashboard.total_orders")}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{!overview?.top_customers ||
								overview.top_customers.customers.length === 0 ? (
									<tr>
										<td
											colSpan={3}
											className="px-6 py-8 text-center text-muted-foreground"
										>
											{t("common.no_data")}
										</td>
									</tr>
								) : (
									overview.top_customers.customers.map((c) => (
										<tr key={c.customer_id} className="hover:bg-muted/30">
											<td className="px-6 py-4 text-sm">{c.customer_name}</td>
											<td className="px-6 py-4 text-sm tabular-nums">
												{formatCurrency(c.total_spent, language)}
											</td>
											<td className="px-6 py-4 text-sm tabular-nums">
												{formatNumber(c.total_orders, language)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
