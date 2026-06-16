import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatCurrency } from "@/lib/utils/formatCurrency";

interface OrderItem {
	bookId: string;
	tempId: string;
	copies: number;
}

export default function PortalNewOrderPage() {
	const { tenantId } = useParams<{ tenantId: string }>();
	const { t, language, isRTL } = useLanguage();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const tid = tenantId ?? "";

	const [items, setItems] = useState<OrderItem[]>([
		{ bookId: "", tempId: crypto.randomUUID(), copies: 1 },
	]);
	const [notes, setNotes] = useState("");

	const { data: booksData } = useQuery({
		queryKey: ["portal-books", tid],
		queryFn: () => portalApi.getBooks(tid, { limit: 200 }),
		enabled: !!tid,
	});

	const selectedBooks = items.map((item) =>
		booksData?.items?.find((b) => b.id === item.bookId),
	);

	const calcUnitPrice = (book: NonNullable<(typeof selectedBooks)[number]>) =>
		book.book_materials?.reduce(
			(sum, m) => sum + m.quantity_per_copy * m.price_per_unit,
			0,
		) ?? 0;

	const totalAmount = items.reduce((sum, item, idx) => {
		const book = selectedBooks[idx];
		if (!book) return sum;
		return sum + calcUnitPrice(book) * item.copies;
	}, 0);

	const mutation = useMutation({
		mutationFn: async () => {
			const orderItems = items
				.filter((item) => item.bookId)
				.map((item) => ({
					book_id: item.bookId,
					copies: item.copies,
				}));
			return portalApi.createOrder(tid, {
				customer_id: undefined,
				items: orderItems,
				notes: notes || undefined,
			});
		},
		onSuccess: (data) => {
			toast.success(t("portal.order_created"));
			queryClient.invalidateQueries({ queryKey: ["portal-orders", tid] });
			navigate(`/portal/${tid}/orders/${data.id}`);
		},
		onError: () => toast.error(t("common.error")),
	});

	const addItem = () => {
		setItems([
			...items,
			{ bookId: "", tempId: crypto.randomUUID(), copies: 1 },
		]);
	};

	const removeItem = (idx: number) => {
		setItems(items.filter((_, i) => i !== idx));
	};

	const updateItem = (idx: number, bookId: string) => {
		const next = [...items];
		next[idx] = { ...next[idx], bookId, copies: next[idx].copies };
		setItems(next);
	};

	const updateCopies = (idx: number, copies: number) => {
		const next = [...items];
		next[idx] = { ...next[idx], copies };
		setItems(next);
	};

	const handleSubmit = () => {
		if (items.filter((i) => i.bookId).length === 0) return;
		mutation.mutate();
	};

	return (
		<div className="space-y-6">
			<Link
				to={`/portal/${tid}`}
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("common.back")}
			</Link>

			<h1 className="text-xl font-bold">{t("portal.new_order")}</h1>
			<p className="text-sm text-muted-foreground">
				{t("portal.new_order_subtitle")}
			</p>

			<div className="space-y-6">
				{items.map((item, idx) => {
					const book = selectedBooks[idx];
					return (
						<div
							key={item.tempId}
							className="bg-card border border-border rounded-xl p-5 space-y-4"
						>
							<div className="flex items-center justify-between">
								<h3 className="font-bold text-sm">
									{t("portal.order_add_item")} #{idx + 1}
								</h3>
								{items.length > 1 && (
									<button
										type="button"
										className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
										onClick={() => removeItem(idx)}
										aria-label={t("portal.order_remove_item")}
									>
										<Trash2 className="h-4 w-4" />
									</button>
								)}
							</div>

							<div className="space-y-2">
								<Label>{t("portal.order_select_book")}</Label>
								<Select
									value={item.bookId}
									onValueChange={(v) => updateItem(idx, v)}
								>
									<SelectTrigger>
										<SelectValue placeholder={t("portal.order_select_book")} />
									</SelectTrigger>
									<SelectContent>
										{booksData?.items?.map((b) => (
											<SelectItem key={b.id} value={b.id}>
												{b.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{book && (
								<div className="space-y-3 bg-muted/30 rounded-lg p-4">
									<div className="flex items-center gap-4">
										<div className="flex-1">
											<Label>{t("portal.order_copies")}</Label>
											<Input
												type="number"
												min={1}
												value={item.copies}
												onChange={(e) =>
													updateCopies(
														idx,
														Math.max(1, parseInt(e.target.value, 10) || 1),
													)
												}
												className="h-10 tabular-nums mt-1"
											/>
										</div>
									</div>
									<div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
										<span className="text-muted-foreground">
											{t("portal.pages")}:{" "}
											<span className="font-medium text-foreground">
												{book.total_pages}
											</span>
										</span>
										<span className="text-muted-foreground">
											{t("portal.book_color_mode")}:{" "}
											<span className="font-medium text-foreground">
												{book.color_mode === "color"
													? t("portal.book_color_color")
													: t("portal.book_color_bw")}
											</span>
										</span>
										<span className="text-muted-foreground">
											{t("portal.book_sides")}:{" "}
											<span className="font-medium text-foreground">
												{book.sides_per_page}
											</span>
										</span>
										{book.binding_type && book.binding_type !== "none" && (
											<span className="text-muted-foreground">
												{t("portal.book_binding")}:{" "}
												<span className="font-medium text-foreground">
													{t(`books.binding_${book.binding_type}`)}
												</span>
											</span>
										)}
										{book.has_lamination && (
											<span className="text-muted-foreground">
												{t("portal.book_lamination")}:{" "}
												<span className="font-medium text-foreground">
													{t("orders.glossy")}
												</span>
											</span>
										)}
									</div>
									{book.book_materials?.length > 0 && (
										<div className="border-t border-border pt-3">
											<p className="text-xs font-medium text-muted-foreground mb-2">
												{t("portal.book_materials")}
											</p>
											<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
												{book.book_materials.map((m) => (
													<span key={m.material_id}>
														{m.material_name}: {m.quantity_per_copy} ×{" "}
														{formatCurrency(m.price_per_unit, language)}
													</span>
												))}
											</div>
										</div>
									)}
									<div
										className={`flex items-center justify-between border-t border-border pt-3 ${isRTL ? "flex-row-reverse" : ""}`}
									>
										<span className="text-sm text-muted-foreground">
											{t("portal.book_unit_price")}
										</span>
										<span className="text-lg font-bold tabular-nums text-primary">
											{formatCurrency(
												calcUnitPrice(book) * item.copies,
												language,
											)}
										</span>
									</div>
									<p className="text-xs text-muted-foreground italic">
										{t("portal.order_auto_price")}
									</p>
								</div>
							)}
						</div>
					);
				})}

				<Button
					variant="outline"
					type="button"
					onClick={addItem}
					className="gap-2"
				>
					<Plus className="h-4 w-4" />
					{t("portal.order_add_item")}
				</Button>

				<div className="bg-card border border-border rounded-xl p-5 space-y-4">
					<h3 className="font-bold text-sm">{t("orders.order_summary")}</h3>
					<div
						className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
					>
						<span className="text-sm text-muted-foreground">
							{t("orders.total_items")}
						</span>
						<span className="text-sm font-semibold tabular-nums">
							{items.filter((i) => i.bookId).length}
						</span>
					</div>
					<div
						className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
					>
						<span className="text-sm text-muted-foreground">
							{t("orders.total_amount")}
						</span>
						<span className="text-sm font-bold tabular-nums">
							{formatCurrency(totalAmount, language)}
						</span>
					</div>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>{t("orders.notes")}</Label>
						<Textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder={t("orders.notes_placeholder")}
							rows={3}
						/>
					</div>
				</div>

				<Button
					onClick={handleSubmit}
					disabled={
						mutation.isPending || items.filter((i) => i.bookId).length === 0
					}
					className="w-full"
				>
					{mutation.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						t("orders.create_order")
					)}
				</Button>
			</div>
		</div>
	);
}
