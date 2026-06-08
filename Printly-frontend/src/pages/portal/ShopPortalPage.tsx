import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

export default function ShopPortalPage() {
	const { tenantId } = useParams<{ tenantId: string }>();
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const tid = tenantId ?? "";

	const {
		data: orders,
		isLoading: ordersLoading,
		isError: ordersError,
	} = useQuery({
		queryKey: ["portal-orders", tid],
		queryFn: () => portalApi.getOrders(tid),
		enabled: !!tid,
	});

	const {
		data: books,
		isLoading: booksLoading,
		isError: booksError,
	} = useQuery({
		queryKey: ["portal-books", tid],
		queryFn: () => portalApi.getBooks(tid),
		enabled: !!tid,
	});

	const {
		data: balance,
		isLoading: balanceLoading,
		isError: balanceError,
	} = useQuery({
		queryKey: ["portal-balance", tid],
		queryFn: () => portalApi.getBalance(tid),
		enabled: !!tid,
	});

	const {
		data: notifications,
		isLoading: notificationsLoading,
		isError: notificationsError,
	} = useQuery({
		queryKey: ["portal-notifications", tid],
		queryFn: () => portalApi.getNotifications(tid),
		enabled: !!tid,
	});

	const markReadMutation = useMutation({
		mutationFn: (notificationId: string) =>
			portalApi.markNotificationRead(tid, notificationId),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["portal-notifications", tid],
			}),
		onError: () => toast.error(t("common.error")),
	});

	const markAllReadMutation = useMutation({
		mutationFn: () => portalApi.markAllNotificationsRead(tid),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["portal-notifications", tid],
			}),
		onError: () => toast.error(t("common.error")),
	});

	return (
		<div className="space-y-6">
			<Link
				to="/portal"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("common.back")}
			</Link>

			<Tabs defaultValue="orders">
				<TabsList>
					<TabsTrigger value="orders">{t("portal.my_orders")}</TabsTrigger>
					<TabsTrigger value="books">{t("portal.my_books")}</TabsTrigger>
					<TabsTrigger value="balance">{t("portal.my_balance")}</TabsTrigger>
					<TabsTrigger value="notifications">
						{t("notifications.title")}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="orders">
					<div className="bg-background border border-border rounded-xl overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full text-start border-collapse">
								<thead>
									<tr className="bg-muted/50 text-muted-foreground">
										<th className="px-6 py-4 font-medium text-sm border-b border-border">
											{t("orders.order_number")}
										</th>
										<th className="px-6 py-4 font-medium text-sm border-b border-border">
											{t("orders.status")}
										</th>
										<th className="px-6 py-4 font-medium text-sm border-b border-border">
											{t("orders.total")}
										</th>
										<th className="px-6 py-4 font-medium text-sm border-b border-border">
											{t("orders.created")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{ordersLoading ? (
										<tr>
											<td
												colSpan={4}
												className="px-6 py-8 text-center text-muted-foreground"
											>
												<Loader2 className="h-4 w-4 animate-spin mx-auto" />
											</td>
										</tr>
									) : ordersError ? (
										<tr>
											<td
												colSpan={4}
												className="px-6 py-8 text-center text-error"
											>
												{t("common.error")}
											</td>
										</tr>
									) : !orders?.orders?.length ? (
										<tr>
											<td
												colSpan={4}
												className="px-6 py-8 text-center text-muted-foreground"
											>
												{t("common.no_data")}
											</td>
										</tr>
									) : (
										orders.orders.map((order) => (
											<tr
												key={order.id}
												className="hover:bg-muted/30 transition-colors cursor-pointer"
												onClick={() =>
													navigate(`/portal/${tid}/orders/${order.id}`)
												}
											>
												<td className="px-6 py-4 text-sm font-bold tabular-nums">
													#{order.order_number}
												</td>
												<td className="px-6 py-4">
													<StatusBadge status={order.status} />
												</td>
												<td className="px-6 py-4 text-sm font-semibold tabular-nums">
													{formatCurrency(order.total_amount, language)}
												</td>
												<td className="px-6 py-4 text-xs text-muted-foreground">
													{formatDate(order.created_at, language)}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="books">
					<div className="bg-background border border-border rounded-xl overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full text-start border-collapse">
								<thead>
									<tr className="bg-muted/50 text-muted-foreground">
										<th className="px-6 py-4 font-medium text-sm border-b border-border">
											{t("books.title_field")}
										</th>
										<th className="px-6 py-4 font-medium text-sm border-b border-border">
											{t("books.subject")}
										</th>
										<th className="px-6 py-4 font-medium text-sm border-b border-border">
											{t("books.pages")}
										</th>
										<th className="px-6 py-4 font-medium text-sm border-b border-border">
											{t("books.status")}
										</th>
										<th className="px-6 py-4 font-medium text-sm border-b border-border">
											{t("books.created")}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{booksLoading ? (
										<tr>
											<td
												colSpan={5}
												className="px-6 py-8 text-center text-muted-foreground"
											>
												<Loader2 className="h-4 w-4 animate-spin mx-auto" />
											</td>
										</tr>
									) : booksError ? (
										<tr>
											<td
												colSpan={5}
												className="px-6 py-8 text-center text-error"
											>
												{t("common.error")}
											</td>
										</tr>
									) : !books?.books?.length ? (
										<tr>
											<td
												colSpan={5}
												className="px-6 py-8 text-center text-muted-foreground"
											>
												{t("common.no_data")}
											</td>
										</tr>
									) : (
										books.books.map((book) => (
											<tr key={book.id} className="hover:bg-muted/30">
												<td className="px-6 py-4 text-sm font-medium">
													{book.title}
												</td>
												<td className="px-6 py-4 text-sm">
													{book.subject || "—"}
												</td>
												<td className="px-6 py-4 text-sm tabular-nums">
													{book.total_pages}
												</td>
												<td className="px-6 py-4">
													{book.local_file_path ? (
														<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
															{t("books.has_file")}
														</span>
													) : (
														<span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
															{t("books.no_file")}
														</span>
													)}
												</td>
												<td className="px-6 py-4 text-xs text-muted-foreground">
													{formatDate(book.created_at, language)}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="balance">
					{balanceLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : balanceError ? (
						<div className="bg-background border border-border rounded-xl p-12 text-center text-error">
							{t("common.error")}
						</div>
					) : balance ? (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-background border border-border rounded-xl p-5">
								<span className="font-medium text-sm text-on-surface-variant">
									{t("customers.balance")}
								</span>
								<p className="mt-2 text-xl font-semibold tabular-nums">
									{formatCurrency(balance.balance, language)}
								</p>
							</div>
							<div className="bg-background border border-border rounded-xl p-5">
								<span className="font-medium text-sm text-on-surface-variant">
									{t("portal.unpaid_total")}
								</span>
								<p className="mt-2 text-xl font-semibold tabular-nums">
									{formatCurrency(balance.unpaid_total, language)}
								</p>
							</div>
							<div className="bg-background border border-border rounded-xl p-5">
								<span className="font-medium text-sm text-on-surface-variant">
									{t("portal.net_balance")}
								</span>
								<p className="mt-2 text-xl font-semibold tabular-nums">
									{formatCurrency(balance.net_balance, language)}
								</p>
							</div>
						</div>
					) : (
						<div className="bg-background border border-border rounded-xl p-12 text-center text-muted-foreground">
							{t("common.no_data")}
						</div>
					)}
				</TabsContent>

				<TabsContent value="notifications">
					<div className="space-y-3">
						{(notifications?.unread_count ?? 0) > 0 && (
							<button
								type="button"
								onClick={() => markAllReadMutation.mutate()}
								disabled={markAllReadMutation.isPending}
								className="text-primary text-xs font-bold hover:underline cursor-pointer"
							>
								{t("notifications.mark_all_read")}
							</button>
						)}

						<div className="bg-background border border-border rounded-xl overflow-hidden">
							<div className="overflow-x-auto">
								<table className="w-full text-start border-collapse">
									<thead>
										<tr className="bg-muted/50 text-muted-foreground">
											<th className="px-6 py-4 font-medium text-sm border-b border-border">
												{t("notifications.message")}
											</th>
											<th className="px-6 py-4 font-medium text-sm border-b border-border">
												{t("notifications.type")}
											</th>
											<th className="px-6 py-4 font-medium text-sm border-b border-border">
												{t("notifications.created")}
											</th>
											<th className="px-6 py-4 font-medium text-sm border-b border-border">
												{t("notifications.actions")}
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{notificationsLoading ? (
											<tr>
												<td
													colSpan={4}
													className="px-6 py-8 text-center text-muted-foreground"
												>
													<Loader2 className="h-4 w-4 animate-spin mx-auto" />
												</td>
											</tr>
										) : notificationsError ? (
											<tr>
												<td
													colSpan={4}
													className="px-6 py-8 text-center text-error"
												>
													{t("common.error")}
												</td>
											</tr>
										) : !notifications?.notifications?.length ? (
											<tr>
												<td
													colSpan={4}
													className="px-6 py-8 text-center text-muted-foreground"
												>
													{t("notifications.no_data")}
												</td>
											</tr>
										) : (
											notifications.notifications.map((n) => (
												<tr key={n.id} className="hover:bg-muted/30">
													<td className="px-6 py-4 text-sm">
														<div className="flex items-center gap-2">
															{!n.is_read && (
																<span className="w-2 h-2 rounded-full bg-primary" />
															)}
															<span>{n.message}</span>
														</div>
													</td>
													<td className="px-6 py-4 text-xs">
														{t(`notifications.type_${n.notification_type}`)}
													</td>
													<td className="px-6 py-4 text-xs text-muted-foreground">
														{formatDate(n.created_at, language)}
													</td>
													<td className="px-6 py-4">
														{!n.is_read && (
															<button
																type="button"
																onClick={() => markReadMutation.mutate(n.id)}
																disabled={markReadMutation.isPending}
																className="text-primary text-xs font-bold hover:underline cursor-pointer"
															>
																{t("notifications.read")}
															</button>
														)}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
