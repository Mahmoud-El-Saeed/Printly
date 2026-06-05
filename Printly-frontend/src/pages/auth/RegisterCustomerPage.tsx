import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
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
import { authApi } from "@/lib/api/auth";

const registerSchema = z.object({
	email: z.string().email("البريد الإلكتروني غير صالح"),
	password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
	full_name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterCustomerPage() {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);

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
			toast.success("تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن");
			navigate("/login");
		} catch (error: unknown) {
			const err = error as { response?: { data?: { detail?: string } } };
			toast.error(err.response?.data?.detail || "فشل إنشاء الحساب");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">Printly</CardTitle>
					<CardDescription>إنشاء حساب عميل</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="full_name">الاسم الكامل</Label>
							<Input
								id="full_name"
								placeholder="أحمد محمد"
								{...register("full_name")}
							/>
							{errors.full_name && (
								<p className="text-sm text-destructive">
									{errors.full_name.message}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">البريد الإلكتروني</Label>
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
							<Label htmlFor="password">كلمة المرور</Label>
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
							إنشاء الحساب
						</Button>
						<Link
							to="/login"
							className="text-sm text-muted-foreground hover:text-primary transition-colors"
						>
							لديك حساب؟ تسجيل الدخول
						</Link>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
