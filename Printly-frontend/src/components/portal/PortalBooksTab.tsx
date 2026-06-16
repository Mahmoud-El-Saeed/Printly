import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatDate } from "@/lib/utils/formatDate";

interface PortalBooksTabProps {
	tenantId: string;
	onUploadBook: () => void;
}

export function PortalBooksTab({
	tenantId,
	onUploadBook,
}: PortalBooksTabProps) {
	const { t, language, isRTL } = useLanguage();

	const {
		data: books,
		isLoading: booksLoading,
		isError: booksError,
	} = useQuery({
		queryKey: ["portal-books", tenantId],
		queryFn: () => portalApi.getBooks(tenantId),
		enabled: !!tenantId,
	});

	const renderBindingLabel = (binding: string | null): string => {
		if (!binding || binding === "none") return "—";
		return t(`books.binding_${binding}`);
	};

	return (
		<div className="space-y-4">
			<div
				className={`flex items-center justify-between mb-3 ${isRTL ? "flex-row-reverse" : ""}`}
			>
				<span className="text-sm font-medium text-muted-foreground">
					{t("portal.my_books")}
				</span>
				<Button
					variant="outline"
					size="sm"
					onClick={onUploadBook}
					className="gap-2"
				>
					<Upload className="h-4 w-4" />
					{t("portal.upload_book")}
				</Button>
			</div>
			{booksLoading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-primary" />
				</div>
			) : booksError ? (
				<div className="bg-card border border-border rounded-xl p-8 text-center text-error">
					{t("common.error")}
				</div>
			) : !books?.items?.length ? (
				<div className="bg-card border border-border rounded-xl p-8 text-center">
					<FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
					<p className="text-sm text-muted-foreground">{t("common.no_data")}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{books.items.map((book) => (
						<div
							key={book.id}
							className="bg-card border border-border rounded-xl p-4"
						>
							<div
								className={`flex items-start justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""}`}
							>
								<h3 className="font-bold text-sm">{book.title}</h3>
								{book.local_file_path ? (
									<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
										{t("books.has_file")}
									</span>
								) : (
									<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
										{t("books.no_file")}
									</span>
								)}
							</div>
							<div className="space-y-1.5">
								{book.subject && (
									<p className="text-xs text-muted-foreground">
										{t("books.subject")}: {book.subject}
									</p>
								)}
								<div className="flex flex-wrap gap-x-4 gap-y-1">
									<p className="text-xs text-muted-foreground">
										{t("portal.pages")}: {book.total_pages}
									</p>
									<p className="text-xs text-muted-foreground">
										{t("portal.book_sides")}: {book.sides_per_page}
									</p>
									{book.copies > 0 && (
										<p className="text-xs text-muted-foreground">
											{t("portal.book_copies")}: {book.copies}
										</p>
									)}
								</div>
								<div className="flex flex-wrap gap-2">
									<span
										className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
											book.color_mode === "color"
												? "bg-primary/10 text-primary"
												: "bg-gray-100 text-gray-600"
										}`}
									>
										{book.color_mode === "color"
											? t("portal.book_color_color")
											: t("portal.book_color_bw")}
									</span>
									{book.binding_type && book.binding_type !== "none" && (
										<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
											{renderBindingLabel(book.binding_type)}
										</span>
									)}
									{book.has_lamination && (
										<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
											{t("portal.book_lamination")}
										</span>
									)}
								</div>
								<p className="text-xs text-muted-foreground">
									{formatDate(book.created_at, language)}
								</p>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
