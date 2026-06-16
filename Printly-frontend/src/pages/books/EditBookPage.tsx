import { useMutation, useQuery } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { booksApi } from "@/lib/api/books";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { BookUpdate } from "@/types/book";

interface BookFormValues {
	title: string;
	subject: string;
	total_pages: number;
	color_mode: string;
	sides_per_page: number;
	copies: number;
	binding_type: string;
	has_lamination: boolean;
	notes: string;
}

const ACCEPTED_TYPES = [
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"image/jpeg",
	"image/png",
	"image/tiff",
	"image/webp",
];

export default function EditBookPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [file, setFile] = useState<File | null>(null);

	const { data: book, isLoading } = useQuery({
		queryKey: ["book", id],
		queryFn: () => booksApi.get(id ?? ""),
		enabled: !!id,
	});

	const unitPrice = (book?.book_materials ?? []).reduce(
		(sum, m) => sum + m.quantity_per_copy * m.price_per_unit,
		0,
	);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<BookFormValues>({
		values: book
			? {
					title: book.title,
					subject: book.subject ?? "",
					total_pages: book.total_pages,
					color_mode: book.color_mode,
					sides_per_page: book.sides_per_page,
					copies: book.copies,
					binding_type: book.binding_type ?? "",
					has_lamination: book.has_lamination,
					notes: book.notes ?? "",
				}
			: undefined,
	});

	const maxChars = (max: number) =>
		t("validation.max_chars").replace("{max}", String(max));

	const updateMutation = useMutation({
		mutationFn: async (data: BookFormValues) => {
			const updateData: BookUpdate = {
				title: data.title,
				subject: data.subject || undefined,
				total_pages: data.total_pages,
				color_mode: data.color_mode || "bw",
				sides_per_page: data.sides_per_page || 1,
				copies: data.copies || 1,
				binding_type: data.binding_type || undefined,
				has_lamination: data.has_lamination,
				notes: data.notes || undefined,
			};
			const updatedBook = await booksApi.update(id ?? "", updateData);
			if (file) {
				await booksApi.uploadFile(id ?? "", file);
			}
			return updatedBook;
		},
		onSuccess: () => {
			navigate(`/books/${id}`);
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const onSubmit = (data: BookFormValues) => {
		updateMutation.mutate(data);
	};

	return (
		<PageFormLayout
			title={t("books.edit_title")}
			subtitle={t("books.info")}
			backHref={`/books/${id}`}
			isLoading={isLoading}
		>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
					<div className="bg-surface-container px-6 py-3 border-b border-outline-variant">
						<h3 className="font-bold text-sm text-on-surface">
							{t("books.info")}
						</h3>
					</div>
					<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormField
							label={t("books.title_field")}
							error={errors.title?.message}
							required
						>
							<Input
								{...register("title", {
									required: t("common.required"),
									maxLength: { value: 300, message: maxChars(300) },
								})}
								className="h-11"
							/>
						</FormField>
						<FormField
							label={t("books.subject")}
							error={errors.subject?.message}
						>
							<Input
								{...register("subject", {
									maxLength: { value: 200, message: maxChars(200) },
								})}
								className="h-11"
							/>
						</FormField>
						<FormField
							label={t("books.pages")}
							error={errors.total_pages?.message}
							required
						>
							<Input
								type="number"
								{...register("total_pages", {
									required: t("common.required"),
									min: {
										value: 1,
										message: t("validation.min_value").replace("{min}", "1"),
									},
									valueAsNumber: true,
								})}
								className="h-11 tabular-nums"
							/>
						</FormField>
						<FormField label={t("books.color_mode")}>
							<Select
								value={watch("color_mode")}
								onValueChange={(v) => setValue("color_mode", v)}
							>
								<SelectTrigger className="h-11">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="bw">{t("books.color_bw")}</SelectItem>
									<SelectItem value="color">
										{t("books.color_color")}
									</SelectItem>
								</SelectContent>
							</Select>
						</FormField>
						<FormField label={t("books.sides_per_page")}>
							<Select
								value={String(watch("sides_per_page"))}
								onValueChange={(v) => setValue("sides_per_page", Number(v))}
							>
								<SelectTrigger className="h-11">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">{t("books.sides_1")}</SelectItem>
									<SelectItem value="2">{t("books.sides_2")}</SelectItem>
								</SelectContent>
							</Select>
						</FormField>
						<FormField label={t("books.copies")} error={errors.copies?.message}>
							<Input
								type="number"
								min={1}
								{...register("copies", {
									valueAsNumber: true,
									min: {
										value: 1,
										message: t("validation.min_value").replace("{min}", "1"),
									},
								})}
								className="h-11 tabular-nums"
							/>
						</FormField>
						<FormField label={t("books.binding_type")}>
							<Select
								value={watch("binding_type")}
								onValueChange={(v) => setValue("binding_type", v)}
							>
								<SelectTrigger className="h-11">
									<SelectValue placeholder={t("books.binding_none")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="spiral">
										{t("books.binding_spiral")}
									</SelectItem>
									<SelectItem value="glue">
										{t("books.binding_glue")}
									</SelectItem>
									<SelectItem value="staple">
										{t("books.binding_staple")}
									</SelectItem>
									<SelectItem value="hardcover">
										{t("books.binding_hardcover")}
									</SelectItem>
								</SelectContent>
							</Select>
						</FormField>
						<FormField label={t("books.has_lamination")}>
							<div className="flex items-center gap-3 h-11">
								<Switch
									checked={watch("has_lamination")}
									onCheckedChange={(v) => setValue("has_lamination", v)}
								/>
								<span className="text-sm text-on-surface">
									{watch("has_lamination") ? t("common.yes") : t("common.no")}
								</span>
							</div>
						</FormField>
						<div className="md:col-span-2">
							<FormField label={t("books.notes")}>
								<Textarea
									{...register("notes")}
									rows={3}
									className="h-11 min-h-[44px]"
								/>
							</FormField>
						</div>
						<FormField label={t("books.file_upload")}>
							<div className="flex items-center gap-3">
								<Input
									type="file"
									accept={ACCEPTED_TYPES.join(",")}
									onChange={(e) => setFile(e.target.files?.[0] ?? null)}
									className="h-11"
								/>
								{file && (
									<span className="text-xs text-on-surface-variant">
										{file.name}
									</span>
								)}
							</div>
						</FormField>
					</div>
				</div>

				{book?.book_materials && book.book_materials.length > 0 && (
					<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
						<div className="bg-surface-container px-6 py-3 border-b border-outline-variant">
							<h3 className="font-bold text-sm text-on-surface">
								{t("books.book_materials")}
							</h3>
						</div>
						<div className="p-6">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-outline-variant">
										<th className="text-left py-2 px-2 text-xs font-medium text-on-surface-variant">
											{t("books.material_name")}
										</th>
										<th className="text-right py-2 px-2 text-xs font-medium text-on-surface-variant">
											{t("books.quantity_per_copy")}
										</th>
										<th className="text-right py-2 px-2 text-xs font-medium text-on-surface-variant">
											{t("books.price_per_unit")}
										</th>
										<th className="text-right py-2 px-2 text-xs font-medium text-on-surface-variant">
											{t("books.material_cost")}
										</th>
									</tr>
								</thead>
								<tbody>
									{book.book_materials.map((m) => (
										<tr
											key={m.material_id}
											className="border-b border-outline-variant last:border-b-0"
										>
											<td className="py-2 px-2 text-on-surface">
												{m.material_name}
											</td>
											<td className="py-2 px-2 text-right tabular-nums text-on-surface">
												{m.quantity_per_copy}
											</td>
											<td className="py-2 px-2 text-right tabular-nums text-on-surface">
												{formatCurrency(m.price_per_unit, language)}
											</td>
											<td className="py-2 px-2 text-right tabular-nums font-semibold text-on-surface">
												{formatCurrency(
													m.quantity_per_copy * m.price_per_unit,
													language,
												)}
											</td>
										</tr>
									))}
								</tbody>
								<tfoot>
									<tr>
										<td
											colSpan={3}
											className="py-3 px-2 text-right text-sm font-medium text-on-surface-variant"
										>
											{t("books.unit_price")}:
										</td>
										<td className="py-3 px-2 text-right tabular-nums text-lg font-bold text-primary">
											{formatCurrency(unitPrice, language)}
										</td>
									</tr>
								</tfoot>
							</table>
						</div>
					</div>
				)}

				<div className="flex justify-end gap-3">
					<Button variant="outline" onClick={() => navigate(`/books/${id}`)}>
						{t("common.cancel")}
					</Button>
					<Button
						type="submit"
						disabled={updateMutation.isPending}
						className="gap-2"
					>
						{updateMutation.isPending ? t("common.saving") : t("common.save")}
						<Upload className="h-4 w-4" />
					</Button>
				</div>
			</form>
		</PageFormLayout>
	);
}
