import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2, Printer } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { authApi } from "@/lib/api/auth";

export default function RegisterShopOwnerPage() {
	const { t } = useLanguage();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const registerSchema = z.object({
		email: z.string().email(t("auth.validation.email_invalid")),
		password: z.string().min(8, t("auth.validation.password_min")),
		full_name: z.string().min(3, t("auth.validation.name_min")),
		shop_name: z.string().min(3, t("auth.validation.shop_name_min")),
		shop_phone: z.string().optional(),
		shop_address: z.string().optional(),
	});

	type RegisterFormData = z.infer<typeof registerSchema>;

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
	});

	const onSubmit = async (data: RegisterFormData) => {
		setIsLoading(true);
		try {
			await authApi.registerShopOwner(data);
			toast.success(t("auth.register_success"));
			navigate("/login");
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
							Fill in the details below to set up your business workspace.
						</p>
					</div>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label htmlFor="full_name">{t("auth.full_name")}</Label>
								<Input
									id="full_name"
									placeholder="John Doe"
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
									placeholder="john@example.com"
									{...register("email")}
								/>
								{errors.email && (
									<p className="text-sm text-destructive">
										{errors.email.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label htmlFor="shop_phone">{t("auth.phone")}</Label>
								<Input
									id="shop_phone"
									type="tel"
									dir="ltr"
									placeholder="+1 (555) 000-0000"
									{...register("shop_phone")}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="shop_name">{t("auth.shop_name")}</Label>
								<Input
									id="shop_name"
									placeholder="Elite Prints Co."
									{...register("shop_name")}
								/>
								{errors.shop_name && (
									<p className="text-sm text-destructive">
										{errors.shop_name.message}
									</p>
								)}
							</div>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="shop_address">{t("auth.address")}</Label>
							<Input
								id="shop_address"
								placeholder="123 Printing Ave, Design District"
								{...register("shop_address")}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="password">{t("auth.password")}</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="••••••••"
									{...register("password")}
								/>
								<Button
									type="button"
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
							{errors.password && (
								<p className="text-sm text-destructive">
									{errors.password.message}
								</p>
							)}
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
							{t("auth.register_button")}
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
