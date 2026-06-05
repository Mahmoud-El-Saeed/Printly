import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { authApi } from "@/lib/api/auth";

export default function RegisterCustomerPage() {
	const { t } = useLanguage();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);

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
		<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
			<div className="absolute top-4 left-4">
				<LanguageSwitcher />
			</div>

			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">{t("app.name")}</CardTitle>
					<CardDescription>
						{t("auth.register_customer_description")}
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="full_name">{t("auth.full_name")}</Label>
							<Input
								id="full_name"
								placeholder="محمد أحمد"
								{...register("full_name")}
							/>
							{errors.full_name && (
								<p className="text-sm text-destructive">
									{errors.full_name.message}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">{t("auth.email")}</Label>
							<Input
								id="email"
								type="email"
								dir="ltr"
								placeholder="example@email.com"
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
							{isLoading ? <Loader2 className="animate-spin" /> : <UserPlus />}
							{t("auth.register_button")}
						</Button>
						<Link
							to="/login"
							className="text-sm text-muted-foreground hover:text-primary transition-colors"
						>
							{t("auth.have_account")} {t("auth.login")}
						</Link>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
