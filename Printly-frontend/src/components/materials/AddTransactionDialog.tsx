import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { materialsApi } from "@/lib/api/materials";
import type { TransactionCreate, TransactionType } from "@/types/material";

interface AddTransactionDialogProps {
	materialId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type FormValues = {
	transaction_type: TransactionType;
	quantity: number;
	notes: string;
};

const TRANSACTION_TYPES: TransactionType[] = [
	"restock",
	"consumption",
	"adjustment",
	"return",
];

export function AddTransactionDialog({
	materialId,
	open,
	onOpenChange,
}: AddTransactionDialogProps) {
	const { t } = useLanguage();
	const queryClient = useQueryClient();

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm<FormValues>({
		defaultValues: {
			transaction_type: "restock",
			quantity: 0,
			notes: "",
		},
	});

	const selectedType = watch("transaction_type");

	const mutation = useMutation({
		mutationFn: (data: TransactionCreate) =>
			materialsApi.createTransaction(materialId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["material", materialId] });
			queryClient.invalidateQueries({
				queryKey: ["material-transactions", materialId],
			});
			queryClient.invalidateQueries({ queryKey: ["materials"] });
			reset();
			onOpenChange(false);
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const onSubmit = (data: FormValues) => {
		mutation.mutate({
			transaction_type: data.transaction_type,
			quantity: data.quantity,
			notes: data.notes || undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("materials.add_transaction")}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						label={t("materials.transaction_type")}
						required
						error={errors.transaction_type?.message}
					>
						<Select
							value={selectedType}
							onValueChange={(val: TransactionType) =>
								setValue("transaction_type", val)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{TRANSACTION_TYPES.map((type) => (
									<SelectItem key={type} value={type}>
										{t(`material_transaction.${type}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormField>

					<FormField
						label={t("materials.quantity")}
						required
						error={errors.quantity?.message}
					>
						<Input
							type="number"
							min={1}
							step="1"
							{...register("quantity", {
								valueAsNumber: true,
								required: t("common.required"),
								min: { value: 1, message: t("common.required") },
							})}
						/>
					</FormField>

					<FormField label={t("materials.transaction_notes")}>
						<Textarea {...register("notes")} />
					</FormField>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={mutation.isPending}
						>
							{t("common.cancel")}
						</Button>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending && (
								<Loader2 className="h-4 w-4 animate-spin" />
							)}
							<Plus className="h-4 w-4" />
							{t("common.create")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
