import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Phone, User } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";

const profileSchema = z.object({
	full_name: z.string().min(3, "Name must be at least 3 characters"),
	phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function PortalProfilePage() {
	const { t, isRTL } = useLanguage();
	const queryClient = useQueryClient();

	const {
		data: profile,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["portal-profile"],
		queryFn: portalApi.getProfile,
	});

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<ProfileFormData>({
		resolver: zodResolver(profileSchema),
	});

	useEffect(() => {
		if (profile) {
			reset({ full_name: profile.full_name, phone: profile.phone ?? "" });
		}
	}, [profile, reset]);

	const updateMutation = useMutation({
		mutationFn: portalApi.updateProfile,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["portal-profile"] });
			toast.success(t("portal.profile_updated"));
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const onSubmit = (data: ProfileFormData) => {
		updateMutation.mutate({
			full_name: data.full_name,
			phone: data.phone || undefined,
		});
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex items-center justify-center py-12 text-red-500">
				{t("common.error")}
			</div>
		);
	}

	return (
		<div className="max-w-lg mx-auto">
			<h1 className="text-xl font-bold mb-6">{t("portal.profile_title")}</h1>

			<div className="bg-card border border-border rounded-xl p-6">
				<h2 className="font-bold text-sm mb-4">{t("portal.edit_profile")}</h2>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label>{t("portal.full_name")}</Label>
						<div className={`relative ${isRTL ? "direction-rtl" : ""}`}>
							<User
								className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`}
							/>
							<Input
								{...register("full_name")}
								className={isRTL ? "pr-10 pl-3" : "pl-10 pr-3"}
								placeholder={t("auth.full_name")}
							/>
						</div>
						{errors.full_name && (
							<p className="text-xs text-red-500">{errors.full_name.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label>{t("auth.email")}</Label>
						<div className={`relative ${isRTL ? "direction-rtl" : ""}`}>
							<Mail
								className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`}
							/>
							<Input
								value={profile?.email ?? ""}
								disabled
								className={`bg-muted ${isRTL ? "pr-10 pl-3" : "pl-10 pr-3"}`}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>{t("portal.phone")}</Label>
						<div className={`relative ${isRTL ? "direction-rtl" : ""}`}>
							<Phone
								className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`}
							/>
							<Input
								{...register("phone")}
								className={isRTL ? "pr-10 pl-3" : "pl-10 pr-3"}
								placeholder={t("portal.phone_placeholder")}
							/>
						</div>
					</div>

					<Button
						type="submit"
						disabled={isSubmitting || updateMutation.isPending}
						className="w-full"
					>
						{isSubmitting || updateMutation.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							t("portal.save_profile")
						)}
					</Button>
				</form>
			</div>
		</div>
	);
}
