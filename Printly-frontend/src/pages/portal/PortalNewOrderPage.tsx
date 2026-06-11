import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { OrderItemCreate } from "@/types/order";
import type { PortalPricingItem } from "@/types/portal";

const itemSchema = z.object({
	book_id: z.string().optional(),
	book_title: z.string().min(1, "Required"),
	copies: z.number().min(1),
	pages_per_copy: z.number().min(1),
	sides_per_page: z.number().min(1).max(4),
	printing_price: z.number().min(0),
	cover_type: z.string().optional(),
	cover_price: z.number().min(0),
	binding_type: z.string().optional(),
	binding_price: z.number().min(0),
	has_lamination: z.boolean(),
	lamination_price: z.number().min(0),
});

const orderSchema = z.object({
	items: z.array(itemSchema).min(1),
	notes: z.string().optional(),
	due_date: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function PortalNewOrderPage() {
	const { tenantId } = useParams<{ tenantId: string }>();
	const { t, language, isRTL } = useLanguage();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const tid = tenantId ?? "";
	const itemKeyCounter = useRef(0);
	const [itemKeys, setItemKeys] = useState([0]);

	const { data: booksData } = useQuery({
		queryKey: ["portal-books", tid],
		queryFn: () => portalApi.getBooks(tid),
		enabled: !!tid,
	});

	const { data: pricingData } = useQuery({
		queryKey: ["portal-pricing", tid],
		queryFn: () => portalApi.getPricing(tid),
		enabled: !!tid,
	});

	const pricingByType: Record<string, PortalPricingItem[]> = {};
	pricingData?.rules?.forEach((r) => {
		if (!pricingByType[r.component_type]) pricingByType[r.component_type] = [];
		pricingByType[r.component_type].push(r);
	});

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<OrderFormData>({
		resolver: zodResolver(orderSchema),
		defaultValues: {
			items: [
				{
					book_id: "",
					book_title: "",
					copies: 1,
					pages_per_copy: 1,
					sides_per_page: 1,
					printing_price: 0,
					cover_type: "",
					cover_price: 0,
					binding_type: "",
					binding_price: 0,
					has_lamination: false,
					lamination_price: 0,
				},
			],
			notes: "",
			due_date: "",
		},
	});

	const items = watch("items");

	const mutation = useMutation({
		mutationFn: async (data: OrderFormData) => {
			const orderItems: OrderItemCreate[] = data.items.map((item) => ({
				book_id: item.book_id || undefined,
				book_title: item.book_title,
				copies: item.copies,
				pages_per_copy: item.pages_per_copy,
				sides_per_page: item.sides_per_page,
				printing_price: item.printing_price,
				cover_type: item.cover_type || undefined,
				cover_price: item.cover_price,
				binding_type: item.binding_type || undefined,
				binding_price: item.binding_price,
				has_lamination: item.has_lamination,
				lamination_price: item.lamination_price,
				extra_services: {},
			}));
			return portalApi.createOrder(tid, {
				customer_id: undefined,
				items: orderItems,
				notes: data.notes || undefined,
				due_date: data.due_date || undefined,
			});
		},
		onSuccess: (data) => {
			toast.success(t("portal.order_created"));
			queryClient.invalidateQueries({ queryKey: ["portal-orders", tid] });
			navigate(`/portal/${tid}/orders/${data.id}`);
		},
		onError: () => toast.error(t("common.error")),
	});

	const totalAmount = items.reduce((sum, item) => {
		const sheets = Math.ceil(item.pages_per_copy / item.sides_per_page);
		return (
			sum +
			sheets * item.printing_price * item.copies +
			item.cover_price * item.copies +
			item.binding_price * item.copies +
			item.lamination_price * item.copies
		);
	}, 0);

	const handleBookSelect = (idx: number, bookId: string) => {
		const book = booksData?.items?.find((b) => b.id === bookId);
		if (book) {
			setValue(`items.${idx}.book_id`, bookId);
			setValue(`items.${idx}.book_title`, book.title);
			setValue(`items.${idx}.pages_per_copy`, book.total_pages);
		}
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

			<form
				onSubmit={handleSubmit((data) => mutation.mutate(data))}
				className="space-y-6"
			>
				{items.map((item, idx) => (
					<div
						key={itemKeys[idx]}
						className="bg-card border border-border rounded-xl p-5 space-y-4"
					>
						<h3 className="font-bold text-sm">
							{t("orders.add_item")} #{idx + 1}
						</h3>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>{t("portal.select_book")}</Label>
								<Select onValueChange={(v) => handleBookSelect(idx, v)}>
									<SelectTrigger>
										<SelectValue placeholder={t("portal.no_book")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">{t("portal.no_book")}</SelectItem>
										{booksData?.items?.map((book) => (
											<SelectItem key={book.id} value={book.id}>
												{book.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>{t("orders.book_title")}</Label>
								<Input {...register(`items.${idx}.book_title`)} />
								{errors.items?.[idx]?.book_title && (
									<p className="text-xs text-red-500">
										{errors.items[idx]?.book_title?.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label>{t("orders.copies")}</Label>
								<Input
									type="number"
									{...register(`items.${idx}.copies`, { valueAsNumber: true })}
									min={1}
								/>
							</div>

							<div className="space-y-2">
								<Label>{t("orders.pages_per_copy")}</Label>
								<Input
									type="number"
									{...register(`items.${idx}.pages_per_copy`, {
										valueAsNumber: true,
									})}
									min={1}
								/>
							</div>

							<div className="space-y-2">
								<Label>{t("orders.sides")}</Label>
								<Select
									onValueChange={(v) =>
										setValue(`items.${idx}.sides_per_page`, Number(v))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1">{t("orders.single_side")}</SelectItem>
										<SelectItem value="2">{t("orders.double_side")}</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>{t("orders.cover")}</Label>
								<Select
									onValueChange={(v) => setValue(`items.${idx}.cover_type`, v)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">{t("orders.none")}</SelectItem>
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

							<div className="space-y-2">
								<Label>{t("orders.binding")}</Label>
								<Select
									onValueChange={(v) =>
										setValue(`items.${idx}.binding_type`, v)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">{t("orders.none")}</SelectItem>
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

							<div className="space-y-2">
								<Label>{t("orders.lamination")}</Label>
								<div className="flex items-center gap-2">
									<Switch
										checked={item.has_lamination}
										onCheckedChange={(v) =>
											setValue(`items.${idx}.has_lamination`, v)
										}
									/>
									<span className="text-sm">
										{item.has_lamination
											? t("orders.glossy")
											: t("orders.none")}
									</span>
								</div>
							</div>

							<div className="space-y-2">
								<Label>{t("portal.price_per_page")} (EGP)</Label>
								<Input
									type="number"
									{...register(`items.${idx}.printing_price`, {
										valueAsNumber: true,
									})}
									min={0}
									step={0.01}
								/>
							</div>

							<div className="space-y-2">
								<Label>{t("portal.cover_price")} (EGP)</Label>
								<Input
									type="number"
									{...register(`items.${idx}.cover_price`, {
										valueAsNumber: true,
									})}
									min={0}
									step={0.01}
								/>
							</div>

							<div className="space-y-2">
								<Label>{t("portal.binding_price")} (EGP)</Label>
								<Input
									type="number"
									{...register(`items.${idx}.binding_price`, {
										valueAsNumber: true,
									})}
									min={0}
									step={0.01}
								/>
							</div>

							<div className="space-y-2">
								<Label>{t("portal.lamination_price")} (EGP)</Label>
								<Input
									type="number"
									{...register(`items.${idx}.lamination_price`, {
										valueAsNumber: true,
									})}
									min={0}
									step={0.01}
								/>
							</div>
						</div>
					</div>
				))}

				<Button
					variant="outline"
					type="button"
					onClick={() => {
						itemKeyCounter.current += 1;
						setItemKeys([...itemKeys, itemKeyCounter.current]);
						setValue(`items.${items.length}`, {
							book_id: "",
							book_title: "",
							copies: 1,
							pages_per_copy: 1,
							sides_per_page: 1,
							printing_price: 0,
							cover_type: "",
							cover_price: 0,
							binding_type: "",
							binding_price: 0,
							has_lamination: false,
							lamination_price: 0,
						});
					}}
					className="gap-2"
				>
					{t("orders.add_another_item")}
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
							{items.length}
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
						<Label>{t("orders.due_date")}</Label>
						<Input type="date" {...register("due_date")} />
					</div>

					<div className="space-y-2">
						<Label>{t("orders.notes")}</Label>
						<Input
							{...register("notes")}
							placeholder={t("orders.notes_placeholder")}
						/>
					</div>
				</div>

				<Button type="submit" disabled={isSubmitting} className="w-full">
					{isSubmitting ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						t("orders.create_order")
					)}
				</Button>
			</form>
		</div>
	);
}
