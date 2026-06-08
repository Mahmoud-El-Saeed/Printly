import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FormField } from "@/components/shared/FormField";
import { PageFormLayout } from "@/components/shared/PageFormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { materialsApi } from "@/lib/api/materials";
import type { MaterialUpdate } from "@/types/material";

type FormValues = {
	name: string;
	unit: string;
	min_stock_alert: number;
	cost_per_unit: number;
	is_active: boolean;
};

export default function EditMaterialPage() {
	const { id } = useParams<{ id: string }>();
	const materialId = id ?? "";
	const { t } = useLanguage();
	const navigate = useNavigate();

	const { data: material, isLoading } = useQuery({
		queryKey: ["material", materialId],
		queryFn: () => materialsApi.get(materialId),
		enabled: !!materialId,
	});

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<FormValues>({
		values: material
			? {
					name: material.name,
					unit: material.unit,
					min_stock_alert: material.min_stock_alert,
					cost_per_unit: material.cost_per_unit,
					is_active: material.is_active,
				}
			: undefined,
	});

	const maxChars = (max: number) =>
		t("validation.max_chars").replace("{max}", String(max));

	const mutation = useMutation({
		mutationFn: (data: MaterialUpdate) => materialsApi.update(materialId, data),
		onSuccess: () => navigate(`/materials/${materialId}`),
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const onSubmit = (data: FormValues) => {
		mutation.mutate({
			name: data.name,
			unit: data.unit,
			min_stock_alert: data.min_stock_alert,
			cost_per_unit: data.cost_per_unit,
			is_active: data.is_active,
		});
	};

	return (
		<PageFormLayout
			title={t("materials.edit_title")}
			subtitle={t("materials.subtitle")}
			backHref={`/materials/${materialId}`}
			isLoading={isLoading}
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
						<FormField label={t("materials.status")}>
							<div className="flex items-center gap-2">
								<Switch
									checked={watch("is_active")}
									onCheckedChange={(val) => setValue("is_active", val)}
								/>
								<span className="text-sm text-on-surface">
									{t("materials.active")}
								</span>
							</div>
						</FormField>
					</div>
				</div>

				<div className="flex justify-end gap-3">
					<Button
						variant="outline"
						onClick={() => navigate(`/materials/${materialId}`)}
					>
						{t("common.cancel")}
					</Button>
					<Button type="submit" disabled={mutation.isPending}>
						{t("common.save")}
					</Button>
				</div>
			</form>
		</PageFormLayout>
	);
}
