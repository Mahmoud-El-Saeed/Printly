import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import { dashboardApi } from "@/lib/api/dashboard";
import { ordersApi } from "@/lib/api/orders";
import { formatCurrency, formatNumber } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

export default function DashboardPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();

	const { data: overview, isLoading: overviewLoading } = useQuery({
		queryKey: ["dashboard-overview"],
		queryFn: dashboardApi.getOverview,
	});

	const { data: recentOrders } = useQuery({
		queryKey: ["recent-orders"],
		queryFn: () => ordersApi.list({ limit: 5 }),
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
			change: overview ? "+4%" : undefined,
			changeColor: "text-red-500",
		},
		{
			icon: Wallet,
			label: t("dashboard.net_profit"),
			value: overviewLoading
				? "—"
				: formatCurrency(overview?.profit?.this_month ?? 0, language),
			change: overview ? "+18%" : undefined,
			changeColor: "text-blue-500",
		},
		{
			icon: ShoppingCart,
			label: t("dashboard.total_orders"),
			value: overviewLoading
				? "—"
				: formatNumber(overview?.orders?.total ?? 0, language),
			change: overview ? "+7%" : undefined,
			changeColor: "text-violet-500",
		},
	];

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

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<div className="lg:col-span-2 bg-background border border-border rounded-xl overflow-hidden">
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
								<span className="w-3 h-3 rounded-full bg-muted" />
								<span className="text-xs font-medium">
									{t("dashboard.total_expenses")}
								</span>
							</div>
						</div>
					</div>
					<div className="p-6 h-[300px] flex items-center justify-center text-muted-foreground">
						{t("common.coming_soon")} — Phase 4
					</div>
				</div>

				<div className="bg-background border border-border rounded-xl overflow-hidden">
					<div className="p-5 border-b border-border bg-muted/30">
						<h3 className="font-bold text-sm">
							{t("dashboard.orders_status_chart")}
						</h3>
					</div>
					<div className="p-6 flex flex-col items-center justify-center">
						{overviewLoading ? (
							<div className="text-muted-foreground">Loading...</div>
						) : overview?.orders?.by_status ? (
							<div className="w-full space-y-3">
								{Object.entries(overview.orders.by_status).map(
									([status, count]) => (
										<div
											key={status}
											className="flex items-center justify-between"
										>
											<div className="flex items-center gap-2">
												<StatusBadge status={status} />
											</div>
											<span className="text-sm font-semibold tabular-nums">
												{formatNumber(count, language)}
											</span>
										</div>
									),
								)}
							</div>
						) : (
							<div className="text-muted-foreground">{t("common.no_data")}</div>
						)}
					</div>
				</div>
			</div>

			<div className="bg-background border border-border rounded-xl overflow-hidden">
				<div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
					<h3 className="font-bold text-sm">{t("orders.title")}</h3>
					<button
						type="button"
						className="text-primary text-xs font-bold hover:underline cursor-pointer"
						onClick={() => navigate("/orders")}
					>
						{t("orders.view")}
					</button>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-muted/50 text-muted-foreground">
								<th className="px-6 py-4 font-medium text-sm border-b border-border">
									{t("orders.order_number")}
								</th>
								<th className="px-6 py-4 font-medium text-sm border-b border-border">
									{t("orders.customer")}
								</th>
								<th className="px-6 py-4 font-medium text-sm border-b border-border">
									{t("orders.status")}
								</th>
								<th className="px-6 py-4 font-medium text-sm border-b border-border">
									{t("orders.total")}
								</th>
								<th className="px-6 py-4 font-medium text-sm border-b border-border">
									{t("orders.created")}
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{recentOrders?.orders?.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="px-6 py-8 text-center text-muted-foreground"
									>
										{t("common.no_data")}
									</td>
								</tr>
							) : (
								recentOrders?.orders?.map((order) => (
									<tr
										key={order.id}
										className="hover:bg-muted/30 transition-colors cursor-pointer"
										onClick={() => navigate(`/orders/${order.id}`)}
									>
										<td className="px-6 py-4 text-sm font-bold tabular-nums">
											#{order.order_number}
										</td>
										<td className="px-6 py-4 text-sm">
											{order.walk_in_customer_id || order.customer_id || "—"}
										</td>
										<td className="px-6 py-4">
											<StatusBadge status={order.status} />
										</td>
										<td className="px-6 py-4 text-sm font-semibold tabular-nums">
											{formatCurrency(order.total_amount, language)}
										</td>
										<td className="px-6 py-4 text-xs text-muted-foreground">
											{formatDate(order.created_at, language)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
