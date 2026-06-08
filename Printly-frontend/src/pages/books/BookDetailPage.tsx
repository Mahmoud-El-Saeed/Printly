import { useMutation, useQuery } from "@tanstack/react-query";
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

	const { data: book, isLoading } = useQuery({
		queryKey: ["book", id],
		queryFn: () => booksApi.get(id ?? ""),
		enabled: !!id,
	});

	const deleteMutation = useMutation({
		mutationFn: () => booksApi.delete(id ?? ""),
		onSuccess: () => {
			setDeleteOpen(false);
			navigate("/books");
		},
	});

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
