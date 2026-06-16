import { useMutation, useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	ChevronDown,
	ChevronRight,
	Plus,
	Trash2,
	XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { booksApi } from "@/lib/api/books";
import { ordersApi } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { BookResponse } from "@/types/book";
import type { OrderCreate, OrderItemCreate } from "@/types/order";

function calcUnitPrice(book: BookResponse | undefined): number {
	if (!book) return 0;
	return book.book_materials.reduce(
		(sum, m) => sum + m.quantity_per_copy * m.price_per_unit,
		0,
	);
}

interface ItemForm {
	uid: string;
	book_id: string;
	copies: number;
}

export default function NewOrderPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const uidRef = useRef(0);
	const nextUid = () => `item-${++uidRef.current}`;
	const [customer, setCustomer] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [notes, setNotes] = useState("");
	const [paidAmount, setPaidAmount] = useState("");
	const [items, setItems] = useState<ItemForm[]>([
		{ uid: nextUid(), book_id: "", copies: 1 },
	]);
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

	const { data: booksData } = useQuery({
		queryKey: ["books", "all"],
		queryFn: () => booksApi.list({ limit: 500 }),
	});

	const books = booksData?.items ?? [];

	const getBook = (bookId: string): BookResponse | undefined =>
		books.find((b) => b.id === bookId);

	const calcItemSubtotal = (item: ItemForm): number => {
		const book = getBook(item.book_id);
		if (!book) return 0;
		return calcUnitPrice(book) * item.copies;
	};

	const totalAmount = items.reduce(
		(sum, item) => sum + calcItemSubtotal(item),
		0,
	);
	const balanceDue = totalAmount - (parseFloat(paidAmount) || 0);

	const createOrder = useMutation({
		mutationFn: (data: OrderCreate) => ordersApi.create(data),
		onSuccess: (order) => {
			navigate(`/orders/${order.id}`);
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const addItem = () =>
		setItems([...items, { uid: nextUid(), book_id: "", copies: 1 }]);

	const removeItem = (index: number) =>
		setItems(items.filter((_, i) => i !== index));

	const updateItem = (index: number, field: string, value: string | number) => {
		const updated = [...items];
		(updated[index] as unknown as Record<string, unknown>)[field] = value;
		setItems(updated);
	};

	const toggleExpand = (uid: string) => {
		const next = new Set(expandedItems);
		if (next.has(uid)) next.delete(uid);
		else next.add(uid);
		setExpandedItems(next);
	};

	const handleSubmit = () => {
		if (items.length === 0) {
			toast.error(t("common.error"));
			return;
		}
		const invalidItem = items.find((i) => !i.book_id || i.copies < 1);
		if (invalidItem) {
			toast.error(t("orders.book_required"));
			return;
		}

		const orderItems: OrderItemCreate[] = items.map((item) => ({
			book_id: item.book_id,
			copies: item.copies,
		}));

		createOrder.mutate({
			customer_id: customer || undefined,
			due_date: dueDate || undefined,
			notes: notes || undefined,
			items: orderItems,
			paid_amount: parseFloat(paidAmount) || undefined,
		});
	};

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			<div className="flex items-center gap-4">
				<button
					type="button"
					className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
					onClick={() => navigate("/orders")}
				>
					<ArrowLeft className="h-5 w-5" />
				</button>
				<div>
					<h2 className="font-bold text-2xl tracking-tight text-on-surface">
						{t("orders.new_order")}
					</h2>
					<p className="text-sm text-on-surface-variant">
						{t("orders.new_order_subtitle")}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				<div className="lg:col-span-8 flex flex-col gap-6">
					<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
						<div className="bg-surface-container px-6 py-3 border-b border-outline-variant">
							<h3 className="font-bold text-sm text-on-surface">
								{t("orders.order_info")}
							</h3>
						</div>
						<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="flex flex-col gap-2">
								<Label className="text-on-surface-variant">
									{t("orders.customer")}
								</Label>
								<Select value={customer} onValueChange={setCustomer}>
									<SelectTrigger className="h-11">
										<SelectValue placeholder={t("orders.select_customer")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="walk-in">
											{t("orders.walk_in_customer")}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<Label className="text-on-surface-variant">
									{t("orders.due_date")}
								</Label>
								<Input
									type="date"
									value={dueDate}
									onChange={(e) => setDueDate(e.target.value)}
									className="h-11"
								/>
							</div>
							<div className="md:col-span-2 flex flex-col gap-2">
								<Label className="text-on-surface-variant">
									{t("orders.notes")}
								</Label>
								<Textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									placeholder={t("orders.notes_placeholder")}
									rows={2}
								/>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<h3 className="font-bold text-sm text-on-surface">
								{t("orders.items")} ({items.length})
							</h3>
							<button
								type="button"
								className="text-primary font-medium text-sm flex items-center gap-1 hover:underline"
								onClick={addItem}
							>
								<Plus className="h-4 w-4" />
								{t("orders.add_item")}
							</button>
						</div>

						{items.map((item, index) => {
							const book = getBook(item.book_id);
							const unitPrice = calcUnitPrice(book);
							const subtotal = calcItemSubtotal(item);

							return (
								<div
									key={item.uid}
									className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden"
								>
									<div className="p-5 flex flex-col gap-4">
										<div className="flex justify-between items-start gap-4">
											<div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="flex flex-col gap-1.5">
													<Label className="text-xs text-on-surface-variant">
														{t("orders.select_book")}
													</Label>
													<Select
														value={item.book_id}
														onValueChange={(v) =>
															updateItem(index, "book_id", v)
														}
													>
														<SelectTrigger className="h-10">
															<SelectValue
																placeholder={t("orders.select_book")}
															/>
														</SelectTrigger>
														<SelectContent>
															{books.length === 0 && (
																<SelectItem value="__none__" disabled>
																	{t("orders.no_books_available")}
																</SelectItem>
															)}
															{books.map((b) => (
																<SelectItem key={b.id} value={b.id}>
																	{b.title}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<div className="flex flex-col gap-1.5">
													<Label className="text-xs text-on-surface-variant">
														{t("orders.copies")}
													</Label>
													<Input
														type="number"
														min={1}
														value={item.copies}
														onChange={(e) =>
															updateItem(
																index,
																"copies",
																Number(e.target.value) || 1,
															)
														}
														className="h-10 tabular-nums"
													/>
												</div>
											</div>
											<button
												type="button"
												className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors mt-6"
												onClick={() => removeItem(index)}
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>

										{book && (
											<div className="bg-surface-container rounded-lg p-4 space-y-3">
												<button
													type="button"
													className="flex items-center gap-2 text-sm font-medium text-on-surface"
													onClick={() => toggleExpand(item.uid)}
												>
													{expandedItems.has(item.uid) ? (
														<ChevronDown className="h-4 w-4" />
													) : (
														<ChevronRight className="h-4 w-4" />
													)}
													{book.title}
												</button>

												<div className="flex flex-wrap gap-2">
													<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
														{book.total_pages} {t("books.pages")}
													</span>
													<span
														className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
															book.color_mode === "color"
																? "bg-primary/10 text-primary"
																: "bg-gray-100 text-gray-600"
														}`}
													>
														{book.color_mode === "color"
															? t("books.color_color")
															: t("books.color_bw")}
													</span>
													<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
														{book.sides_per_page === 1
															? t("orders.single_side")
															: `${book.sides_per_page}`}
													</span>
													{book.binding_type && (
														<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
															{t(`books.binding_${book.binding_type}`)}
														</span>
													)}
													{book.has_lamination && (
														<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
															{t("orders.lamination")}
														</span>
													)}
												</div>

												{expandedItems.has(item.uid) && (
													<div className="border-t border-outline-variant pt-3 mt-2">
														<p className="text-xs text-on-surface-variant mb-2">
															{t("orders.materials_used")}
														</p>
														<table className="w-full text-xs">
															<thead>
																<tr className="border-b border-outline-variant">
																	<th className="text-left py-1.5 font-medium text-on-surface-variant">
																		{t("orders.material_name")}
																	</th>
																	<th className="text-right py-1.5 font-medium text-on-surface-variant">
																		{t("orders.qty_per_copy")}
																	</th>
																	<th className="text-right py-1.5 font-medium text-on-surface-variant">
																		{t("orders.material_price")}
																	</th>
																	<th className="text-right py-1.5 font-medium text-on-surface-variant">
																		{t("orders.material_line_total")}
																	</th>
																</tr>
															</thead>
															<tbody>
																{book.book_materials.map((m) => (
																	<tr
																		key={m.material_id}
																		className="border-b border-outline-variant last:border-b-0"
																	>
																		<td className="py-1.5 text-on-surface">
																			{m.material_name}
																		</td>
																		<td className="py-1.5 text-right tabular-nums text-on-surface">
																			{m.quantity_per_copy}
																		</td>
																		<td className="py-1.5 text-right tabular-nums text-on-surface">
																			{formatCurrency(
																				m.price_per_unit,
																				language,
																			)}
																		</td>
																		<td className="py-1.5 text-right tabular-nums font-semibold text-on-surface">
																			{formatCurrency(
																				m.quantity_per_copy * m.price_per_unit,
																				language,
																			)}
																		</td>
																	</tr>
																))}
															</tbody>
														</table>
													</div>
												)}

												<div className="border-t border-outline-variant pt-3 flex items-center justify-between">
													<div className="text-xs text-on-surface-variant">
														{t("orders.unit_price")}:{" "}
														<span className="font-semibold text-on-surface tabular-nums">
															{formatCurrency(unitPrice, language)}
														</span>
													</div>
													<div className="flex items-center gap-2">
														<span className="text-sm text-on-surface-variant font-medium">
															{t("orders.item_subtotal")}:
														</span>
														<span className="font-semibold text-lg text-primary tabular-nums">
															{formatCurrency(subtotal, language)}
														</span>
													</div>
												</div>
											</div>
										)}

										{!book && item.book_id === "" && (
											<p className="text-xs text-on-surface-variant italic">
												{t("orders.auto_price_note")}
											</p>
										)}
									</div>
								</div>
							);
						})}

						<button
							type="button"
							className="w-full py-4 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
							onClick={addItem}
						>
							<Plus className="h-4 w-4" />
							<span className="font-medium">
								{t("orders.add_another_item")}
							</span>
						</button>
					</div>
				</div>

				<div className="lg:col-span-4 flex flex-col gap-6 sticky top-20">
					<div className="bg-primary text-on-primary rounded-xl overflow-hidden">
						<div className="p-6 flex flex-col gap-6">
							<div className="flex justify-between items-center">
								<h3 className="font-bold text-sm opacity-90">
									{t("orders.order_summary")}
								</h3>
								<span className="bg-on-primary/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
									{t("status.new")}
								</span>
							</div>
							<div className="space-y-4 border-t border-on-primary/10 pt-4">
								<div className="flex justify-between text-sm opacity-80">
									<span>
										{t("orders.total_items")} ({items.length})
									</span>
									<span className="tabular-nums font-bold">
										{formatCurrency(totalAmount, language)}
									</span>
								</div>
							</div>
							<div className="border-t-2 border-dashed border-on-primary/20 pt-4 flex flex-col gap-1">
								<div className="flex justify-between items-end">
									<span className="font-medium text-sm opacity-90 uppercase">
										{t("orders.total_amount")}
									</span>
									<span className="text-2xl font-extrabold tabular-nums tracking-tight">
										{formatCurrency(totalAmount, language)}
									</span>
								</div>
							</div>
							<div className="bg-on-primary/10 rounded-lg p-4 space-y-3">
								<div className="flex flex-col gap-1.5">
									<Label className="text-[11px] font-bold opacity-70 uppercase text-on-primary">
										{t("orders.paid_amount")}
									</Label>
									<Input
										type="number"
										value={paidAmount}
										onChange={(e) => setPaidAmount(e.target.value)}
										className="bg-white/10 border-none h-9 tabular-nums text-on-primary placeholder:text-on-primary/40"
									/>
								</div>
								<div className="flex justify-between items-center pt-2">
									<span className="text-sm font-medium opacity-80">
										{t("orders.balance_due")}
									</span>
									<span className="text-lg font-bold tabular-nums">
										{formatCurrency(balanceDue, language)}
									</span>
								</div>
							</div>
							<div className="flex flex-col gap-3 pt-2">
								<Button
									className="w-full h-12 bg-on-primary text-primary font-bold hover:bg-surface-bright shadow-md active:scale-[0.98] gap-2"
									onClick={handleSubmit}
									disabled={createOrder.isPending}
								>
									{t("orders.create_order")}
								</Button>
							</div>
						</div>
					</div>

					<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
						<button
							type="button"
							className="flex items-center gap-3 px-3 py-2 text-error hover:bg-error-container/20 transition-colors rounded-lg font-medium text-sm"
							onClick={() => navigate(-1)}
						>
							<XCircle className="h-4 w-4" />
							{t("orders.cancel_order")}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
