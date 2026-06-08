import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FormField } from "@/components/shared/FormField";
import { PageFormLayout } from "@/components/shared/PageFormLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { booksApi } from "@/lib/api/books";
import type { BookCreate } from "@/types/book";

interface BookFormValues {
	title: string;
	subject: string;
	total_pages: number;
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
	const { t } = useLanguage();
	const navigate = useNavigate();
	const [file, setFile] = useState<File | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<BookFormValues>({
		defaultValues: {
			title: "",
			subject: "",
			total_pages: 1,
		},
	});

	const maxChars = (max: number) =>
		t("validation.max_chars").replace("{max}", String(max));

	const createMutation = useMutation({
		mutationFn: async (data: BookFormValues) => {
			const bookData: BookCreate = {
				title: data.title,
				subject: data.subject || undefined,
				total_pages: data.total_pages,
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
						<FormField label={t("books.file_upload")} error={undefined}>
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
