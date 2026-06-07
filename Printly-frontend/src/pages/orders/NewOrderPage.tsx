import { useMutation } from "@tanstack/react-query";
import {
	ArrowLeft,
	Plus,
	PlusCircle,
	Printer,
	Trash2,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { ordersApi } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { OrderCreate, OrderItemCreate } from "@/types/order";

interface OrderItemForm {
	uid: string;
	book_title: string;
	copies: number;
	pages_per_copy: number;
	sides_per_page: number;
	printing_price: number;
	cover_type: string;
	cover_price: number;
	binding_type: string;
	binding_price: number;
	has_lamination: boolean;
	lamination_price: number;
	subtotal: number;
}

let uidCounter = 0;
const nextUid = () => `item-${++uidCounter}`;

const defaultItem: OrderItemForm = {
	uid: nextUid(),
	book_title: "",
	copies: 1,
	pages_per_copy: 0,
	sides_per_page: 1,
	printing_price: 0,
	cover_type: "",
	cover_price: 0,
	binding_type: "",
	binding_price: 0,
	has_lamination: false,
	lamination_price: 0,
	subtotal: 0,
};

function calcItemSubtotal(item: OrderItemForm): number {
	return (
		item.printing_price +
		item.cover_price +
		item.binding_price +
		item.lamination_price
	);
}

export default function NewOrderPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const [customer, setCustomer] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [notes, setNotes] = useState("");
	const [paidAmount, setPaidAmount] = useState("");
	const [items, setItems] = useState<OrderItemForm[]>([{ ...defaultItem }]);

	const createOrder = useMutation({
		mutationFn: (data: OrderCreate) => ordersApi.create(data),
		onSuccess: (order) => {
			navigate(`/orders/${order.id}`);
		},
	});

	const addItem = () =>
		setItems([...items, { ...defaultItem, uid: nextUid() }]);
	const removeItem = (index: number) =>
		setItems(items.filter((_, i) => i !== index));

	const updateItem = (
		index: number,
		field: string,
		value: number | string | boolean,
	) => {
		const updated = [...items];
		(updated[index] as unknown as Record<string, unknown>)[field] = value;
		updated[index].subtotal = calcItemSubtotal(updated[index]);
		setItems(updated);
	};

	const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
	const balanceDue = totalAmount - (parseFloat(paidAmount) || 0);

	const handleSubmit = () => {
		const orderItems: OrderItemCreate[] = items.map((item) => ({
			book_title: item.book_title,
			copies: item.copies,
			pages_per_copy: item.pages_per_copy,
			sides_per_page: item.sides_per_page,
			printing_price: item.printing_price,
			cover_type: item.cover_type || undefined,
			cover_price: item.cover_price || undefined,
			binding_type: item.binding_type || undefined,
			binding_price: item.binding_price || undefined,
			has_lamination: item.has_lamination,
			lamination_price: item.has_lamination ? item.lamination_price : undefined,
		}));

		createOrder.mutate({
			customer_id: customer || undefined,
			due_date: dueDate || undefined,
			notes: notes || undefined,
			items: orderItems,
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
								<PlusCircle className="h-4 w-4" />
								{t("orders.add_item")}
							</button>
						</div>

						{items.map((item, index) => (
							<div
								key={item.uid}
								className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden"
							>
								<div className="p-5 flex flex-col gap-5">
									<div className="flex justify-between items-start gap-4">
										<div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
											<div className="md:col-span-2 flex flex-col gap-1.5">
												<Label className="text-xs text-on-surface-variant">
													{t("orders.book_title")}
												</Label>
												<Input
													value={item.book_title}
													onChange={(e) =>
														updateItem(index, "book_title", e.target.value)
													}
													className="h-10"
												/>
											</div>
											<div className="flex flex-col gap-1.5">
												<Label className="text-xs text-on-surface-variant">
													{t("orders.copies")}
												</Label>
												<Input
													type="number"
													value={item.copies}
													onChange={(e) =>
														updateItem(index, "copies", Number(e.target.value))
													}
													className="h-10 tabular-nums"
												/>
											</div>
											<div className="flex flex-col gap-1.5">
												<Label className="text-xs text-on-surface-variant">
													{t("orders.pages_per_copy")}
												</Label>
												<Input
													type="number"
													value={item.pages_per_copy}
													onChange={(e) =>
														updateItem(
															index,
															"pages_per_copy",
															Number(e.target.value),
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

									<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-outline-variant">
										<div className="flex flex-col gap-1.5">
											<Label className="text-xs text-on-surface-variant">
												{t("orders.sides")}
											</Label>
											<Select
												value={String(item.sides_per_page)}
												onValueChange={(v) =>
													updateItem(index, "sides_per_page", Number(v))
												}
											>
												<SelectTrigger className="h-9 text-sm">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="1">
														{t("orders.single_side")}
													</SelectItem>
													<SelectItem value="2">
														{t("orders.double_side")}
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="flex flex-col gap-1.5">
											<Label className="text-xs text-on-surface-variant">
												{t("orders.cover_type")}
											</Label>
											<Select
												value={item.cover_type}
												onValueChange={(v) =>
													updateItem(index, "cover_type", v)
												}
											>
												<SelectTrigger className="h-9 text-sm">
													<SelectValue placeholder={t("orders.select_cover")} />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="hardcover_matte">
														{t("orders.hardcover_matte")}
													</SelectItem>
													<SelectItem value="softcover_glossy">
														{t("orders.softcover_glossy")}
													</SelectItem>
													<SelectItem value="spiral_wrap">
														{t("orders.spiral_wrap")}
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="flex flex-col gap-1.5">
											<Label className="text-xs text-on-surface-variant">
												{t("orders.binding_type")}
											</Label>
											<Select
												value={item.binding_type}
												onValueChange={(v) =>
													updateItem(index, "binding_type", v)
												}
											>
												<SelectTrigger className="h-9 text-sm">
													<SelectValue
														placeholder={t("orders.select_binding")}
													/>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="glue">
														{t("orders.glue_binding")}
													</SelectItem>
													<SelectItem value="spiral">
														{t("orders.spiral_binding")}
													</SelectItem>
													<SelectItem value="staple">
														{t("orders.staple_binding")}
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="flex flex-col gap-1.5">
											<Label className="text-xs text-on-surface-variant">
												{t("orders.lamination")}
											</Label>
											<div className="flex items-center gap-3 mt-1.5">
												<Switch
													checked={item.has_lamination}
													onCheckedChange={(v) =>
														updateItem(index, "has_lamination", v)
													}
												/>
												<span className="text-sm font-medium text-on-surface">
													{item.has_lamination
														? t("orders.glossy")
														: t("orders.none")}
												</span>
											</div>
										</div>
									</div>

									<div className="flex flex-wrap items-center justify-between gap-4">
										<div className="flex items-center gap-4 text-xs text-on-surface-variant">
											<span>
												{t("orders.print")}:
												<span className="tabular-nums font-bold text-on-surface">
													{formatCurrency(item.printing_price, language)}
												</span>
											</span>
											<span className="text-outline-variant">|</span>
											<span>
												{t("orders.cover")}:
												<span className="tabular-nums font-bold text-on-surface">
													{formatCurrency(item.cover_price, language)}
												</span>
											</span>
											<span className="text-outline-variant">|</span>
											<span>
												{t("orders.binding")}:
												<span className="tabular-nums font-bold text-on-surface">
													{formatCurrency(item.binding_price, language)}
												</span>
											</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-sm text-on-surface-variant font-medium">
												{t("orders.subtotal")}:
											</span>
											<span className="font-semibold text-lg text-primary tabular-nums">
												{formatCurrency(item.subtotal, language)}
											</span>
										</div>
									</div>
								</div>
							</div>
						))}

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
								<Button
									variant="outline"
									className="w-full h-10 border-on-primary/30 text-on-primary hover:bg-white/10"
								>
									{t("orders.save_draft")}
								</Button>
							</div>
						</div>
					</div>

					<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
						<button
							type="button"
							className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container transition-colors rounded-lg font-medium text-sm"
						>
							<Printer className="h-4 w-4" />
							{t("orders.print_receipt")}
						</button>
						<button
							type="button"
							className="flex items-center gap-3 px-3 py-2 text-error hover:bg-error-container/20 transition-colors rounded-lg font-medium text-sm"
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
