import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, Wallet } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

const ORDER_STATUS_FILTERS = [
	"all",
	"new",
	"printing",
	"ready",
	"delivered",
] as const;

interface PortalOrdersTabProps {
	tenantId: string;
	onPayOrder: (order: {
		id: string;
		order_number: string;
		total_amount: number;
		paid_amount: number;
	}) => void;
}

export function PortalOrdersTab({
	tenantId,
	onPayOrder,
}: PortalOrdersTabProps) {
	const { t, language, isRTL } = useLanguage();
	const navigate = useNavigate();
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const {
		data: orders,
		isLoading: ordersLoading,
		isError: ordersError,
	} = useQuery({
		queryKey: ["portal-orders", tenantId, statusFilter],
		queryFn: () =>
			portalApi.getOrders(tenantId, {
				status: statusFilter === "all" ? undefined : statusFilter,
			}),
		enabled: !!tenantId,
	});

	return (
		<div className="space-y-4">
			<div
				className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
			>
				<span className="text-xs font-medium text-muted-foreground">
					{t("portal.filter_status")}:
				</span>
				{ORDER_STATUS_FILTERS.map((status) => (
					<button
						key={status}
						type="button"
						onClick={() => setStatusFilter(status)}
						className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
							statusFilter === status
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:bg-muted/80"
						}`}
					>
						{t(`portal.${status}`) || t(`status.${status}`) || status}
					</button>
				))}
			</div>

			{ordersLoading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-primary" />
				</div>
			) : ordersError ? (
				<div className="bg-card border border-border rounded-xl p-8 text-center text-error">
					{t("common.error")}
				</div>
			) : !orders?.orders?.length ? (
				<div className="bg-card border border-border rounded-xl p-8 text-center">
					<Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
					<p className="text-sm text-muted-foreground">
						{t("portal.no_orders_desc")}
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{orders.orders.map((order) => {
						const balanceDue = order.total_amount - order.paid_amount;
						return (
							<div
								key={order.id}
								className="w-full bg-card border border-border rounded-xl p-4"
							>
								<div
									className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
								>
									<div
										className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
									>
										<button
											type="button"
											onClick={() =>
												navigate(`/portal/${tenantId}/orders/${order.id}`)
											}
											className="font-bold text-sm tabular-nums hover:text-primary transition-colors"
										>
											#{order.order_number}
										</button>
										<StatusBadge status={order.status} />
									</div>
									<div
										className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
									>
										<span className="text-sm font-semibold tabular-nums">
											{formatCurrency(order.total_amount, language)}
										</span>
										{balanceDue > 0 && (
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													onPayOrder({
														id: order.id,
														order_number: order.order_number,
														total_amount: order.total_amount,
														paid_amount: order.paid_amount,
													})
												}
												className="gap-1 text-xs"
											>
												<Wallet className="h-3 w-3" />
												{t("portal.pay_now")}
											</Button>
										)}
									</div>
								</div>
								<div className="mt-2 text-xs text-muted-foreground">
									{formatDate(order.created_at, language)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
