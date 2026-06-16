import { useMutation, useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Clock,
	FileText,
	Printer,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { invoicesApi } from "@/lib/api/invoices";
import { ordersApi } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

export default function OrderDetailPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

	const {
		data: order,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["order", id],
		queryFn: () => ordersApi.get(id ?? ""),
		enabled: !!id,
	});

	const toggleExpand = (itemId: string) => {
		const next = new Set(expandedItems);
		if (next.has(itemId)) next.delete(itemId);
		else next.add(itemId);
		setExpandedItems(next);
	};

	const generateInvoiceMutation = useMutation({
		mutationFn: () => invoicesApi.generate(id ?? ""),
		onSuccess: (data) => {
			toast.success(t("invoices.generate_success"));
			navigate(`/invoices/${data.id}`);
		},
		onError: () => {
			toast.error(t("invoices.generate_failed"));
		},
	});

	if (isError) {
		return (
			<div className="flex items-center justify-center py-12 text-error">
				{t("common.error")}
			</div>
		);
	}

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
										<div className="flex flex-wrap gap-2 mt-2">
											<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
												{item.total_pages} {t("books.pages")}
											</span>
											<span
												className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
													item.color_mode === "color"
														? "bg-primary/10 text-primary"
														: "bg-gray-100 text-gray-600"
												}`}
											>
												{item.color_mode === "color"
													? t("books.color_color")
													: t("books.color_bw")}
											</span>
											<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
												{item.sides_per_page === 1
													? t("orders.single_side")
													: `${item.sides_per_page}`}
											</span>
											{item.binding_type && (
												<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
													{t(`books.binding_${item.binding_type}`)}
												</span>
											)}
											{item.has_lamination && (
												<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
													{t("orders.lamination")}
												</span>
											)}
										</div>
									</div>
								</div>

								<div className="flex items-center justify-between border-t border-outline-variant pt-3">
									<div className="flex items-center gap-4 text-xs text-on-surface-variant">
										<span>
											{item.copies} ×{" "}
											<span className="tabular-nums font-bold text-on-surface">
												{formatCurrency(item.unit_price, language)}
											</span>
										</span>
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

								{item.materials_snapshot.length > 0 && (
									<div className="border-t border-outline-variant pt-2">
										<button
											type="button"
											className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
											onClick={() => toggleExpand(item.id)}
										>
											{expandedItems.has(item.id) ? (
												<ChevronDown className="h-3.5 w-3.5" />
											) : (
												<ChevronRight className="h-3.5 w-3.5" />
											)}
											{t("orders.materials_used")} (
											{item.materials_snapshot.length})
										</button>
										{expandedItems.has(item.id) && (
											<table className="w-full text-xs mt-2">
												<thead>
													<tr className="border-b border-outline-variant">
														<th className="text-left py-1.5 font-medium text-on-surface-variant">
															{t("orders.material_name")}
														</th>
														<th className="text-right py-1.5 font-medium text-on-surface-variant">
															{t("orders.qty_per_copy")}
														</th>
														<th className="text-right py-1.5 font-medium text-on-surface-variant">
															{t("orders.material_price")}
														</th>
														<th className="text-right py-1.5 font-medium text-on-surface-variant">
															{t("orders.material_line_total")}
														</th>
													</tr>
												</thead>
												<tbody>
													{item.materials_snapshot.map((m) => (
														<tr
															key={m.material_id}
															className="border-b border-outline-variant last:border-b-0"
														>
															<td className="py-1.5 text-on-surface">
																{m.material_name}
															</td>
															<td className="py-1.5 text-right tabular-nums text-on-surface">
																{m.quantity_per_copy}
															</td>
															<td className="py-1.5 text-right tabular-nums text-on-surface">
																{formatCurrency(m.price_per_unit, language)}
															</td>
															<td className="py-1.5 text-right tabular-nums font-semibold text-on-surface">
																{formatCurrency(
																	m.quantity_per_copy * m.price_per_unit,
																	language,
																)}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										)}
									</div>
								)}
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
								<Button
									className="w-full h-12 bg-on-primary text-primary font-bold hover:bg-surface-bright shadow-md active:scale-[0.98] gap-2"
									disabled
								>
									{t("orders.settle_payments")}
								</Button>
								{order.status === "delivered" && (
									<Button
										variant="outline"
										className="w-full h-10 border-on-primary/30 text-on-primary hover:bg-white/10 gap-2"
										onClick={() => generateInvoiceMutation.mutate()}
										disabled={generateInvoiceMutation.isPending}
									>
										<FileText className="h-4 w-4" />
										{t("invoices.generate")}
									</Button>
								)}
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
						<button
							type="button"
							className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container transition-colors rounded-lg font-medium text-sm opacity-50"
							disabled
						>
							<Printer className="h-4 w-4" />
							{t("orders.print_receipt")}
						</button>
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
