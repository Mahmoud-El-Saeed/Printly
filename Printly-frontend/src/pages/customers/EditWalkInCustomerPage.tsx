import { useMutation, useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FormField } from "@/components/shared/FormField";
import { PageFormLayout } from "@/components/shared/PageFormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { customersApi } from "@/lib/api/customers";
import type { WalkInCustomerUpdate } from "@/types/customer";

interface WalkInCustomerFormValues {
	name: string;
	phone: string;
	notes: string;
}

export default function EditWalkInCustomerPage() {
	const { t } = useLanguage();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();

	const { data: customer, isLoading } = useQuery({
		queryKey: ["walkInCustomer", id],
		queryFn: () => customersApi.getWalkIn(id ?? ""),
		enabled: !!id,
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<WalkInCustomerFormValues>({
		values: customer
			? {
					name: customer.name,
					phone: customer.phone ?? "",
					notes: customer.notes ?? "",
				}
			: undefined,
	});

	const updateMutation = useMutation({
		mutationFn: async (data: WalkInCustomerFormValues) => {
			const updateData: WalkInCustomerUpdate = {
				name: data.name,
				phone: data.phone || undefined,
				notes: data.notes || undefined,
			};
			return customersApi.updateWalkIn(id ?? "", updateData);
		},
		onSuccess: () => {
			navigate("/customers/walk-in");
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const onSubmit = (data: WalkInCustomerFormValues) => {
		updateMutation.mutate(data);
	};

	return (
		<PageFormLayout
			title={t("customers.edit_walkin_title")}
			subtitle={t("customers.customer_info")}
			backHref="/customers/walk-in"
			isLoading={isLoading}
		>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
					<div className="bg-surface-container px-6 py-3 border-b border-outline-variant">
						<h3 className="font-bold text-sm text-on-surface">
							{t("customers.customer_info")}
						</h3>
					</div>
					<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label={t("customers.name")}
							error={errors.name?.message}
							required
						>
							<Input
								{...register("name", {
									required: t("common.required"),
									minLength: {
										value: 3,
										message: t("auth.validation.name_min"),
									},
								})}
								className="h-11"
							/>
						</FormField>
						<FormField
							label={t("customers.phone")}
							error={errors.phone?.message}
						>
							<Input {...register("phone")} className="h-11" />
						</FormField>
						<FormField
							label={t("customers.notes")}
							error={errors.notes?.message}
						>
							<Textarea {...register("notes")} className="min-h-[100px]" />
						</FormField>
					</div>
				</div>
				<div className="flex justify-end gap-3">
					<Button
						variant="outline"
						onClick={() => navigate("/customers/walk-in")}
					>
						{t("common.cancel")}
					</Button>
					<Button
						type="submit"
						disabled={updateMutation.isPending}
						className="gap-2"
					>
						{updateMutation.isPending ? t("common.saving") : t("common.save")}
						<Save className="h-4 w-4" />
					</Button>
				</div>
			</form>
		</PageFormLayout>
	);
}
