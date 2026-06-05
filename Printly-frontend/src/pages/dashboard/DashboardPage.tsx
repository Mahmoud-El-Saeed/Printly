import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DashboardPage() {
	const { t } = useLanguage();

	const cards = [
		{ title: t("dashboard.total_revenue"), sub: t("dashboard.loading_data") },
		{ title: t("dashboard.total_expenses"), sub: t("dashboard.loading_data") },
		{ title: t("dashboard.net_profit"), sub: t("dashboard.loading_data") },
		{ title: t("dashboard.total_orders"), sub: t("dashboard.loading_data") },
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
				<p className="text-muted-foreground">{t("dashboard.welcome")}</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{cards.map((card) => (
					<Card key={card.title}>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium">
								{card.title}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">—</div>
							<p className="text-xs text-muted-foreground">{card.sub}</p>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">
							{t("dashboard.revenue_expenses_chart")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-[300px] flex items-center justify-center text-muted-foreground">
							{t("common.coming_soon")} — Phase 4
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">
							{t("dashboard.orders_status_chart")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-[300px] flex items-center justify-center text-muted-foreground">
							{t("common.coming_soon")} — Phase 4
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
