import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FormField } from "@/components/shared/FormField";
import { PageFormLayout } from "@/components/shared/PageFormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { ordersApi } from "@/lib/api/orders";
import { paymentsApi } from "@/lib/api/payments";
import type { PaymentCreate, PaymentMethod } from "@/types/payment";

type FormValues = {
	order_id: string;
	amount: number;
	payment_method: PaymentMethod;
	reference: string;
	notes: string;
	add_to_balance: boolean;
};

const PAYMENT_METHODS: PaymentMethod[] = [
	"cash",
	"bank_transfer",
	"mobile_wallet",
	"balance",
	"other",
];

export default function CreatePaymentPage() {
	const { t } = useLanguage();
	const navigate = useNavigate();

	const { data: ordersData } = useQuery({
		queryKey: ["orders-select"],
		queryFn: () => ordersApi.list({ limit: 100 }),
	});

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<FormValues>({
		defaultValues: {
			order_id: "",
			amount: 0,
			payment_method: "cash",
			reference: "",
			notes: "",
			add_to_balance: false,
		},
	});

	const addToBalance = watch("add_to_balance");

	const mutation = useMutation({
		mutationFn: (data: PaymentCreate) => paymentsApi.create(data),
		onSuccess: () => navigate("/payments"),
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const onSubmit = (data: FormValues) => {
		mutation.mutate({
			order_id: data.order_id,
			amount: data.amount,
			payment_method: data.payment_method,
			reference: data.reference || undefined,
			notes: data.notes || undefined,
			add_to_balance: data.add_to_balance || undefined,
		});
	};

	return (
		<PageFormLayout
			title={t("payments.create_title")}
			subtitle={t("payments.subtitle")}
			backHref="/payments"
		>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
					<div className="bg-surface-container px-6 py-3 border-b border-outline-variant">
						<span className="text-sm font-bold text-on-surface">
							{t("payments.payment_info")}
						</span>
					</div>
					<div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label={t("payments.select_order")}
							required
							error={errors.order_id?.message}
						>
							<Select
								value={watch("order_id")}
								onValueChange={(val) => setValue("order_id", val)}
							>
								<SelectTrigger>
									<SelectValue placeholder={t("payments.select_order")} />
								</SelectTrigger>
								<SelectContent>
									{ordersData?.orders?.map((order) => (
										<SelectItem key={order.id} value={order.id}>
											#{order.order_number}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormField>
						<FormField
							label={t("payments.amount")}
							required
							error={errors.amount?.message}
						>
							<Input
								type="number"
								min={0}
								step="0.01"
								{...register("amount", {
									valueAsNumber: true,
									required: t("common.required"),
									min: {
										value: 0.01,
										message: t("validation.positive_value"),
									},
								})}
							/>
						</FormField>
						<FormField
							label={t("payments.method")}
							required
							error={errors.payment_method?.message}
						>
							<Select
								value={watch("payment_method")}
								onValueChange={(val) =>
									setValue("payment_method", val as PaymentMethod)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PAYMENT_METHODS.map((method) => (
										<SelectItem key={method} value={method}>
											{t(`payments.method_${method}`)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormField>
						<FormField label={t("payments.reference")}>
							<Input {...register("reference")} />
						</FormField>
						<FormField label={t("payments.add_to_balance")}>
							<div className="flex items-center gap-2">
								<Switch
									checked={addToBalance}
									onCheckedChange={(val) => setValue("add_to_balance", val)}
								/>
								<span className="text-sm text-on-surface">
									{t("payments.add_to_balance")}
								</span>
							</div>
						</FormField>
						<div className="col-span-1 md:col-span-2">
							<FormField label={t("payments.notes")}>
								<Textarea {...register("notes")} />
							</FormField>
						</div>
					</div>
				</div>

				<div className="flex justify-end gap-3">
					<Button variant="outline" onClick={() => navigate("/payments")}>
						{t("common.cancel")}
					</Button>
					<Button type="submit" disabled={mutation.isPending}>
						{t("common.create")}
					</Button>
				</div>
			</form>
		</PageFormLayout>
	);
}
