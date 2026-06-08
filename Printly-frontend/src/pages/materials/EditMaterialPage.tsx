import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/FormField";
import { PageFormLayout } from "@/components/shared/PageFormLayout";
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

	const mutation = useMutation({
		mutationFn: (data: MaterialUpdate) =>
			materialsApi.update(materialId, data),
		onSuccess: () => navigate(`/materials/${materialId}`),
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
				<div
					className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden"
				>
					<div
						className="bg-surface-container px-6 py-3 border-b border-outline-variant"
					>
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
										message: "Max 200 characters",
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
										message: "Max 20 characters",
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
										message: "Must be >= 0",
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
										message: "Must be >= 0",
									},
								})}
							/>
						</FormField>
						<FormField label={t("materials.status")}>
							<label className="flex items-center gap-2">
								<input
									type="checkbox"
									{...register("is_active")}
									className="h-4 w-4 rounded border-input"
								/>
								<span className="text-sm text-on-surface">
									{t("materials.active")}
								</span>
							</label>
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