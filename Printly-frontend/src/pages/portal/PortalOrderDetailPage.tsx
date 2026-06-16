import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Clock,
	Loader2,
	Package,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PortalPaymentDialog } from "@/components/portal/PortalPaymentDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

const ORDER_STEPS = [
	{ key: "new", labelKey: "status.new" },
	{ key: "printing", labelKey: "status.printing" },
	{ key: "ready", labelKey: "status.ready" },
	{ key: "delivered", labelKey: "status.delivered" },
] as const;

function getStepIndex(status: string): number {
	const idx = ORDER_STEPS.findIndex((s) => s.key === status);
	return idx === -1 ? 0 : idx;
}

export default function PortalOrderDetailPage() {
	const { tenantId, orderId } = useParams<{
		tenantId: string;
		orderId: string;
	}>();
	const { t, language, isRTL } = useLanguage();
	const tid = tenantId ?? "";
	const oid = orderId ?? "";
	const queryClient = useQueryClient();
	const [paymentOpen, setPaymentOpen] = useState(false);
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

	const { data: order, isLoading } = useQuery({
		queryKey: ["portal-order", tid, oid],
		queryFn: () => portalApi.getOrder(tid, oid),
		enabled: !!tid && !!oid,
	});

	const toggleExpand = (itemId: string) => {
		const next = new Set(expandedItems);
		if (next.has(itemId)) next.delete(itemId);
		else next.add(itemId);
		setExpandedItems(next);
	};

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
				<div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
					{t("common.no_data")}
				</div>
			</div>
		);
	}

	const currentStep = getStepIndex(order.status);
	const balanceDue = order.total_amount - order.paid_amount;
	const isOverdue =
		order.due_date && new Date(order.due_date) < new Date() && balanceDue > 0;

	return (
		<div className="space-y-6">
			<Link
				to={`/portal/${tid}`}
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("common.back")}
			</Link>

			<div className="bg-card border border-border rounded-xl p-6">
				<div
					className={`flex items-center justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""}`}
				>
					<div
						className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
					>
						<h2 className="font-bold text-lg tabular-nums">
							#{order.order_number}
						</h2>
						<StatusBadge status={order.status} />
					</div>
					<span className="text-xs text-muted-foreground">
						{formatDate(order.created_at, language)}
					</span>
				</div>

				{order.due_date && (
					<div
						className={`flex items-center gap-2 text-sm ${isRTL ? "flex-row-reverse" : ""}`}
					>
						<span className="text-muted-foreground">
							{t("portal.due_date")}:
						</span>
						<span className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
							{formatDate(order.due_date, language)}
						</span>
						{isOverdue && (
							<span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">
								{t("portal.overdue")}
							</span>
						)}
					</div>
				)}
			</div>

			<div className="bg-card border border-border rounded-xl p-6">
				<h3 className="font-bold text-sm mb-4">{t("portal.progress")}</h3>
				<div className={`flex items-center ${isRTL ? "flex-row-reverse" : ""}`}>
					{ORDER_STEPS.map((step, idx) => {
						const isCompleted =
							idx <= currentStep && order.status !== "cancelled";
						const isCurrent =
							idx === currentStep && order.status !== "cancelled";
						return (
							<div
								key={step.key}
								className="flex items-center flex-1 last:flex-none"
							>
								<div
									className={`flex flex-col items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}
								>
									<div
										className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
											isCompleted
												? "bg-primary border-primary text-primary-foreground"
												: "bg-muted border-border text-muted-foreground"
										}`}
									>
										{isCompleted ? (
											<CheckCircle className="h-4 w-4" />
										) : (
											<Clock className="h-4 w-4" />
										)}
									</div>
									<span
										className={`text-xs font-medium ${
											isCurrent
												? "text-primary"
												: isCompleted
													? "text-foreground"
													: "text-muted-foreground"
										}`}
									>
										{t(step.labelKey)}
									</span>
								</div>
								{idx < ORDER_STEPS.length - 1 && (
									<div
										className={`flex-1 h-0.5 mx-2 ${
											idx < currentStep && order.status !== "cancelled"
												? "bg-primary"
												: "bg-border"
										}`}
									/>
								)}
							</div>
						);
					})}
				</div>
				{order.status === "cancelled" && (
					<div className="mt-3 text-center">
						<span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-red-100 text-red-800">
							{t("status.cancelled")}
						</span>
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="bg-card border border-border rounded-xl p-5">
					<div className="flex items-center gap-2 mb-2">
						<Package className="h-4 w-4 text-primary" />
						<span className="font-medium text-sm text-muted-foreground">
							{t("portal.total_amount")}
						</span>
					</div>
					<p className="text-xl font-bold tabular-nums">
						{formatCurrency(order.total_amount, language)}
					</p>
				</div>
				<div className="bg-card border border-border rounded-xl p-5">
					<div className="flex items-center gap-2 mb-2">
						<CheckCircle className="h-4 w-4 text-green-600" />
						<span className="font-medium text-sm text-muted-foreground">
							{t("portal.paid_amount")}
						</span>
					</div>
					<p className="text-xl font-bold tabular-nums text-green-600">
						{formatCurrency(order.paid_amount, language)}
					</p>
				</div>
				<div
					className={`bg-card border rounded-xl p-5 ${
						balanceDue > 0 ? "border-red-200 bg-red-50/50" : "border-border"
					}`}
				>
					<div className="flex items-center gap-2 mb-2">
						<Clock
							className={`h-4 w-4 ${balanceDue > 0 ? "text-red-600" : "text-muted-foreground"}`}
						/>
						<span className="font-medium text-sm text-muted-foreground">
							{t("portal.remaining")}
						</span>
					</div>
					<div
						className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
					>
						<p
							className={`text-xl font-bold tabular-nums ${
								balanceDue > 0 ? "text-red-600" : "text-green-600"
							}`}
						>
							{formatCurrency(balanceDue, language)}
						</p>
						{balanceDue > 0 && (
							<Button
								size="sm"
								onClick={() => setPaymentOpen(true)}
								className="gap-1"
							>
								<Wallet className="h-3 w-3" />
								{t("portal.pay_now")}
							</Button>
						)}
					</div>
				</div>
				{order.due_date && (
					<div
						className={`bg-card border rounded-xl p-5 ${
							isOverdue ? "border-red-200 bg-red-50/50" : "border-border"
						}`}
					>
						<div className="flex items-center gap-2 mb-2">
							<Clock
								className={`h-4 w-4 ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}
							/>
							<span className="font-medium text-sm text-muted-foreground">
								{t("portal.due_date")}
							</span>
						</div>
						<p
							className={`text-xl font-bold ${isOverdue ? "text-red-600" : ""}`}
						>
							{formatDate(order.due_date, language)}
						</p>
					</div>
				)}
			</div>

			{order.items?.length > 0 && (
				<div className="bg-card border border-border rounded-xl overflow-hidden">
					<div className="p-5 border-b border-border bg-muted/30">
						<h3 className="font-bold text-sm">{t("portal.items")}</h3>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-start border-collapse">
							<thead>
								<tr className="text-muted-foreground">
									<th className="px-4 py-3 font-medium text-xs border-b border-border">
										{t("portal.book_title")}
									</th>
									<th className="px-4 py-3 font-medium text-xs border-b border-border">
										{t("portal.copies")}
									</th>
									<th className="px-4 py-3 font-medium text-xs border-b border-border">
										{t("portal.order_total_pages")}
									</th>
									<th className="px-4 py-3 font-medium text-xs border-b border-border">
										{t("portal.order_color")}
									</th>
									<th className="px-4 py-3 font-medium text-xs border-b border-border">
										{t("portal.order_unit_price")}
									</th>
									<th className="px-4 py-3 font-medium text-xs border-b border-border">
										{t("portal.subtotal")}
									</th>
									{order.items.some(
										(item) => item.materials_snapshot?.length > 0,
									) && (
										<th className="px-4 py-3 font-medium text-xs border-b border-border" />
									)}
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{order.items.map((item) => (
									<tr key={item.id}>
										<td className="px-4 py-3 text-sm font-medium">
											{item.book_title}
										</td>
										<td className="px-4 py-3 text-sm tabular-nums">
											{item.copies}
										</td>
										<td className="px-4 py-3 text-sm tabular-nums">
											{item.total_pages}
										</td>
										<td className="px-4 py-3 text-sm">
											<span
												className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
													item.color_mode === "color"
														? "bg-primary/10 text-primary"
														: "bg-gray-100 text-gray-600"
												}`}
											>
												{item.color_mode === "color"
													? t("portal.book_color_color")
													: t("portal.book_color_bw")}
											</span>
										</td>
										<td className="px-4 py-3 text-sm tabular-nums">
											{formatCurrency(item.unit_price, language)}
										</td>
										<td className="px-4 py-3 text-sm font-semibold tabular-nums">
											{formatCurrency(item.subtotal, language)}
										</td>
										{item.materials_snapshot?.length > 0 && (
											<td className="px-4 py-3 text-sm">
												<button
													type="button"
													className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
													onClick={() => toggleExpand(item.id)}
												>
													{expandedItems.has(item.id) ? (
														<ChevronDown className="h-3.5 w-3.5" />
													) : (
														<ChevronRight className="h-3.5 w-3.5" />
													)}
													{t("portal.order_materials")}
												</button>
											</td>
										)}
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{order.items.map((item) =>
						expandedItems.has(item.id) &&
						item.materials_snapshot?.length > 0 ? (
							<div
								key={`materials-${item.id}`}
								className="border-t border-border bg-muted/20 px-4 py-3"
							>
								<table className="w-full text-xs">
									<thead>
										<tr className="text-muted-foreground">
											<th className="text-left py-1.5 font-medium">
												{t("portal.order_material_name")}
											</th>
											<th className="text-right py-1.5 font-medium">
												{t("portal.order_qty_per_copy")}
											</th>
											<th className="text-right py-1.5 font-medium">
												{t("portal.order_material_price")}
											</th>
											<th className="text-right py-1.5 font-medium">
												{t("portal.order_line_total")}
											</th>
										</tr>
									</thead>
									<tbody>
										{item.materials_snapshot.map((m) => (
											<tr key={m.material_id}>
												<td className="py-1 text-foreground">
													{m.material_name}
												</td>
												<td className="py-1 text-right tabular-nums text-foreground">
													{m.quantity_per_copy}
												</td>
												<td className="py-1 text-right tabular-nums text-foreground">
													{formatCurrency(m.price_per_unit, language)}
												</td>
												<td className="py-1 text-right tabular-nums font-semibold text-foreground">
													{formatCurrency(
														m.quantity_per_copy * m.price_per_unit,
														language,
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : null,
					)}
				</div>
			)}

			{order.notes && (
				<div className="bg-muted/50 border border-border rounded-xl p-4">
					<h3 className="font-bold text-sm mb-2">{t("portal.notes")}</h3>
					<p className="text-sm text-muted-foreground italic">{order.notes}</p>
				</div>
			)}

			<PortalPaymentDialog
				tenantId={tid}
				orderId={oid}
				orderNumber={order.order_number}
				totalAmount={order.total_amount}
				paidAmount={order.paid_amount}
				remainingAmount={balanceDue}
				open={paymentOpen}
				onOpenChange={(open) => {
					setPaymentOpen(open);
					if (!open) {
						queryClient.invalidateQueries({
							queryKey: ["portal-order", tid, oid],
						});
					}
				}}
			/>
		</div>
	);
}
