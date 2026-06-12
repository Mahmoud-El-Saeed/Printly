import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeft,
	CheckCircle,
	Clock,
	DollarSign,
	Package,
	Plus,
	Sun,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PortalBalanceTab } from "@/components/portal/PortalBalanceTab";
import { PortalBooksTab } from "@/components/portal/PortalBooksTab";
import { PortalNotificationsTab } from "@/components/portal/PortalNotificationsTab";
import { PortalOrdersTab } from "@/components/portal/PortalOrdersTab";
import { PortalPaymentDialog } from "@/components/portal/PortalPaymentDialog";
import { PortalPricingDialog } from "@/components/portal/PortalPricingDialog";
import { UploadBookDialog } from "@/components/portal/UploadBookDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export default function ShopPortalPage() {
	const { tenantId } = useParams<{ tenantId: string }>();
	const { t, language, isRTL } = useLanguage();
	const navigate = useNavigate();
	const tid = tenantId ?? "";
	const [uploadBookOpen, setUploadBookOpen] = useState(false);
	const [pricingOpen, setPricingOpen] = useState(false);
	const [paymentOpen, setPaymentOpen] = useState(false);
	const [paymentOrder, setPaymentOrder] = useState<{
		id: string;
		number: string;
		total: number;
		paid: number;
		remaining: number;
	} | null>(null);

	const { data: tenants } = useQuery({
		queryKey: ["portal-tenants"],
		queryFn: portalApi.getTenants,
	});

	const currentTenant = tenants?.tenants?.find((t) => t.tenant_id === tid);

	const { data: orders, isLoading: ordersLoading } = useQuery({
		queryKey: ["portal-orders", tid, "all"],
		queryFn: () => portalApi.getOrders(tid),
		enabled: !!tid,
	});

	const totalOrders = orders?.orders?.length ?? 0;
	const totalSpent =
		orders?.orders?.reduce((sum, o) => sum + o.total_amount, 0) ?? 0;

	const { data: balance, isLoading: balanceLoading } = useQuery({
		queryKey: ["portal-balance", tid],
		queryFn: () => portalApi.getBalance(tid),
		enabled: !!tid,
	});

	const openPaymentDialog = (order: {
		id: string;
		order_number: string;
		total_amount: number;
		paid_amount: number;
	}) => {
		setPaymentOrder({
			id: order.id,
			number: order.order_number,
			total: order.total_amount,
			paid: order.paid_amount,
			remaining: order.total_amount - order.paid_amount,
		});
		setPaymentOpen(true);
	};

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
				className={`flex items-center justify-between gap-3 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}
			>
				<div
					className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
				>
					<h1 className="text-xl font-bold">
						{currentTenant?.tenant_name || t("portal.my_orders")}
					</h1>
					{currentTenant?.is_approved ? (
						<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
							<CheckCircle className="h-3 w-3" />
							{t("portal.link_approved")}
						</span>
					) : (
						<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
							<Clock className="h-3 w-3" />
							{t("portal.link_pending")}
						</span>
					)}
				</div>
				<div
					className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
				>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPricingOpen(true)}
						className="gap-2"
					>
						<DollarSign className="h-4 w-4" />
						{t("portal.view_pricing")}
					</Button>
					<Button
						size="sm"
						onClick={() => navigate(`/portal/${tid}/orders/new`)}
						className="gap-2"
					>
						<Plus className="h-4 w-4" />
						{t("portal.new_order")}
					</Button>
				</div>
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
					<PortalOrdersTab tenantId={tid} onPayOrder={openPaymentDialog} />
				</TabsContent>

				<TabsContent value="books">
					<PortalBooksTab
						tenantId={tid}
						onUploadBook={() => setUploadBookOpen(true)}
					/>
				</TabsContent>

				<TabsContent value="balance">
					<PortalBalanceTab tenantId={tid} />
				</TabsContent>

				<TabsContent value="notifications">
					<PortalNotificationsTab tenantId={tid} />
				</TabsContent>
			</Tabs>

			<UploadBookDialog
				tenantId={tid}
				open={uploadBookOpen}
				onOpenChange={setUploadBookOpen}
			/>
			<PortalPricingDialog
				tenantId={tid}
				open={pricingOpen}
				onOpenChange={setPricingOpen}
			/>
			{paymentOrder && (
				<PortalPaymentDialog
					tenantId={tid}
					orderId={paymentOrder.id}
					orderNumber={paymentOrder.number}
					totalAmount={paymentOrder.total}
					paidAmount={paymentOrder.paid}
					remainingAmount={paymentOrder.remaining}
					open={paymentOpen}
					onOpenChange={setPaymentOpen}
				/>
			)}
		</div>
	);
}
