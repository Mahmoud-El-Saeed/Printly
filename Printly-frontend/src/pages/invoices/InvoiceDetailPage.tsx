import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { invoicesApi } from "@/lib/api/invoices";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

export default function InvoiceDetailPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();

	const {
		data: invoice,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["invoice", id],
		queryFn: () => invoicesApi.get(id ?? ""),
		enabled: !!id,
	});

	if (isError) {
		return (
			<div className="flex items-center justify-center py-12 text-error">
				{t("common.error")}
			</div>
		);
	}

	if (isLoading || !invoice) {
		return (
			<div className="flex items-center justify-center h-64 text-muted-foreground">
				{t("common.loading")}
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			<div className="flex items-center gap-4">
				<button
					type="button"
					className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
					onClick={() => navigate("/invoices")}
				>
					<ArrowLeft className="h-5 w-5" />
				</button>
				<div>
					<h2 className="font-bold text-2xl tracking-tight text-on-surface">
						{invoice.invoice_number}
					</h2>
					<p className="text-sm text-on-surface-variant">
						{t("invoices.detail_title")}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				<div className="lg:col-span-8 flex flex-col gap-6">
					<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
						<div className="bg-surface-container px-6 py-3 border-b border-outline-variant flex items-center justify-between">
							<h3 className="font-bold text-sm text-on-surface">
								{t("invoices.invoice_info")}
							</h3>
							<Button
								variant="outline"
								size="sm"
								className="gap-2"
								onClick={() => navigate(`/orders/${invoice.order_id}`)}
							>
								<ExternalLink className="h-4 w-4" />
								{t("invoices.view_order")}
							</Button>
						</div>
						<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="flex flex-col gap-1">
								<span className="text-xs font-medium text-on-surface-variant">
									{t("invoices.order_number")}
								</span>
								<span className="text-sm font-semibold text-on-surface">
									{invoice.order_number}
								</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs font-medium text-on-surface-variant">
									{t("invoices.customer")}
								</span>
								<span className="text-sm font-semibold text-on-surface">
									{invoice.customer_name ?? "—"}
								</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs font-medium text-on-surface-variant">
									{t("invoices.total_amount")}
								</span>
								<span className="text-sm tabular-nums font-semibold text-on-surface">
									{formatCurrency(invoice.total_amount, language)}
								</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs font-medium text-on-surface-variant">
									{t("invoices.paid_amount")}
								</span>
								<span className="text-sm tabular-nums font-semibold text-on-surface">
									{formatCurrency(invoice.paid_amount, language)}
								</span>
							</div>
							<div className="flex flex-col gap-1">
								<span className="text-xs font-medium text-on-surface-variant">
									{t("invoices.created")}
								</span>
								<span className="text-sm text-on-surface">
									{formatDate(invoice.created_at, language)}
								</span>
							</div>
							{invoice.notes && (
								<div className="md:col-span-2 flex flex-col gap-1">
									<span className="text-xs font-medium text-on-surface-variant">
										{t("invoices.notes")}
									</span>
									<span className="text-sm text-on-surface">
										{invoice.notes}
									</span>
								</div>
							)}
						</div>
					</div>

					<h3 className="font-bold text-sm text-on-surface">
						{t("invoices.items")} ({invoice.items.length})
					</h3>

					<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
						<table className="w-full text-sm">
							<thead>
								<tr className="bg-surface-container border-b border-outline-variant">
									<th className="text-left px-5 py-3 font-medium text-on-surface-variant text-xs">
										{t("invoices.items")}
									</th>
									<th className="text-right px-5 py-3 font-medium text-on-surface-variant text-xs">
										{t("orders.copies")}
									</th>
									<th className="text-right px-5 py-3 font-medium text-on-surface-variant text-xs">
										{t("orders.unit_price")}
									</th>
									<th className="text-right px-5 py-3 font-medium text-on-surface-variant text-xs">
										{t("orders.subtotal")}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-outline-variant">
								{invoice.items.map((item, idx) => (
									<tr key={`${item.book_title}-${idx}`}>
										<td className="px-5 py-3 text-on-surface font-medium">
											{item.book_title}
										</td>
										<td className="px-5 py-3 text-right tabular-nums text-on-surface">
											{item.copies}
										</td>
										<td className="px-5 py-3 text-right tabular-nums text-on-surface">
											{formatCurrency(item.unit_price, language)}
										</td>
										<td className="px-5 py-3 text-right tabular-nums font-semibold text-on-surface">
											{formatCurrency(item.subtotal, language)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{invoice.payments.length > 0 && (
						<>
							<h3 className="font-bold text-sm text-on-surface">
								{t("invoices.payments")} ({invoice.payments.length})
							</h3>
							<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
								<table className="w-full text-sm">
									<thead>
										<tr className="bg-surface-container border-b border-outline-variant">
											<th className="text-left px-5 py-3 font-medium text-on-surface-variant text-xs">
												{t("invoices.payment_method")}
											</th>
											<th className="text-right px-5 py-3 font-medium text-on-surface-variant text-xs">
												{t("invoices.payment_amount")}
											</th>
											<th className="text-left px-5 py-3 font-medium text-on-surface-variant text-xs">
												{t("invoices.payment_reference")}
											</th>
											<th className="text-right px-5 py-3 font-medium text-on-surface-variant text-xs">
												{t("invoices.created")}
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-outline-variant">
										{invoice.payments.map((payment) => (
											<tr key={payment.id}>
												<td className="px-5 py-3 text-on-surface">
													{t(`payment_method.${payment.payment_method}`)}
												</td>
												<td className="px-5 py-3 text-right tabular-nums text-on-surface">
													{formatCurrency(payment.amount, language)}
												</td>
												<td className="px-5 py-3 text-on-surface">
													{payment.reference ?? "—"}
												</td>
												<td className="px-5 py-3 text-right tabular-nums text-on-surface-variant">
													{formatDate(payment.created_at, language)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</>
					)}
				</div>

				<div className="lg:col-span-4 flex flex-col gap-6 sticky top-20">
					<div className="bg-primary text-on-primary rounded-xl overflow-hidden">
						<div className="p-6 flex flex-col gap-6">
							<h3 className="font-bold text-sm opacity-90">
								{t("invoices.invoice_info")}
							</h3>
							<div className="border-t-2 border-dashed border-on-primary/20 pt-4 flex flex-col gap-3">
								<div className="flex justify-between items-end">
									<span className="font-medium text-sm opacity-90 uppercase">
										{t("invoices.total_amount")}
									</span>
									<span className="text-2xl font-extrabold tabular-nums tracking-tight">
										{formatCurrency(invoice.total_amount, language)}
									</span>
								</div>
							</div>
							<div className="bg-on-primary/10 rounded-lg p-4 space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-sm font-medium opacity-80">
										{t("invoices.paid_amount")}
									</span>
									<span className="text-lg font-bold tabular-nums">
										{formatCurrency(invoice.paid_amount, language)}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
