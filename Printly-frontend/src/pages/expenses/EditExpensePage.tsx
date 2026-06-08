import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
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
import { FormField } from "@/components/shared/FormField";
import { PageFormLayout } from "@/components/shared/PageFormLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { expensesApi } from "@/lib/api/expenses";
import type { ExpenseCategory, ExpenseUpdate } from "@/types/expense";

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

export default function EditExpensePage() {
	const { id } = useParams<{ id: string }>();
	const expenseId = id ?? "";
	const { t } = useLanguage();
	const navigate = useNavigate();

	const { data: expense, isLoading } = useQuery({
		queryKey: ["expense", expenseId],
		queryFn: () => expensesApi.get(expenseId),
		enabled: !!expenseId,
	});

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<FormValues>({
		values: expense
			? {
					category: expense.category,
					amount: expense.amount,
					description: expense.description ?? "",
					expense_date: expense.expense_date,
				}
			: undefined,
	});

	const mutation = useMutation({
		mutationFn: (data: ExpenseUpdate) =>
			expensesApi.update(expenseId, data),
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
			title={t("expenses.edit_title")}
			subtitle={t("expenses.subtitle")}
			backHref={`/expenses/${expenseId}`}
			isLoading={isLoading}
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
									<Select
										value={field.value}
										onValueChange={field.onChange}
									>
										<SelectTrigger>
											<SelectValue
												placeholder={t("expenses.all_categories")}
											/>
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
					<Button
						variant="outline"
						onClick={() => navigate(`/expenses/${expenseId}`)}
					>
						{t("common.cancel")}
					</Button>
					<Button type="submit" disabled={mutation.isPending}>
						{t("common.save")}
					</Button>
				</div>
			</form>
		</PageFormLayout>
	);
}