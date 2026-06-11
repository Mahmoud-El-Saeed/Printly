import { useMutation, useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { FormField } from "@/components/shared/FormField";
import { PageFormLayout } from "@/components/shared/PageFormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { customersApi } from "@/lib/api/customers";
import type { CustomerMemberUpdate } from "@/types/customer";

interface MemberFormValues {
	name: string;
	email: string;
	phone: string;
}

export default function EditMemberPage() {
	const { t } = useLanguage();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();

	const { data: member, isLoading } = useQuery({
		queryKey: ["member", id],
		queryFn: () => customersApi.getMember(id ?? ""),
		enabled: !!id,
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<MemberFormValues>({
		values: member
			? {
					name: member.name,
					email: member.email ?? "",
					phone: member.phone ?? "",
				}
			: undefined,
	});

	const updateMutation = useMutation({
		mutationFn: async (data: MemberFormValues) => {
			const updateData: CustomerMemberUpdate = {
				name: data.name,
				email: data.email || undefined,
				phone: data.phone || undefined,
			};
			return customersApi.updateMember(id ?? "", updateData);
		},
		onSuccess: () => {
			navigate("/customers/members");
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const onSubmit = (data: MemberFormValues) => {
		updateMutation.mutate(data);
	};

	return (
		<PageFormLayout
			title={t("customers.edit_member_title")}
			subtitle={t("customers.member_info")}
			backHref="/customers/members"
			isLoading={isLoading}
		>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
					<div className="bg-surface-container px-6 py-3 border-b border-outline-variant">
						<h3 className="font-bold text-sm text-on-surface">
							{t("customers.member_info")}
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
							label={t("customers.email")}
							error={errors.email?.message}
						>
							<Input
								{...register("email", {
									pattern: {
										value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
										message: t("auth.validation.email_invalid"),
									},
								})}
								type="email"
								className="h-11"
							/>
						</FormField>
						<FormField
							label={t("customers.phone")}
							error={errors.phone?.message}
							required
						>
							<Input
								{...register("phone", {
									required: t("common.required"),
								})}
								dir="ltr"
								className="h-11"
							/>
						</FormField>
					</div>
				</div>
				<div className="flex justify-end gap-3">
					<Button
						variant="outline"
						onClick={() => navigate("/customers/members")}
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
