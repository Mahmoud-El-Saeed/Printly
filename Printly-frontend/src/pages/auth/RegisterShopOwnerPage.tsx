import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { authApi } from "@/lib/api/auth";

function getPasswordStrength(
	pw: string,
	t: (key: string) => string,
): { label: string; color: string; width: string } {
	if (!pw) return { label: "", color: "", width: "0%" };
	let score = 0;
	if (pw.length >= 8) score++;
	if (pw.length >= 12) score++;
	if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
	if (/\d/.test(pw)) score++;
	if (/[^a-zA-Z0-9]/.test(pw)) score++;

	if (score <= 1)
		return {
			label: t("auth.validation.weak"),
			color: "bg-red-500",
			width: "25%",
		};
	if (score <= 2)
		return {
			label: t("auth.validation.fair"),
			color: "bg-amber-500",
			width: "50%",
		};
	if (score <= 3)
		return {
			label: t("auth.validation.good"),
			color: "bg-blue-500",
			width: "75%",
		};
	return {
		label: t("auth.validation.strong"),
		color: "bg-emerald-500",
		width: "100%",
	};
}

export default function RegisterShopOwnerPage() {
	const { t } = useLanguage();
	const navigate = useNavigate();
	const { login } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const registerSchema = z
		.object({
			email: z.string().email(t("auth.validation.email_invalid")),
			password: z
				.string()
				.min(8, t("auth.validation.password_min"))
				.regex(/^[\x20-\x7E]+$/, t("auth.validation.password_english_only")),
			confirm_password: z
				.string()
				.min(1, t("auth.validation.password_required")),
			full_name: z.string().min(3, t("auth.validation.name_min")),
			shop_name: z.string().min(3, t("auth.validation.shop_name_min")),
			shop_phone: z.string().optional(),
			shop_address: z.string().optional(),
		})
		.refine((data) => data.password === data.confirm_password, {
			message: t("auth.validation.password_mismatch"),
			path: ["confirm_password"],
		});

	type RegisterFormData = z.infer<typeof registerSchema>;

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
		mode: "onChange",
	});

	const passwordValue = watch("password");
	const strength = useMemo(
		() => getPasswordStrength(passwordValue || "", t),
		[passwordValue, t],
	);

	const onSubmit = async (data: RegisterFormData) => {
		setIsLoading(true);
		try {
			await authApi.registerShopOwner({
				email: data.email,
				password: data.password,
				full_name: data.full_name,
				shop_name: data.shop_name,
				shop_phone: data.shop_phone,
				shop_address: data.shop_address,
			});
			await login(data.email, data.password);
			toast.success(t("auth.register_success"));
			navigate("/");
		} catch (error: unknown) {
			const err = error as { response?: { data?: { detail?: string } } };
			toast.error(err.response?.data?.detail || t("auth.register_failed"));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
			<div className="fixed top-6 start-6">
				<LanguageSwitcher />
			</div>

			<main className="w-full max-w-lg">
				<div className="text-center mb-8">
					<div className="flex flex-col items-center mb-4">
						<div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground mb-4">
							<Printer className="h-6 w-6" />
						</div>
					</div>
					<h1 className="font-bold text-2xl tracking-tight text-primary">
						{t("app.name")}
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{t("auth.register_shop_owner_description")}
					</p>
				</div>

				<div className="bg-card border border-border rounded-xl p-8">
					<div className="mb-8">
						<h2 className="font-bold text-xl text-foreground mb-1">
							{t("auth.register_shop_owner_title")}
						</h2>
						<p className="text-xs text-muted-foreground">
							{t("auth.register_shop_owner_description")}
						</p>
					</div>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<div>
							<h3 className="font-bold text-sm text-primary mb-4">
								{t("auth.personal_info")}
							</h3>
							<div className="space-y-4">
								<div className="space-y-1.5">
									<Label htmlFor="full_name">{t("auth.full_name")}</Label>
									<Input
										id="full_name"
										placeholder={t("auth.full_name_placeholder")}
										{...register("full_name")}
									/>
									{errors.full_name && (
										<p className="text-sm text-destructive">
											{errors.full_name.message}
										</p>
									)}
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="email">{t("auth.email")}</Label>
									<Input
										id="email"
										type="email"
										dir="ltr"
										placeholder={t("auth.email_placeholder")}
										{...register("email")}
									/>
									{errors.email && (
										<p className="text-sm text-destructive">
											{errors.email.message}
										</p>
									)}
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<Label htmlFor="password">{t("auth.password")}</Label>
										<div className="relative">
											<Input
												id="password"
												type={showPassword ? "text" : "password"}
												placeholder="••••••••"
												dir="ltr"
												{...register("password")}
											/>
											<Button
												type="button"
												aria-label="Toggle password visibility"
												variant="ghost"
												size="icon"
												className="absolute end-3 top-1/2 -translate-y-1/2"
												onClick={() => setShowPassword(!showPassword)}
											>
												{showPassword ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
											</Button>
										</div>
										{passwordValue && (
											<div className="space-y-1">
												<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
													<div
														className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
														style={{ width: strength.width }}
													/>
												</div>
												<p
													className="text-xs text-muted-foreground text-end"
													dir="ltr"
												>
													{strength.label}
												</p>
											</div>
										)}
										{errors.password && (
											<p className="text-sm text-destructive">
												{errors.password.message}
											</p>
										)}
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="confirm_password">
											{t("auth.confirm_password")}
										</Label>
										<div className="relative">
											<Input
												id="confirm_password"
												type={showConfirmPassword ? "text" : "password"}
												placeholder="••••••••"
												dir="ltr"
												{...register("confirm_password")}
											/>
											<Button
												type="button"
												aria-label="Toggle confirm password visibility"
												variant="ghost"
												size="icon"
												className="absolute end-3 top-1/2 -translate-y-1/2"
												onClick={() =>
													setShowConfirmPassword(!showConfirmPassword)
												}
											>
												{showConfirmPassword ? (
													<EyeOff className="h-4 w-4" />
												) : (
													<Eye className="h-4 w-4" />
												)}
											</Button>
										</div>
										{errors.confirm_password && (
											<p className="text-sm text-destructive">
												{errors.confirm_password.message}
											</p>
										)}
									</div>
								</div>
							</div>
						</div>

						<div className="border-t border-border pt-6">
							<h3 className="font-bold text-sm text-primary mb-4">
								{t("auth.shop_info")}
							</h3>
							<div className="space-y-4">
								<div className="space-y-1.5">
									<Label htmlFor="shop_name">{t("auth.shop_name")}</Label>
									<Input
										id="shop_name"
										placeholder={t("auth.shop_name_placeholder")}
										{...register("shop_name")}
									/>
									{errors.shop_name && (
										<p className="text-sm text-destructive">
											{errors.shop_name.message}
										</p>
									)}
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="shop_phone">{t("auth.phone")}</Label>
									<Input
										id="shop_phone"
										type="tel"
										dir="ltr"
										placeholder={t("auth.phone_placeholder")}
										{...register("shop_phone")}
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="shop_address">{t("auth.address")}</Label>
									<Input
										id="shop_address"
										placeholder={t("auth.address_placeholder")}
										{...register("shop_address")}
									/>
								</div>
							</div>
						</div>

						<Button
							type="submit"
							className="w-full py-3.5 gap-2 mt-4"
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader2 className="animate-spin h-4 w-4" />
							) : (
								<ArrowRight className="h-4 w-4" />
							)}
							{t("auth.create_shop_owner")}
						</Button>
						<div className="pt-6 text-center border-t border-border">
							<p className="text-sm text-muted-foreground">
								{t("auth.have_account")}{" "}
								<Link
									to="/login"
									className="text-primary font-bold hover:underline"
								>
									{t("auth.login")}
								</Link>
							</p>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}
