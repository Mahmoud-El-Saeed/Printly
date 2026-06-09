import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, Lock, Mail, Printer } from "lucide-react";
import { useState } from "react";
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

export default function LoginPage() {
	const { login } = useAuth();
	const { t } = useLanguage();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);

	const loginSchema = z.object({
		email: z.string().email(t("auth.validation.email_invalid")),
		password: z.string().min(1, t("auth.validation.password_required")),
	});

	type LoginFormData = z.infer<typeof loginSchema>;

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginFormData) => {
		setIsLoading(true);
		try {
			await login(data.email, data.password);
			toast.success(t("auth.login_success"));
			navigate("/", { replace: true });
		} catch (error: unknown) {
			const err = error as { response?: { data?: { detail?: string } } };
			toast.error(err.response?.data?.detail || t("auth.login_failed"));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
			<div className="fixed top-6 start-6">
				<LanguageSwitcher />
			</div>

			<main className="w-full max-w-[440px] flex flex-col items-center">
				<div className="mb-6 text-center flex flex-col items-center gap-2">
					<div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground mb-2">
						<Printer className="h-8 w-8" />
					</div>
					<h1 className="font-bold text-2xl tracking-tight text-primary">
						{t("app.name")}
					</h1>
					<p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
						Management System
					</p>
				</div>

				<div className="w-full bg-card border border-border p-10 rounded-xl">
					<div className="mb-8">
						<h2 className="font-bold text-xl text-foreground mb-1">
							{t("auth.login_title")}
						</h2>
						<p className="text-xs text-muted-foreground">
							{t("auth.login_description")}
						</p>
					</div>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="email">{t("auth.email")}</Label>
							<div className="relative">
								<Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									id="email"
									type="email"
									placeholder="name@printshop.com"
									dir="ltr"
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
									type="password"
									placeholder="••••••••"
									dir="ltr"
									className="ps-10"
									{...register("password")}
								/>
							</div>
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
							{t("auth.login_button")}
						</Button>
					</form>
				</div>

				<div className="mt-8 grid grid-cols-1 gap-4 w-full">
					<div className="flex items-center justify-center gap-4 text-xs">
						<span className="h-px flex-1 bg-border" />
						<span className="text-muted-foreground">
							{t("auth.no_account")}
						</span>
						<span className="h-px flex-1 bg-border" />
					</div>
					<div className="flex flex-col sm:flex-row gap-3">
						<Link
							to="/register/shop-owner"
							className="flex-1 text-center py-2.5 px-4 border border-border rounded-lg text-primary font-medium text-sm bg-muted hover:bg-secondary transition-colors"
						>
							{t("auth.create_shop_owner")}
						</Link>
						<Link
							to="/register/customer"
							className="flex-1 text-center py-2.5 px-4 border border-border rounded-lg text-primary font-medium text-sm bg-muted hover:bg-secondary transition-colors"
						>
							{t("auth.create_customer")}
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
