import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	BookOpen,
	CheckCircle,
	Eye,
	Pencil,
	Trash2,
	Upload,
	XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { FilterBar } from "@/components/shared/FilterBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { DataTable } from "@/components/tables/DataTable";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { booksApi } from "@/lib/api/books";
import { formatDate } from "@/lib/utils/formatDate";
import type { BookResponse } from "@/types/book";

function formatFileSize(size: number | null): string {
	if (size === null) return "—";
	if (size < 1024) return `${size} B`;
	if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / 1048576).toFixed(1)} MB`;
}

export default function BooksListPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [subjectFilter, setSubjectFilter] = useState("");
	const [hasFile, setHasFile] = useState(false);
	const [page, setPage] = useState(1);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const pageSize = 10;

	const { data, isLoading } = useQuery({
		queryKey: ["books", search, subjectFilter, hasFile, page],
		queryFn: () =>
			booksApi.list({
				title: search || undefined,
				subject: subjectFilter || undefined,
				has_file: hasFile || undefined,
				offset: (page - 1) * pageSize,
				limit: pageSize,
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => booksApi.delete(id),
		onSuccess: () => {
			toast.success(t("common.delete_success"));
			queryClient.invalidateQueries({ queryKey: ["books"] });
			setDeleteId(null);
		},
		onError: () => {
			toast.error(t("common.delete_failed"));
		},
	});

	const columns = [
		{
			key: "title",
			header: t("books.title_field"),
			render: (row: BookResponse) => (
				<span className="font-semibold text-primary">{row.title}</span>
			),
		},
		{
			key: "subject",
			header: t("books.subject"),
			render: (row: BookResponse) => (
				<span className="text-on-surface-variant">{row.subject ?? "—"}</span>
			),
		},
		{
			key: "total_pages",
			header: t("books.pages"),
			render: (row: BookResponse) => (
				<span className="tabular-nums">{row.total_pages}</span>
			),
		},
		{
			key: "color_mode",
			header: t("books.color_mode"),
			render: (row: BookResponse) => (
				<span
					className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
						row.color_mode === "color"
							? "bg-primary/10 text-primary"
							: "bg-gray-100 text-gray-600"
					}`}
				>
					{row.color_mode === "color"
						? t("books.color_color")
						: t("books.color_bw")}
				</span>
			),
		},
		{
			key: "copies",
			header: t("books.copies"),
			render: (row: BookResponse) => (
				<span className="tabular-nums">{row.copies}</span>
			),
		},
		{
			key: "binding_type",
			header: t("books.binding_type"),
			render: (row: BookResponse) => (
				<span className="text-on-surface-variant">
					{row.binding_type ?? "—"}
				</span>
			),
		},
		{
			key: "file_size",
			header: t("books.size"),
			render: (row: BookResponse) => (
				<span className="tabular-nums">{formatFileSize(row.file_size)}</span>
			),
		},
		{
			key: "status",
			header: t("books.status"),
			render: (row: BookResponse) =>
				row.file_url ? (
					<CheckCircle className="h-4 w-4 text-primary" />
				) : (
					<XCircle className="h-4 w-4 text-error" />
				),
		},
		{
			key: "created_at",
			header: t("books.created"),
			render: (row: BookResponse) => (
				<span className="text-on-surface-variant text-xs">
					{formatDate(row.created_at, language)}
				</span>
			),
		},
		{
			key: "actions",
			header: t("books.actions"),
			render: (row: BookResponse) => (
				<div className="flex justify-end gap-1">
					<button
						type="button"
						aria-label="View"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/books/${row.id}`);
						}}
					>
						<Eye className="h-4 w-4" />
					</button>
					<button
						type="button"
						aria-label="Edit"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/books/${row.id}/edit`);
						}}
					>
						<Pencil className="h-4 w-4" />
					</button>
					<button
						type="button"
						aria-label="Delete"
						className="p-1.5 rounded-md hover:bg-error-container text-error transition-colors"
						onClick={(e) => {
							e.stopPropagation();
							setDeleteId(row.id);
						}}
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>
			),
		},
	];

	const onSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
		[],
	);

	const onHasFileChange = useCallback((val: boolean) => setHasFile(val), []);

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("books.title")}
				subtitle={t("books.subtitle")}
				actionLabel={t("books.upload_file")}
				actionIcon={Upload}
				onAction={() => navigate("/books/new")}
			/>

			<div className="grid grid-cols-2 gap-4">
				<StatsCard
					icon={BookOpen}
					label={t("books.total_books")}
					value={String(data?.total ?? 0)}
				/>
				<StatsCard
					icon={BookOpen}
					label={t("common.on_this_page")}
					value={String((data?.items ?? []).length)}
				/>
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-4">
				<FilterBar
					searchValue={search}
					onSearchChange={onSearchChange}
					searchPlaceholder={t("books.search_placeholder")}
					filters={[
						{
							key: "subject",
							placeholder: t("books.all_subjects"),
							options: [],
							value: subjectFilter,
							onChange: setSubjectFilter,
						},
					]}
				/>
				<div className="flex items-center gap-2">
					<span className="text-sm text-on-surface-variant">
						{t("books.has_file")}
					</span>
					<Switch checked={hasFile} onCheckedChange={onHasFileChange} />
				</div>
			</div>

			<DataTable
				columns={columns}
				data={data?.items ?? []}
				total={data?.total ?? 0}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				onRowClick={(row) => navigate(`/books/${row.id}`)}
				rowKey={(row) => row.id}
				emptyMessage={isLoading ? t("common.loading") : t("books.no_data")}
			/>

			<ConfirmDeleteDialog
				open={deleteId !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteId(null);
				}}
				title={t("common.delete")}
				description={t("common.delete_confirm")}
				onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
