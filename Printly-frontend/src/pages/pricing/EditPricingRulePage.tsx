import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
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
import { pricingApi } from "@/lib/api/pricing";
import type {
	PricingComponentType,
	PricingRuleUpdate,
	PricingUnitType,
} from "@/types/pricing";

type FormValues = {
	component_name: string;
	component_type: PricingComponentType;
	price: number;
	unit_type: PricingUnitType;
	description: string;
	is_active: boolean;
};

export default function EditPricingRulePage() {
	const { id } = useParams<{ id: string }>();
	const ruleId = id ?? "";
	const { t } = useLanguage();
	const navigate = useNavigate();

	const { data: rule, isLoading } = useQuery({
		queryKey: ["pricing-rule", ruleId],
		queryFn: () => pricingApi.getRule(ruleId),
		enabled: !!ruleId,
	});

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<FormValues>({
		values: rule
			? {
					component_name: rule.component_name,
					component_type: rule.component_type,
					price: rule.price,
					unit_type: rule.unit_type,
					description: rule.description ?? "",
					is_active: rule.is_active,
				}
			: undefined,
	});

	const mutation = useMutation({
		mutationFn: (data: PricingRuleUpdate) =>
			pricingApi.updateRule(ruleId, data),
		onSuccess: () => navigate("/pricing"),
	});

	const onSubmit = (data: FormValues) => {
		mutation.mutate({
			component_name: data.component_name,
			component_type: data.component_type,
			price: data.price,
			unit_type: data.unit_type,
			description: data.description || undefined,
			is_active: data.is_active,
		});
	};

	const isActive = watch("is_active");
	const componentType = watch("component_type");
	const unitType = watch("unit_type");

	return (
		<PageFormLayout
			title={t("pricing.edit_title")}
			subtitle={t("pricing.subtitle")}
			backHref="/pricing"
			isLoading={isLoading}
		>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
					<div className="bg-surface-container px-6 py-3 border-b border-outline-variant">
						<span className="text-sm font-bold text-on-surface">
							{t("pricing.rule_info")}
						</span>
					</div>
					<div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label={t("pricing.component_name")}
							required
							error={errors.component_name?.message}
						>
							<Input
								{...register("component_name", {
									required: t("common.required"),
									maxLength: {
										value: 100,
										message: "Max 100 characters",
									},
								})}
							/>
						</FormField>
						<FormField
							label={t("pricing.component_type")}
							required
							error={errors.component_type?.message}
						>
							<Select
								value={componentType}
								onValueChange={(val: PricingComponentType) =>
									setValue("component_type", val, { shouldValidate: true })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="page_print">
										{t("pricing.type_page_print")}
									</SelectItem>
									<SelectItem value="cover">
										{t("pricing.type_cover")}
									</SelectItem>
									<SelectItem value="binding">
										{t("pricing.type_binding")}
									</SelectItem>
									<SelectItem value="lamination">
										{t("pricing.type_lamination")}
									</SelectItem>
									<SelectItem value="extra_service">
										{t("pricing.type_extra_service")}
									</SelectItem>
								</SelectContent>
							</Select>
						</FormField>
						<FormField
							label={t("pricing.price")}
							required
							error={errors.price?.message}
						>
							<Input
								type="number"
								min={0.01}
								step="0.01"
								{...register("price", {
									required: t("common.required"),
									valueAsNumber: true,
									min: {
										value: 0.01,
										message: "Must be > 0",
									},
								})}
							/>
						</FormField>
						<FormField
							label={t("pricing.unit_type")}
							required
							error={errors.unit_type?.message}
						>
							<Select
								value={unitType}
								onValueChange={(val: PricingUnitType) =>
									setValue("unit_type", val, { shouldValidate: true })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="per_page">
										{t("pricing.unit_per_page")}
									</SelectItem>
									<SelectItem value="per_unit">
										{t("pricing.unit_per_unit")}
									</SelectItem>
								</SelectContent>
							</Select>
						</FormField>
						<FormField label={t("pricing.description")}>
							<Textarea {...register("description")} />
						</FormField>
						<FormField label={t("pricing.status")}>
							<div className="flex items-center gap-2">
								<Switch
									checked={isActive}
									onCheckedChange={(checked: boolean) =>
										setValue("is_active", checked)
									}
								/>
								<span className="text-sm text-on-surface">
									{isActive ? t("pricing.active") : t("pricing.inactive")}
								</span>
							</div>
						</FormField>
					</div>
				</div>

				<div className="flex justify-end gap-3">
					<Button variant="outline" onClick={() => navigate("/pricing")}>
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
