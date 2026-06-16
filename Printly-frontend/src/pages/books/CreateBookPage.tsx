import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
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
import { materialsApi } from "@/lib/api/materials";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { BookCreate, BookMaterialItem } from "@/types/book";

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

interface MaterialRow {
	material_id: string;
	quantity_per_copy: number;
}

interface MaterialOption {
	id: string;
	name: string;
	price_per_unit: number;
}

const ACCEPTED_TYPES = [
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"image/jpeg",
	"image/png",
	"image/tiff",
	"image/webp",
];

export default function CreateBookPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const [file, setFile] = useState<File | null>(null);
	const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);

	const { data: materialsData } = useQuery({
		queryKey: ["materials", "active"],
		queryFn: () => materialsApi.list({ is_active: true, limit: 200 }),
	});

	const materials: MaterialOption[] = (materialsData?.items ?? []).map((m) => ({
		id: m.id,
		name: m.name,
		price_per_unit: m.price_per_unit,
	}));

	const getMaterialPrice = (materialId: string): number => {
		const mat = materials.find((m) => m.id === materialId);
		return mat?.price_per_unit ?? 0;
	};

	const unitPrice = materialRows.reduce((sum, row) => {
		return (
			sum + (row.quantity_per_copy || 0) * getMaterialPrice(row.material_id)
		);
	}, 0);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<BookFormValues>({
		defaultValues: {
			title: "",
			subject: "",
			total_pages: 1,
			color_mode: "bw",
			sides_per_page: 1,
			copies: 1,
			binding_type: "",
			has_lamination: false,
			notes: "",
		},
	});

	const maxChars = (max: number) =>
		t("validation.max_chars").replace("{max}", String(max));

	const addMaterialRow = () => {
		setMaterialRows([
			...materialRows,
			{ material_id: "", quantity_per_copy: 1 },
		]);
	};

	const removeMaterialRow = (index: number) => {
		setMaterialRows(materialRows.filter((_, i) => i !== index));
	};

	const updateMaterialRow = (
		index: number,
		field: keyof MaterialRow,
		value: string | number,
	) => {
		const updated = [...materialRows];
		updated[index] = { ...updated[index], [field]: value };
		setMaterialRows(updated);
	};

	const createMutation = useMutation({
		mutationFn: async (data: BookFormValues) => {
			const materials: BookMaterialItem[] = materialRows
				.filter((r) => r.material_id && r.quantity_per_copy > 0)
				.map((r) => ({
					material_id: r.material_id,
					quantity_per_copy: r.quantity_per_copy,
				}));

			const bookData: BookCreate = {
				title: data.title,
				subject: data.subject || undefined,
				total_pages: data.total_pages,
				color_mode: data.color_mode || "bw",
				sides_per_page: data.sides_per_page || 1,
				copies: data.copies || 1,
				binding_type: data.binding_type || undefined,
				has_lamination: data.has_lamination,
				notes: data.notes || undefined,
				materials: materials.length > 0 ? materials : undefined,
			};
			const book = await booksApi.create(bookData);
			if (file) {
				await booksApi.uploadFile(book.id, file);
			}
			return book;
		},
		onSuccess: () => {
			navigate("/books");
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const onSubmit = (data: BookFormValues) => {
		createMutation.mutate(data);
	};

	return (
		<PageFormLayout
			title={t("books.create_title")}
			subtitle={t("books.upload_file")}
			backHref="/books"
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
									<SelectItem value="">{t("books.binding_none")}</SelectItem>
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

				<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
					<div className="bg-surface-container px-6 py-3 border-b border-outline-variant flex items-center justify-between">
						<h3 className="font-bold text-sm text-on-surface">
							{t("books.book_materials")}
						</h3>
						<button
							type="button"
							className="text-primary font-medium text-sm flex items-center gap-1 hover:underline"
							onClick={addMaterialRow}
						>
							<Plus className="h-4 w-4" />
							{t("books.add_material")}
						</button>
					</div>
					<div className="p-6 space-y-4">
						{materialRows.length === 0 && (
							<p className="text-sm text-on-surface-variant">
								{t("books.no_materials")}
							</p>
						)}
						{materialRows.map((row, index) => (
							<div
								key={index}
								className="flex items-end gap-4 pb-4 border-b border-outline-variant last:border-b-0"
							>
								<div className="flex-1 flex flex-col gap-1.5">
									<label className="text-xs font-medium text-on-surface-variant">
										{t("books.material_name")}
									</label>
									<Select
										value={row.material_id}
										onValueChange={(v) =>
											updateMaterialRow(index, "material_id", v)
										}
									>
										<SelectTrigger className="h-10">
											<SelectValue placeholder={t("books.select_material")} />
										</SelectTrigger>
										<SelectContent>
											{materials.map((mat) => (
												<SelectItem key={mat.id} value={mat.id}>
													{mat.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="w-28 flex flex-col gap-1.5">
									<label className="text-xs font-medium text-on-surface-variant">
										{t("books.quantity_per_copy")}
									</label>
									<Input
										type="number"
										min={0.01}
										step={0.01}
										value={row.quantity_per_copy}
										onChange={(e) =>
											updateMaterialRow(
												index,
												"quantity_per_copy",
												parseFloat(e.target.value) || 0,
											)
										}
										className="h-10 tabular-nums"
									/>
								</div>
								<div className="w-28 flex flex-col gap-1.5">
									<label className="text-xs font-medium text-on-surface-variant">
										{t("books.price_per_unit")}
									</label>
									<span className="h-10 flex items-center text-sm text-on-surface tabular-nums">
										{formatCurrency(
											getMaterialPrice(row.material_id),
											language,
										)}
									</span>
								</div>
								<div className="w-28 flex flex-col gap-1.5">
									<label className="text-xs font-medium text-on-surface-variant">
										{t("books.material_cost")}
									</label>
									<span className="h-10 flex items-center text-sm font-semibold text-on-surface tabular-nums">
										{formatCurrency(
											(row.quantity_per_copy || 0) *
												getMaterialPrice(row.material_id),
											language,
										)}
									</span>
								</div>
								<button
									type="button"
									className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors mb-0"
									onClick={() => removeMaterialRow(index)}
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</div>
						))}

						{materialRows.length > 0 && (
							<div className="flex justify-end items-center gap-2 pt-2 border-t border-outline-variant">
								<span className="text-sm font-medium text-on-surface-variant">
									{t("books.unit_price")}:
								</span>
								<span className="text-lg font-bold text-primary tabular-nums">
									{formatCurrency(unitPrice, language)}
								</span>
							</div>
						)}
					</div>
				</div>

				<div className="flex justify-end gap-3">
					<Button variant="outline" onClick={() => navigate("/books")}>
						{t("common.cancel")}
					</Button>
					<Button
						type="submit"
						disabled={createMutation.isPending}
						className="gap-2"
					>
						{createMutation.isPending ? t("common.saving") : t("common.create")}
						<Upload className="h-4 w-4" />
					</Button>
				</div>
			</form>
		</PageFormLayout>
	);
}
