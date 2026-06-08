import { zodResolver } from "@hookform/resolvers/zod";
import {
	ArrowRight,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	Mail,
	Printer,
	User,
} from "lucide-react";
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

export default function RegisterCustomerPage() {
	const { t } = useLanguage();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const registerSchema = z.object({
		email: z.string().email(t("auth.validation.email_invalid")),
		password: z.string().min(8, t("auth.validation.password_min")),
		full_name: z.string().min(3, t("auth.validation.name_min")),
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
			await authApi.registerCustomer(data);
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

			<main className="w-full max-w-[440px]">
				<div className="flex flex-col items-center mb-6 text-center">
					<div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground mb-4">
						<Printer className="h-6 w-6" />
					</div>
					<h1 className="font-bold text-2xl tracking-tight text-primary">
						{t("app.name")}
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{t("auth.register_customer_title")}
					</p>
				</div>

				<div className="bg-card border border-border rounded-xl p-8">
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="full_name">{t("auth.full_name")}</Label>
							<div className="relative">
								<User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									id="full_name"
									placeholder={t("auth.full_name_placeholder")}
									className="ps-10"
									{...register("full_name")}
								/>
							</div>
							{errors.full_name && (
								<p className="text-sm text-destructive">
									{errors.full_name.message}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">{t("auth.email")}</Label>
							<div className="relative">
								<Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									id="email"
									type="email"
									dir="ltr"
									placeholder="name@example.com"
									className="ps-10"
									{...register("email")}
								/>
							</div>
							{errors.email && (
								<p className="text-sm text-destructive">
									{errors.email.message}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">{t("auth.password")}</Label>
							<div className="relative">
								<Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="••••••••"
									className="ps-10 pe-12"
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
							<p className="text-xs text-muted-foreground">
								{t("auth.validation.password_hint")}
							</p>
							{errors.password && (
								<p className="text-sm text-destructive">
									{errors.password.message}
								</p>
							)}
						</div>
						<Button
							type="submit"
							className="w-full py-3.5 gap-2"
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader2 className="animate-spin h-4 w-4" />
							) : (
								<ArrowRight className="h-4 w-4" />
							)}
							{t("auth.register_button")}
						</Button>
					</form>
					<div className="mt-8 pt-6 border-t border-border text-center">
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
				</div>
			</main>
		</div>
	);
}
