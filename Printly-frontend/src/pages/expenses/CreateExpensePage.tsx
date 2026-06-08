import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FormField } from "@/components/shared/FormField";
import { PageFormLayout } from "@/components/shared/PageFormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { expensesApi } from "@/lib/api/expenses";
import type { ExpenseCategory, ExpenseCreate } from "@/types/expense";

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
	"rent",
	"salaries",
	"maintenance",
	"utilities",
	"supplies",
	"other",
];

type FormValues = {
	category: ExpenseCategory | "";
	amount: number;
	description: string;
	expense_date: string;
};

function todayISO(): string {
	return new Date().toISOString().split("T")[0];
}

export default function CreateExpensePage() {
	const { t } = useLanguage();
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<FormValues>({
		defaultValues: {
			category: "",
			amount: 0,
			description: "",
			expense_date: todayISO(),
		},
	});

	const mutation = useMutation({
		mutationFn: (data: ExpenseCreate) => expensesApi.create(data),
		onSuccess: () => navigate("/expenses"),
	});

	const onSubmit = (data: FormValues) => {
		mutation.mutate({
			category: data.category as ExpenseCategory,
			amount: data.amount,
			description: data.description || undefined,
			expense_date: data.expense_date,
		});
	};

	return (
		<PageFormLayout
			title={t("expenses.create_title")}
			subtitle={t("expenses.subtitle")}
			backHref="/expenses"
		>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
					<div className="bg-surface-container px-6 py-3 border-b border-outline-variant">
						<span className="text-sm font-bold text-on-surface">
							{t("expenses.expense_info")}
						</span>
					</div>
					<div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label={t("expenses.category")}
							required
							error={errors.category?.message}
						>
							<Controller
								name="category"
								control={control}
								rules={{ required: t("common.required") }}
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue placeholder={t("expenses.all_categories")} />
										</SelectTrigger>
										<SelectContent>
											{EXPENSE_CATEGORIES.map((cat) => (
												<SelectItem key={cat} value={cat}>
													{t(`expenses.cat_${cat}`)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</FormField>
						<FormField
							label={t("expenses.amount")}
							required
							error={errors.amount?.message}
						>
							<Input
								type="number"
								min={0}
								step="0.01"
								{...register("amount", {
									required: t("common.required"),
									valueAsNumber: true,
									min: {
										value: 0.01,
										message: "Must be > 0",
									},
								})}
							/>
						</FormField>
						<FormField
							label={t("expenses.expense_date")}
							required
							error={errors.expense_date?.message}
						>
							<Input
								type="date"
								{...register("expense_date", {
									required: t("common.required"),
								})}
							/>
						</FormField>
						<FormField
							label={t("expenses.description")}
							error={errors.description?.message}
						>
							<Textarea
								{...register("description", {
									maxLength: {
										value: 500,
										message: "Max 500 characters",
									},
								})}
							/>
						</FormField>
					</div>
				</div>

				<div className="flex justify-end gap-3">
					<Button variant="outline" onClick={() => navigate("/expenses")}>
						{t("common.cancel")}
					</Button>
					<Button type="submit" disabled={mutation.isPending}>
						{t("common.create")}
					</Button>
				</div>
			</form>
		</PageFormLayout>
	);
}
