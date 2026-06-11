import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	CheckCircle,
	Clock,
	FileText,
	Loader2,
	Moon,
	Package,
	Sun,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

const ORDER_STATUS_FILTERS = [
	"all",
	"new",
	"printing",
	"ready",
	"delivered",
] as const;

export default function ShopPortalPage() {
	const { tenantId } = useParams<{ tenantId: string }>();
	const { t, language, isRTL } = useLanguage();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const tid = tenantId ?? "";
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const { data: tenants } = useQuery({
		queryKey: ["portal-tenants"],
		queryFn: portalApi.getTenants,
	});

	const currentTenant = tenants?.tenants?.find((t) => t.tenant_id === tid);

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

	const filteredOrders = orders?.orders?.filter((order) =>
		statusFilter === "all" ? true : order.status === statusFilter,
	);

	const totalOrders = orders?.orders?.length ?? 0;
	const totalSpent =
		orders?.orders?.reduce((sum, o) => sum + o.total_amount, 0) ?? 0;

	return (
		<div className="space-y-6">
			<div
				className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
			>
				<Link
					to="/portal"
					className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("common.back")}
				</Link>
			</div>

			<div
				className={`flex items-center gap-3 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}
			>
				<h1 className="text-xl font-bold">
					{currentTenant?.tenant_name || t("portal.my_orders")}
				</h1>
				{currentTenant?.is_approved ? (
					<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
						<CheckCircle className="h-3 w-3" />
						{t("customers.approved")}
					</span>
				) : (
					<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
						<Clock className="h-3 w-3" />
						{t("customers.pending")}
					</span>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-card border border-border rounded-xl p-4">
					<div className="flex items-center gap-2 mb-2">
						<Package className="h-4 w-4 text-primary" />
						<span className="text-xs font-medium text-muted-foreground">
							{t("portal.total_orders")}
						</span>
					</div>
					<span className="text-xl font-bold tabular-nums">
						{ordersLoading ? "—" : totalOrders}
					</span>
				</div>
				<div className="bg-card border border-border rounded-xl p-4">
					<div className="flex items-center gap-2 mb-2">
						<Wallet className="h-4 w-4 text-green-600" />
						<span className="text-xs font-medium text-muted-foreground">
							{t("portal.total_spent")}
						</span>
					</div>
					<span className="text-xl font-bold tabular-nums">
						{ordersLoading ? "—" : formatCurrency(totalSpent, language)}
					</span>
				</div>
				<div className="bg-card border border-border rounded-xl p-4">
					<div className="flex items-center gap-2 mb-2">
						<Sun className="h-4 w-4 text-yellow-600" />
						<span className="text-xs font-medium text-muted-foreground">
							{t("portal.current_balance")}
						</span>
					</div>
					<span className="text-xl font-bold tabular-nums">
						{balanceLoading
							? "—"
							: formatCurrency(balance?.balance ?? 0, language)}
					</span>
				</div>
			</div>

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
					<div className="space-y-4">
						<div
							className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
						>
							<span className="text-xs font-medium text-muted-foreground">
								{t("portal.filter_status")}:
							</span>
							{ORDER_STATUS_FILTERS.map((status) => (
								<button
									key={status}
									type="button"
									onClick={() => setStatusFilter(status)}
									className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
										statusFilter === status
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground hover:bg-muted/80"
									}`}
								>
									{t(`portal.${status}`) || t(`status.${status}`) || status}
								</button>
							))}
						</div>

						{ordersLoading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-primary" />
							</div>
						) : ordersError ? (
							<div className="bg-card border border-border rounded-xl p-8 text-center text-error">
								{t("common.error")}
							</div>
						) : !filteredOrders?.length ? (
							<div className="bg-card border border-border rounded-xl p-8 text-center">
								<Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
								<p className="text-sm text-muted-foreground">
									{t("portal.no_orders_desc")}
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{filteredOrders.map((order) => (
									<button
										key={order.id}
										type="button"
										onClick={() =>
											navigate(`/portal/${tid}/orders/${order.id}`)
										}
										className="w-full bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors text-start"
									>
										<div
											className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
										>
											<div
												className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
											>
												<span className="font-bold text-sm tabular-nums">
													#{order.order_number}
												</span>
												<StatusBadge status={order.status} />
											</div>
											<span className="text-sm font-semibold tabular-nums">
												{formatCurrency(order.total_amount, language)}
											</span>
										</div>
										<div className="mt-2 text-xs text-muted-foreground">
											{formatDate(order.created_at, language)}
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</TabsContent>

				<TabsContent value="books">
					{booksLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-primary" />
						</div>
					) : booksError ? (
						<div className="bg-card border border-border rounded-xl p-8 text-center text-error">
							{t("common.error")}
						</div>
					) : !books?.books?.length ? (
						<div className="bg-card border border-border rounded-xl p-8 text-center">
							<FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
							<p className="text-sm text-muted-foreground">
								{t("common.no_data")}
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{books.books.map((book) => (
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
									<div className="space-y-1">
										{book.subject && (
											<p className="text-xs text-muted-foreground">
												{t("books.subject")}: {book.subject}
											</p>
										)}
										<p className="text-xs text-muted-foreground">
											{t("portal.pages")}: {book.total_pages}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatDate(book.created_at, language)}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="balance">
					{balanceLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-primary" />
						</div>
					) : balanceError ? (
						<div className="bg-card border border-border rounded-xl p-8 text-center text-error">
							{t("common.error")}
						</div>
					) : balance ? (
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="bg-card border border-border rounded-xl p-5">
									<div className="flex items-center gap-2 mb-2">
										<Wallet className="h-4 w-4 text-primary" />
										<span className="font-medium text-sm text-muted-foreground">
											{t("customers.balance")}
										</span>
									</div>
									<p className="text-xl font-bold tabular-nums">
										{formatCurrency(balance.balance, language)}
									</p>
								</div>
								<div className="bg-card border border-border rounded-xl p-5">
									<div className="flex items-center gap-2 mb-2">
										<Moon className="h-4 w-4 text-red-500" />
										<span className="font-medium text-sm text-muted-foreground">
											{t("portal.unpaid_total")}
										</span>
									</div>
									<p className="text-xl font-bold tabular-nums">
										{formatCurrency(balance.unpaid_total, language)}
									</p>
								</div>
								<div className="bg-card border border-primary/20 rounded-xl p-5 bg-primary/5">
									<div className="flex items-center gap-2 mb-2">
										<Sun className="h-4 w-4 text-primary" />
										<span className="font-medium text-sm text-muted-foreground">
											{t("portal.net_balance")}
										</span>
									</div>
									<p className="text-xl font-bold tabular-nums text-primary">
										{formatCurrency(balance.net_balance, language)}
									</p>
								</div>
							</div>

							{balance.unpaid_total > 0 && (
								<div className="bg-card border border-border rounded-xl p-4">
									<div
										className={`flex items-center justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""}`}
									>
										<span className="text-sm font-medium">
											{t("portal.balance_utilization")}
										</span>
										<span className="text-xs text-muted-foreground tabular-nums">
											{balance.balance > 0
												? `${Math.round((balance.unpaid_total / (balance.balance + balance.unpaid_total)) * 100)}%`
												: "0%"}
										</span>
									</div>
									<div className="h-3 bg-muted rounded-full overflow-hidden">
										<div
											className="h-full bg-primary rounded-full transition-all duration-500"
											style={{
												width: `${
													balance.balance > 0
														? Math.min(
																100,
																Math.round(
																	(balance.unpaid_total /
																		(balance.balance + balance.unpaid_total)) *
																		100,
																),
															)
														: 0
												}%`,
											}}
										/>
									</div>
								</div>
							)}
						</div>
					) : (
						<div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
							{t("common.no_data")}
						</div>
					)}
				</TabsContent>

				<TabsContent value="notifications">
					<div className="space-y-3">
						{(notifications?.unread_count ?? 0) > 0 && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => markAllReadMutation.mutate()}
								disabled={markAllReadMutation.isPending}
								className="gap-2"
							>
								<CheckCircle className="h-4 w-4" />
								{t("portal.mark_all_read")}
							</Button>
						)}

						{notificationsLoading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-primary" />
							</div>
						) : notificationsError ? (
							<div className="bg-card border border-border rounded-xl p-8 text-center text-error">
								{t("common.error")}
							</div>
						) : !notifications?.notifications?.length ? (
							<div className="bg-card border border-border rounded-xl p-8 text-center">
								<p className="text-sm text-muted-foreground">
									{t("portal.no_notifications")}
								</p>
							</div>
						) : (
							<div className="space-y-2">
								{notifications.notifications.map((n) => (
									<div
										key={n.id}
										className={`bg-card border border-border rounded-xl p-4 ${
											!n.is_read
												? "border-s-4 border-s-primary bg-primary/5"
												: ""
										}`}
									>
										<div
											className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
										>
											<div
												className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
											>
												{!n.is_read && (
													<span className="w-2 h-2 rounded-full bg-primary" />
												)}
												<span className="text-sm">{n.message}</span>
											</div>
											{!n.is_read && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => markReadMutation.mutate(n.id)}
													disabled={markReadMutation.isPending}
													className="text-primary"
												>
													{t("notifications.read")}
												</Button>
											)}
										</div>
										<div
											className={`flex items-center gap-3 mt-2 ${isRTL ? "flex-row-reverse" : ""}`}
										>
											<span className="text-xs text-muted-foreground">
												{t(`notifications.type_${n.notification_type}`)}
											</span>
											<span className="text-xs text-muted-foreground">
												{formatDate(n.created_at, language)}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
