import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Clock, Printer, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { ordersApi } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

export default function OrderDetailPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();

	const { data: order, isLoading } = useQuery({
		queryKey: ["order", id],
		queryFn: () => ordersApi.get(id ?? ""),
		enabled: !!id,
	});

	if (isLoading || !order) {
		return (
			<div className="flex items-center justify-center h-64 text-muted-foreground">
				{t("common.loading")}
			</div>
		);
	}

	const balanceDue = order.total_amount - order.paid_amount;

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			<div className="flex items-center gap-4">
				<button
					type="button"
					className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
					onClick={() => navigate("/orders")}
				>
					<ArrowLeft className="h-5 w-5" />
				</button>
				<div>
					<h2 className="font-bold text-2xl tracking-tight text-on-surface">
						#{order.order_number}
					</h2>
					<p className="text-sm text-on-surface-variant">
						{t("orders.order_detail_subtitle")}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				<div className="lg:col-span-8 flex flex-col gap-6">
					<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
						<div className="bg-surface-container px-6 py-3 border-b border-outline-variant flex items-center justify-between">
							<h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
								{t("orders.order_info")}
							</h3>
							<StatusBadge status={order.status} />
						</div>
						<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="flex flex-col gap-1">
								<span className="text-xs font-medium text-on-surface-variant">
									{t("orders.customer")}
								</span>
								<span className="text-sm font-semibold text-on-surface">
									{order.walk_in_customer_id || order.customer_id || "—"}
								</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs font-medium text-on-surface-variant">
									{t("orders.due_date")}
								</span>
								<span className="text-sm text-on-surface">
									{order.due_date ? formatDate(order.due_date, language) : "—"}
								</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs font-medium text-on-surface-variant">
									{t("orders.created")}
								</span>
								<span className="text-sm text-on-surface">
									{formatDate(order.created_at, language)}
								</span>
							</div>
							{order.notes && (
								<div className="md:col-span-2 flex flex-col gap-1">
									<span className="text-xs font-medium text-on-surface-variant">
										{t("orders.notes")}
									</span>
									<span className="text-sm text-on-surface">{order.notes}</span>
								</div>
							)}
						</div>
					</div>

					<div className="flex items-center justify-between">
						<h3 className="font-bold text-sm text-on-surface">
							{t("orders.items")} ({order.items.length})
						</h3>
					</div>

					{order.items.map((item) => (
						<div
							key={item.id}
							className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden"
						>
							<div className="p-5 flex flex-col gap-4">
								<div className="flex justify-between items-start gap-4">
									<div className="flex-1">
										<span className="font-semibold text-sm text-on-surface">
											{item.book_title}
										</span>
										<div className="text-xs text-on-surface-variant mt-1">
											{item.copies} {t("orders.copies")} · {item.pages_per_copy}{" "}
											{t("orders.pages_per_copy")}
										</div>
									</div>
								</div>
								<div className="flex flex-wrap items-center justify-between gap-4">
									<div className="flex items-center gap-4 text-xs text-on-surface-variant">
										<span>
											{t("orders.print")}:
											<span className="tabular-nums font-bold text-on-surface">
												{formatCurrency(item.printing_price, language)}
											</span>
										</span>
										<span className="text-outline-variant">|</span>
										<span>
											{t("orders.cover")}:
											<span className="tabular-nums font-bold text-on-surface">
												{formatCurrency(item.cover_price, language)}
											</span>
										</span>
										<span className="text-outline-variant">|</span>
										<span>
											{t("orders.binding")}:
											<span className="tabular-nums font-bold text-on-surface">
												{formatCurrency(item.binding_price, language)}
											</span>
										</span>
										{item.has_lamination && (
											<>
												<span className="text-outline-variant">|</span>
												<span>
													{t("orders.lamination")}:
													<span className="tabular-nums font-bold text-on-surface">
														{formatCurrency(item.lamination_price, language)}
													</span>
												</span>
											</>
										)}
									</div>
									<div className="flex items-center gap-2">
										<span className="text-sm text-on-surface-variant font-medium">
											{t("orders.subtotal")}:
										</span>
										<span className="font-semibold text-lg text-primary tabular-nums">
											{formatCurrency(item.subtotal, language)}
										</span>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="lg:col-span-4 flex flex-col gap-6 sticky top-20">
					<div className="bg-primary text-on-primary rounded-xl overflow-hidden">
						<div className="p-6 flex flex-col gap-6">
							<div className="flex justify-between items-center">
								<h3 className="font-bold text-sm opacity-90">
									{t("orders.order_summary")}
								</h3>
								<StatusBadge status={order.status} />
							</div>
							<div className="border-t-2 border-dashed border-on-primary/20 pt-4 flex flex-col gap-1">
								<div className="flex justify-between items-end">
									<span className="font-medium text-sm opacity-90 uppercase">
										{t("orders.total_amount")}
									</span>
									<span className="text-2xl font-extrabold tabular-nums tracking-tight">
										{formatCurrency(order.total_amount, language)}
									</span>
								</div>
							</div>
							<div className="bg-on-primary/10 rounded-lg p-4 space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-sm font-medium opacity-80 flex items-center gap-2">
										<CheckCircle className="h-4 w-4" />
										{t("orders.paid_amount")}
									</span>
									<span className="text-lg font-bold tabular-nums">
										{formatCurrency(order.paid_amount, language)}
									</span>
								</div>
								<div className="flex justify-between items-center pt-2">
									<span className="text-sm font-medium opacity-80 flex items-center gap-2">
										<Clock className="h-4 w-4" />
										{t("orders.balance_due")}
									</span>
									<span className="text-lg font-bold tabular-nums">
										{formatCurrency(balanceDue, language)}
									</span>
								</div>
							</div>
							<div className="flex flex-col gap-3 pt-2">
								{/* TODO: implement */}
								<Button
									className="w-full h-12 bg-on-primary text-primary font-bold hover:bg-surface-bright shadow-md active:scale-[0.98] gap-2"
									disabled
								>
									{t("orders.settle_payments")}
								</Button>
								<Button
									variant="outline"
									className="w-full h-10 border-on-primary/30 text-on-primary hover:bg-white/10"
									onClick={() => navigate(`/orders/${order.id}/edit`)}
								>
									{t("orders.edit")}
								</Button>
							</div>
						</div>
					</div>

					<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
						{/* TODO: implement */}
						<button
							type="button"
							className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container transition-colors rounded-lg font-medium text-sm opacity-50"
							disabled
						>
							<Printer className="h-4 w-4" />
							{t("orders.print_receipt")}
						</button>
						{/* TODO: implement */}
						<button
							type="button"
							className="flex items-center gap-3 px-3 py-2 text-error hover:bg-error-container/20 transition-colors rounded-lg font-medium text-sm opacity-50"
							disabled
						>
							<XCircle className="h-4 w-4" />
							{t("orders.cancel_order")}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
