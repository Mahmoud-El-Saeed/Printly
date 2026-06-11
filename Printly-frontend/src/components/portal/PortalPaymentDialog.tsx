import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { PortalPaymentCreate } from "@/types/portal";

interface PortalPaymentDialogProps {
	tenantId: string;
	orderId: string;
	orderNumber: string;
	totalAmount: number;
	paidAmount: number;
	remainingAmount: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PortalPaymentDialog({
	tenantId,
	orderId,
	orderNumber,
	totalAmount,
	paidAmount,
	remainingAmount,
	open,
	onOpenChange,
}: PortalPaymentDialogProps) {
	const { t, language } = useLanguage();
	const queryClient = useQueryClient();
	const [amount, setAmount] = useState(String(remainingAmount));
	const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_wallet">(
		"cash",
	);
	const [reference, setReference] = useState("");
	const [notes, setNotes] = useState("");

	const mutation = useMutation({
		mutationFn: async () => {
			const data: PortalPaymentCreate = {
				order_id: orderId,
				amount: Number(amount),
				payment_method: paymentMethod,
				reference: reference || undefined,
				notes: notes || undefined,
			};
			return portalApi.createPayment(tenantId, data);
		},
		onSuccess: () => {
			toast.success(t("portal.payment_success"));
			queryClient.invalidateQueries({ queryKey: ["portal-orders", tenantId] });
			queryClient.invalidateQueries({ queryKey: ["portal-balance", tenantId] });
			handleReset();
			onOpenChange(false);
		},
		onError: () => toast.error(t("common.error")),
	});

	const handleReset = () => {
		setAmount(String(remainingAmount));
		setPaymentMethod("cash");
		setReference("");
		setNotes("");
	};

	const handleSubmit = () => {
		const numAmount = Number(amount);
		if (numAmount <= 0 || numAmount > remainingAmount) return;
		mutation.mutate();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("portal.make_payment")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 pt-2">
					<div className="bg-muted/50 border border-border rounded-xl p-4 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">
								{t("orders.order_number")} #{orderNumber}
							</span>
							<span className="text-sm font-semibold tabular-nums">
								{formatCurrency(totalAmount, language)}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">
								{t("portal.paid_amount")}
							</span>
							<span className="text-sm font-semibold tabular-nums text-green-600">
								{formatCurrency(paidAmount, language)}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm text-muted-foreground">
								{t("portal.remaining_amount")}
							</span>
							<span className="text-sm font-bold tabular-nums text-red-600">
								{formatCurrency(remainingAmount, language)}
							</span>
						</div>
					</div>

					<div className="space-y-2">
						<Label>{t("portal.payment_amount")}</Label>
						<Input
							type="number"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							min={0.01}
							max={remainingAmount}
							step={0.01}
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("portal.payment_method")}</Label>
						<Select
							value={paymentMethod}
							onValueChange={(v) =>
								setPaymentMethod(v as "cash" | "mobile_wallet")
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="cash">{t("payment_method.cash")}</SelectItem>
								<SelectItem value="mobile_wallet">
									{t("payment_method.mobile_wallet")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>{t("portal.payment_reference")}</Label>
						<Input
							value={reference}
							onChange={(e) => setReference(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label>{t("portal.payment_notes")}</Label>
						<Input value={notes} onChange={(e) => setNotes(e.target.value)} />
					</div>

					<Button
						onClick={handleSubmit}
						disabled={
							mutation.isPending ||
							Number(amount) <= 0 ||
							Number(amount) > remainingAmount
						}
						className="w-full"
					>
						{mutation.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							t("portal.pay_now")
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
