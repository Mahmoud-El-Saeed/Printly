import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

export default function PortalOrderDetailPage() {
	const { tenantId, orderId } = useParams<{ tenantId: string; orderId: string }>();
	const { t, language } = useLanguage();
	const tid = tenantId ?? "";
	const oid = orderId ?? "";

	const { data: order, isLoading } = useQuery({
		queryKey: ["portal-order", tid, oid],
		queryFn: () => portalApi.getOrder(tid, oid),
		enabled: !!tid && !!oid,
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!order) {
		return (
			<div className="space-y-6">
				<Link
					to={`/portal/${tid}`}
					className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("common.back")}
				</Link>
				<div className="bg-background border border-border rounded-xl p-12 text-center text-muted-foreground">
					{t("common.no_data")}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<Link
				to={`/portal/${tid}`}
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("common.back")}
			</Link>

			<div className="bg-background border border-border rounded-xl overflow-hidden">
				<div className="p-5 border-b border-border bg-muted/30">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<h2 className="font-bold text-lg">
								#{order.order_number}
							</h2>
							<StatusBadge status={order.status} />
						</div>
						<span className="text-xs text-muted-foreground">
							{formatDate(order.created_at, language)}
						</span>
					</div>
				</div>

				<div className="p-6 space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-3">
							<h3 className="font-bold text-sm">{t("orders.order_info")}</h3>
							<div className="space-y-2">
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">{t("orders.total")}</span>
									<span className="font-semibold tabular-nums">
										{formatCurrency(order.total_amount, language)}
									</span>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">{t("orders.paid")}</span>
									<span className="font-semibold tabular-nums">
										{formatCurrency(order.paid_amount, language)}
									</span>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">{t("orders.balance_due")}</span>
									<span className="font-semibold tabular-nums">
										{formatCurrency(order.total_amount - order.paid_amount, language)}
									</span>
								</div>
								{order.due_date && (
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">{t("orders.due_date")}</span>
										<span>{formatDate(order.due_date, language)}</span>
									</div>
								)}
							</div>
						</div>

						{order.notes && (
							<div className="space-y-3">
								<h3 className="font-bold text-sm">{t("orders.notes")}</h3>
								<p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4">
									{order.notes}
								</p>
							</div>
						)}
					</div>

					{order.items?.length > 0 && (
						<div className="space-y-3">
							<h3 className="font-bold text-sm">{t("orders.items")}</h3>
							<div className="bg-muted/30 rounded-lg overflow-hidden">
								<table className="w-full text-start border-collapse">
									<thead>
										<tr className="text-muted-foreground">
											<th className="px-4 py-3 font-medium text-xs border-b border-border">
												{t("orders.book_title")}
											</th>
											<th className="px-4 py-3 font-medium text-xs border-b border-border">
												{t("orders.copies")}
											</th>
											<th className="px-4 py-3 font-medium text-xs border-b border-border">
												{t("orders.pages_per_copy")}
											</th>
											<th className="px-4 py-3 font-medium text-xs border-b border-border">
												{t("orders.subtotal")}
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{order.items.map((item) => (
											<tr key={item.id}>
												<td className="px-4 py-3 text-sm">{item.book_title}</td>
												<td className="px-4 py-3 text-sm tabular-nums">{item.copies}</td>
												<td className="px-4 py-3 text-sm tabular-nums">{item.pages_per_copy}</td>
												<td className="px-4 py-3 text-sm tabular-nums">
													{formatCurrency(item.subtotal, language)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}