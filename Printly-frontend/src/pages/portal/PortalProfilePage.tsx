import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Phone, User } from "lucide-react";
import { useState } from "react";
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
	const [profile, setProfile] = useState<{
		email: string;
		full_name: string;
		phone: string | null;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<ProfileFormData>({
		resolver: zodResolver(profileSchema),
	});

	useState(() => {
		portalApi
			.getProfile()
			.then((data) => {
				setProfile(data);
				reset({ full_name: data.full_name, phone: data.phone ?? "" });
				setIsLoading(false);
			})
			.catch(() => setIsLoading(false));
	});

	const onSubmit = async (data: ProfileFormData) => {
		try {
			const updated = await portalApi.updateProfile({
				full_name: data.full_name,
				phone: data.phone || undefined,
			});
			setProfile(updated);
			toast.success(t("portal.profile_updated"));
		} catch {
			toast.error(t("common.error"));
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
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

					<Button type="submit" disabled={isSubmitting} className="w-full">
						{isSubmitting ? (
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
