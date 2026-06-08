import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { ordersApi } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { OrderStatus } from "@/types/order";

export default function EditOrderPage() {
	const { id } = useParams<{ id: string }>();
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: order, isLoading } = useQuery({
		queryKey: ["order", id],
		queryFn: () => ordersApi.get(id ?? ""),
		enabled: !!id,
	});

	const [dueDate, setDueDate] = useState("");
	const [notes, setNotes] = useState("");
	const [status, setStatus] = useState<OrderStatus>("new");
	const [originalStatus, setOriginalStatus] = useState<OrderStatus>("new");

	useEffect(() => {
		if (order) {
			setDueDate(order.due_date?.split("T")[0] ?? "");
			setNotes(order.notes ?? "");
			setStatus(order.status);
			setOriginalStatus(order.status);
		}
	}, [order]);

	const updateMutation = useMutation({
		mutationFn: (data: { due_date?: string; notes?: string }) =>
			ordersApi.update(id ?? "", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			queryClient.invalidateQueries({ queryKey: ["order", id] });
			toast.success(t("common.saved"));
			navigate(`/orders/${id}`);
		},
		onError: () => toast.error(t("common.error")),
	});

	const statusMutation = useMutation({
		mutationFn: (newStatus: OrderStatus) =>
			ordersApi.updateStatus(id ?? "", { status: newStatus }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			queryClient.invalidateQueries({ queryKey: ["order", id] });
			toast.success(t("common.saved"));
		},
		onError: () => toast.error(t("common.error")),
	});

	const handleSave = () => {
		updateMutation.mutate({
			due_date: dueDate || undefined,
			notes: notes || undefined,
		});
		if (status !== originalStatus) {
			statusMutation.mutate(status);
		}
	};

	const orderStatuses: OrderStatus[] = [
		"new",
		"printing",
		"ready",
		"delivered",
		"cancelled",
	];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-24">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

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
						#{order?.order_number}
					</h2>
					<p className="text-sm text-on-surface-variant">
						{t("orders.edit_order")}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				<div className="lg:col-span-8 flex flex-col gap-6">
					<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
						<div className="bg-surface-container px-6 py-3 border-b border-outline-variant">
							<h3 className="font-bold text-sm text-on-surface">
								{t("orders.order_info")}
							</h3>
						</div>
						<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="flex flex-col gap-2">
								<Label className="text-on-surface-variant">
									{t("orders.customer")}
								</Label>
								<Input
									value={
										order?.customer_id
											? order.customer_id
											: (order?.walk_in_customer_id ?? "—")
									}
									disabled
									className="h-11 bg-surface-container"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label className="text-on-surface-variant">
									{t("orders.created")}
								</Label>
								<Input
									value={
										order?.created_at
											? formatDate(order.created_at, language)
											: "—"
									}
									disabled
									className="h-11 bg-surface-container"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label className="text-on-surface-variant">
									{t("orders.total_amount")}
								</Label>
								<Input
									value={
										order?.total_amount
											? formatCurrency(order.total_amount, language)
											: "—"
									}
									disabled
									className="h-11 bg-surface-container tabular-nums"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label className="text-on-surface-variant">
									{t("orders.paid_amount")}
								</Label>
								<Input
									value={
										order?.paid_amount
											? formatCurrency(order.paid_amount, language)
											: "—"
									}
									disabled
									className="h-11 bg-surface-container tabular-nums"
								/>
							</div>
						</div>
					</div>

					<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
						<div className="bg-surface-container px-6 py-3 border-b border-outline-variant">
							<h3 className="font-bold text-sm text-on-surface">
								{t("orders.edit_order")}
							</h3>
						</div>
						<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="flex flex-col gap-2">
								<Label className="text-on-surface-variant">
									{t("orders.due_date")}
								</Label>
								<Input
									type="date"
									value={dueDate}
									onChange={(e) => setDueDate(e.target.value)}
									className="h-11"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label className="text-on-surface-variant">
									{t("orders.update_status")}
								</Label>
								<Select
									value={status}
									onValueChange={(v) => setStatus(v as OrderStatus)}
								>
									<SelectTrigger className="h-11">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{orderStatuses.map((s) => (
											<SelectItem key={s} value={s}>
												{t(`status.${s}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="md:col-span-2 flex flex-col gap-2">
								<Label className="text-on-surface-variant">
									{t("orders.notes")}
								</Label>
								<Textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									placeholder={t("orders.notes_placeholder")}
									rows={3}
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="lg:col-span-4 flex flex-col gap-6 sticky top-20">
					<div className="bg-primary text-on-primary rounded-xl overflow-hidden">
						<div className="p-6 flex flex-col gap-6">
							<div className="flex justify-between items-center">
								<h3 className="font-bold text-sm opacity-90">
									{t("orders.order_summary")}
								</h3>
								<span className="bg-on-primary/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
									{t(`status.${status}`)}
								</span>
							</div>
							<div className="space-y-4 border-t border-on-primary/10 pt-4">
								<div className="flex justify-between text-sm opacity-80">
									<span>
										{t("orders.total_items")} ({order?.items?.length ?? 0})
									</span>
									<span className="tabular-nums font-bold">
										{order?.total_amount
											? formatCurrency(order.total_amount, language)
											: "—"}
									</span>
								</div>
							</div>
							<div className="flex flex-col gap-3 pt-2">
								<Button
									className="w-full h-12 bg-on-primary text-primary font-bold hover:bg-surface-bright shadow-md active:scale-[0.98] gap-2"
									onClick={handleSave}
									disabled={
										updateMutation.isPending || statusMutation.isPending
									}
								>
									{updateMutation.isPending || statusMutation.isPending
										? t("common.saving")
										: t("common.save")}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
