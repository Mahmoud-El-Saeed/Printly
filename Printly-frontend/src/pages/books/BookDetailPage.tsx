import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	CheckCircle,
	ExternalLink,
	Pencil,
	Trash2,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { booksApi } from "@/lib/api/books";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

function formatFileSize(size: number | null): string {
	if (size === null) return "—";
	if (size < 1024) return `${size} B`;
	if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / 1048576).toFixed(1)} MB`;
}

export default function BookDetailPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const queryClient = useQueryClient();

	const {
		data: book,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["book", id],
		queryFn: () => booksApi.get(id ?? ""),
		enabled: !!id,
	});

	const deleteMutation = useMutation({
		mutationFn: () => booksApi.delete(id ?? ""),
		onSuccess: () => {
			setDeleteOpen(false);
			queryClient.invalidateQueries({ queryKey: ["books"] });
			navigate("/books");
		},
	});

	const unitPrice = (book?.book_materials ?? []).reduce(
		(sum, m) => sum + m.quantity_per_copy * m.price_per_unit,
		0,
	);

	if (isError) {
		return (
			<div className="flex items-center justify-center py-12 text-error">
				{t("common.error")}
			</div>
		);
	}

	if (isLoading || !book) {
		return (
			<div className="flex items-center justify-center h-64 text-muted-foreground">
				{t("common.loading")}
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			<div className="flex items-center gap-4">
				<button
					type="button"
					className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
					onClick={() => navigate("/books")}
				>
					<ArrowLeft className="h-5 w-5" />
				</button>
				<div>
					<h2 className="font-bold text-2xl tracking-tight text-on-surface">
						{book.title}
					</h2>
					<p className="text-sm text-on-surface-variant">
						{t("books.detail_title")}
					</p>
				</div>
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
				<div className="bg-surface-container px-6 py-3 border-b border-outline-variant flex items-center justify-between">
					<h3 className="font-bold text-sm text-on-surface">
						{t("books.info")}
					</h3>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							className="gap-2"
							onClick={() => navigate(`/books/${id}/edit`)}
						>
							<Pencil className="h-4 w-4" />
							{t("common.edit")}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="gap-2 text-error hover:bg-error-container"
							onClick={() => setDeleteOpen(true)}
						>
							<Trash2 className="h-4 w-4" />
							{t("common.delete")}
						</Button>
					</div>
				</div>
				<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("books.title_field")}
						</span>
						<span className="text-sm font-semibold text-on-surface">
							{book.title}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("books.subject")}
						</span>
						<span className="text-sm text-on-surface">
							{book.subject ?? "—"}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("books.pages")}
						</span>
						<span className="text-sm tabular-nums text-on-surface">
							{book.total_pages}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("books.color_mode")}
						</span>
						<span
							className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
								book.color_mode === "color"
									? "bg-primary/10 text-primary"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{book.color_mode === "color"
								? t("books.color_color")
								: t("books.color_bw")}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("books.sides_per_page")}
						</span>
						<span className="text-sm text-on-surface tabular-nums">
							{book.sides_per_page === 2
								? t("books.sides_2")
								: t("books.sides_1")}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("books.copies")}
						</span>
						<span className="text-sm tabular-nums text-on-surface">
							{book.copies}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("books.binding_type")}
						</span>
						<span className="text-sm text-on-surface">
							{book.binding_type
								? t(`books.binding_${book.binding_type}`)
								: "—"}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("books.has_lamination")}
						</span>
						<span
							className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
								book.has_lamination
									? "bg-primary/10 text-primary"
									: "bg-gray-100 text-gray-600"
							}`}
						>
							{book.has_lamination ? t("common.yes") : t("common.no")}
						</span>
					</div>
					{book.notes && (
						<div className="md:col-span-2 flex flex-col gap-1">
							<span className="text-xs font-medium text-on-surface-variant">
								{t("books.notes")}
							</span>
							<span className="text-sm text-on-surface">{book.notes}</span>
						</div>
					)}
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("books.size")}
						</span>
						<span className="text-sm tabular-nums text-on-surface">
							{formatFileSize(book.file_size)}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("books.status")}
						</span>
						{book.local_file_path ? (
							<span className="flex items-center gap-1.5 text-sm text-primary">
								<CheckCircle className="h-4 w-4" />
								{t("books.view_file")}
								<a
									href={`/uploads/${book.local_file_path}`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 hover:underline"
								>
									<ExternalLink className="h-3 w-3" />
								</a>
							</span>
						) : (
							<span className="flex items-center gap-1.5 text-sm text-error">
								<XCircle className="h-4 w-4" />
								{t("books.no_file")}
							</span>
						)}
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("books.created")}
						</span>
						<span className="text-sm text-on-surface">
							{formatDate(book.created_at, language)}
						</span>
					</div>
				</div>
			</div>

			{book.book_materials.length > 0 && (
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

			<ConfirmDeleteDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title={t("common.delete")}
				description={t("common.delete_confirm")}
				onConfirm={() => deleteMutation.mutate()}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
