import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FormField } from "@/components/shared/FormField";
import { PageFormLayout } from "@/components/shared/PageFormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { materialsApi } from "@/lib/api/materials";
import type { MaterialCreate } from "@/types/material";

type FormValues = {
	name: string;
	unit: string;
	current_stock: number;
	min_stock_alert: number;
	cost_per_unit: number;
	price_per_unit: number;
};

export default function CreateMaterialPage() {
	const { t } = useLanguage();
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<FormValues>({
		defaultValues: {
			name: "",
			unit: "",
			current_stock: 0,
			min_stock_alert: 0,
			cost_per_unit: 0,
			price_per_unit: 0,
		},
	});

	const maxChars = (max: number) =>
		t("validation.max_chars").replace("{max}", String(max));

	const mutation = useMutation({
		mutationFn: (data: MaterialCreate) => materialsApi.create(data),
		onSuccess: () => navigate("/materials"),
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const onSubmit = (data: FormValues) => {
		mutation.mutate({
			name: data.name,
			unit: data.unit,
			current_stock: data.current_stock ?? undefined,
			min_stock_alert: data.min_stock_alert ?? undefined,
			cost_per_unit: data.cost_per_unit ?? undefined,
			price_per_unit: data.price_per_unit ?? undefined,
		});
	};

	return (
		<PageFormLayout
			title={t("materials.create_title")}
			subtitle={t("materials.subtitle")}
			backHref="/materials"
		>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
					<div className="bg-surface-container px-6 py-3 border-b border-outline-variant">
						<span className="text-sm font-bold text-on-surface">
							{t("materials.material_info")}
						</span>
					</div>
					<div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label={t("materials.name")}
							required
							error={errors.name?.message}
						>
							<Input
								{...register("name", {
									required: t("common.required"),
									maxLength: {
										value: 200,
										message: maxChars(200),
									},
								})}
							/>
						</FormField>
						<FormField
							label={t("materials.unit")}
							required
							error={errors.unit?.message}
						>
							<Input
								{...register("unit", {
									required: t("common.required"),
									maxLength: {
										value: 20,
										message: maxChars(20),
									},
								})}
							/>
						</FormField>
						<FormField
							label={t("materials.current_stock")}
							error={errors.current_stock?.message}
						>
							<Input
								type="number"
								min={0}
								step="1"
								{...register("current_stock", {
									valueAsNumber: true,
									min: {
										value: 0,
										message: t("validation.min_value").replace("{min}", "0"),
									},
								})}
							/>
						</FormField>
						<FormField
							label={t("materials.min_alert")}
							error={errors.min_stock_alert?.message}
						>
							<Input
								type="number"
								min={0}
								step="1"
								{...register("min_stock_alert", {
									valueAsNumber: true,
									min: {
										value: 0,
										message: t("validation.min_value").replace("{min}", "0"),
									},
								})}
							/>
						</FormField>
						<FormField
							label={t("materials.cost_per_unit")}
							error={errors.cost_per_unit?.message}
						>
							<Input
								type="number"
								min={0}
								step="0.01"
								{...register("cost_per_unit", {
									valueAsNumber: true,
									min: {
										value: 0,
										message: t("validation.min_value").replace("{min}", "0"),
									},
								})}
							/>
						</FormField>
						<FormField
							label={t("materials.price_per_unit")}
							error={errors.price_per_unit?.message}
						>
							<Input
								type="number"
								min={0}
								step="0.01"
								{...register("price_per_unit", {
									valueAsNumber: true,
									min: {
										value: 0,
										message: t("validation.min_value").replace("{min}", "0"),
									},
								})}
							/>
						</FormField>
					</div>
				</div>

				<div className="flex justify-end gap-3">
					<Button variant="outline" onClick={() => navigate("/materials")}>
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
