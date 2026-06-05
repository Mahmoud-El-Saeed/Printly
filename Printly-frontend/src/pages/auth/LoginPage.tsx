import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
		<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
			{/* Language Switcher at top */}
			<div className="absolute top-4 left-4">
				<LanguageSwitcher />
			</div>

			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">{t("app.name")}</CardTitle>
					<CardDescription>{t("auth.login_description")}</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">{t("auth.email")}</Label>
							<Input
								id="email"
								type="email"
								placeholder="example@email.com"
								dir="ltr"
								{...register("email")}
							/>
							{errors.email && (
								<p className="text-sm text-destructive">
									{errors.email.message}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">{t("auth.password")}</Label>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								{...register("password")}
							/>
							{errors.password && (
								<p className="text-sm text-destructive">
									{errors.password.message}
								</p>
							)}
						</div>
					</CardContent>
					<CardFooter className="flex flex-col gap-3">
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
							{t("auth.login_button")}
						</Button>
						<div className="flex gap-4 text-sm text-muted-foreground w-full justify-center">
							<Link
								to="/register/shop-owner"
								className="hover:text-primary transition-colors"
							>
								{t("auth.create_shop_owner")}
							</Link>
							<span>|</span>
							<Link
								to="/register/customer"
								className="hover:text-primary transition-colors"
							>
								{t("auth.create_customer")}
							</Link>
						</div>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
