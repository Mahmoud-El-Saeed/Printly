import { useMutation, useQuery } from "@tanstack/react-query";
import {
	CheckCircle,
	Clock,
	Loader2,
	Plus,
	Printer,
	Store,
	Wallet,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { customersApi } from "@/lib/api/customers";
import { portalApi } from "@/lib/api/portal";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

export default function PortalHomePage() {
	const { t, language, isRTL } = useLanguage();
	const navigate = useNavigate();
	const [linkDialogOpen, setLinkDialogOpen] = useState(false);
	const [slugValue, setSlugValue] = useState("");

	const { data: profile, isError: profileError } = useQuery({
		queryKey: ["portal-profile"],
		queryFn: portalApi.getProfile,
	});

	const {
		data: tenants,
		isLoading: tenantsLoading,
		isError: tenantsError,
	} = useQuery({
		queryKey: ["portal-tenants"],
		queryFn: portalApi.getTenants,
	});

	const allOrdersQueries = useQuery({
		queryKey: [
			"portal-recent-orders",
			tenants?.tenants?.map((t) => t.tenant_id),
		],
		queryFn: async () => {
			if (!tenants?.tenants?.length) return [];
			const approvedTenants = tenants.tenants.filter((t) => t.is_approved);
			const results = await Promise.all(
				approvedTenants.map(async (tenant) => {
					const orders = await portalApi.getOrders(tenant.tenant_id, {
						limit: 10,
					});
					return orders.orders.map((o) => ({
						...o,
						tenantId: tenant.tenant_id,
						tenantName: tenant.tenant_name,
					}));
				}),
			);
			return results
				.flat()
				.sort(
					(a, b) =>
						new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
				)
				.slice(0, 5);
		},
		enabled: !!tenants?.tenants?.length,
	});

	const pendingCount =
		tenants?.tenants?.filter((t) => t.is_approved).length === 0
			? 0
			: (allOrdersQueries.data?.filter(
					(o) => o.status === "new" || o.status === "printing",
				).length ?? 0);

	const linkMutation = useMutation({
		mutationFn: () => customersApi.requestLink({ slug: slugValue }),
		onSuccess: () => {
			toast.success(t("portal.link_request_sent"));
			setLinkDialogOpen(false);
			setSlugValue("");
		},
		onError: () => {
			toast.error(t("portal.link_request_failed"));
		},
	});

	if (profileError || tenantsError) {
		return (
			<div className="flex items-center justify-center py-12 text-error">
				{t("common.error")}
			</div>
		);
	}

	const totalBalance =
		tenants?.tenants
			?.filter((t) => t.is_approved)
			.reduce((sum, tenant) => sum + tenant.balance, 0) ?? 0;

	const today = new Date();
	const formattedDate = formatDate(today, language);

	return (
		<div className="space-y-6">
			<div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 md:p-8 text-primary-foreground">
				<h1 className="text-2xl md:text-3xl font-bold mb-2">
					{t("portal.welcome")}, {profile?.full_name || ""}!
				</h1>
				<p className="text-primary-foreground/80 text-sm md:text-base">
					{t("portal.welcome_subtitle")}
				</p>
				<p className="text-primary-foreground/60 text-xs mt-3 tabular-nums">
					{formattedDate}
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-card border border-border rounded-xl p-5">
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
							<Store className="h-5 w-5 text-primary" />
						</div>
						<span className="font-medium text-sm text-muted-foreground">
							{t("portal.linked_shops")}
						</span>
					</div>
					<span className="font-semibold text-2xl tabular-nums">
						{tenantsLoading ? "—" : (tenants?.total ?? 0)}
					</span>
				</div>

				<div className="bg-card border border-border rounded-xl p-5">
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
							<Wallet className="h-5 w-5 text-green-600" />
						</div>
						<span className="font-medium text-sm text-muted-foreground">
							{t("portal.total_balance")}
						</span>
					</div>
					<span className="font-semibold text-2xl tabular-nums">
						{tenantsLoading ? "—" : formatCurrency(totalBalance, language)}
					</span>
				</div>

				<div className="bg-card border border-border rounded-xl p-5">
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
							<Clock className="h-5 w-5 text-yellow-600" />
						</div>
						<span className="font-medium text-sm text-muted-foreground">
							{t("portal.pending_orders")}
						</span>
					</div>
					<span className="font-semibold text-2xl tabular-nums">
						{allOrdersQueries.isLoading ? "—" : pendingCount}
					</span>
				</div>
			</div>

			<div>
				<div
					className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}
				>
					<h2 className="text-lg font-bold">{t("portal.my_tenants")}</h2>
					<Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
						<DialogTrigger asChild>
							<Button size="sm" className="gap-2">
								<Plus className="h-4 w-4" />
								{t("portal.link_new_shop")}
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>{t("portal.link_shop_title")}</DialogTitle>
								<DialogDescription>
									{t("portal.link_shop_desc")}
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 pt-2">
								<Input
									value={slugValue}
									onChange={(e) => setSlugValue(e.target.value)}
									placeholder={t("portal.shop_slug_placeholder")}
								/>
								<Button
									onClick={() => linkMutation.mutate()}
									disabled={!slugValue.trim() || linkMutation.isPending}
									className="w-full"
								>
									{linkMutation.isPending ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										t("portal.send_request")
									)}
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>

				{tenantsLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				) : tenants?.tenants?.length === 0 ? (
					<div className="bg-card border border-border rounded-xl p-12 text-center">
						<Printer className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
						<h3 className="text-lg font-bold text-muted-foreground mb-2">
							{t("portal.no_shops")}
						</h3>
						<p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
							{t("portal.no_shops_desc")}
						</p>
						<Button onClick={() => setLinkDialogOpen(true)} className="gap-2">
							<Plus className="h-4 w-4" />
							{t("portal.link_new_shop")}
						</Button>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{tenants?.tenants?.map((tenant) => {
							const isClickable = tenant.is_approved;
							return (
								<button
									key={tenant.tenant_id}
									type="button"
									onClick={() =>
										isClickable
											? navigate(`/portal/${tenant.tenant_id}`)
											: undefined
									}
									disabled={!isClickable}
									className={`bg-card border border-border rounded-xl p-5 text-start transition-colors ${
										isClickable
											? "hover:border-primary/50"
											: "opacity-70 cursor-default"
									} ${isRTL ? "text-end" : ""}`}
								>
									<div
										className={`flex items-start justify-between mb-3 ${isRTL ? "flex-row-reverse" : ""}`}
									>
										<div>
											<h3 className="font-bold text-sm">
												{tenant.tenant_name}
											</h3>
											{tenant.display_name && (
												<p className="text-xs text-muted-foreground">
													{tenant.display_name}
												</p>
											)}
										</div>
										{tenant.is_approved ? (
											<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
												<CheckCircle className="h-3 w-3" />
												{t("portal.link_approved")}
											</span>
										) : tenant.is_approved === false &&
											tenants?.tenants?.find(
												(t) => t.tenant_id === tenant.tenant_id,
											)?.is_approved === false ? (
											<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
												<XCircle className="h-3 w-3" />
												{t("portal.link_rejected")}
											</span>
										) : (
											<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
												<Clock className="h-3 w-3" />
												{t("portal.link_pending")}
											</span>
										)}
									</div>
									{tenant.is_approved && (
										<div
											className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
										>
											<span className="text-xs text-muted-foreground">
												{t("customers.balance")}
											</span>
											<span className="text-sm font-semibold tabular-nums">
												{formatCurrency(tenant.balance, language)}
											</span>
										</div>
									)}
									{isClickable && (
										<div className="mt-3 pt-3 border-t border-border">
											<span className="text-xs text-primary font-medium hover:underline">
												{t("portal.view")} →
											</span>
										</div>
									)}
								</button>
							);
						})}
					</div>
				)}
			</div>

			{(tenants?.tenants?.filter((t) => t.is_approved).length ?? 0) > 0 && (
				<div>
					<div
						className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}
					>
						<h2 className="text-lg font-bold">{t("portal.recent_orders")}</h2>
						{allOrdersQueries.data && allOrdersQueries.data.length > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									const firstApproved = tenants?.tenants?.find(
										(t) => t.is_approved,
									);
									if (firstApproved) {
										navigate(`/portal/${firstApproved.tenant_id}`);
									}
								}}
								className="text-primary"
							>
								{t("portal.view_all")} →
							</Button>
						)}
					</div>

					{allOrdersQueries.isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-primary" />
						</div>
					) : !allOrdersQueries.data?.length ? (
						<div className="bg-card border border-border rounded-xl p-8 text-center">
							<p className="text-sm text-muted-foreground">
								{t("portal.no_orders_desc")}
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{allOrdersQueries.data.map((order) => (
								<button
									key={order.id}
									type="button"
									onClick={() =>
										navigate(`/portal/${order.tenantId}/orders/${order.id}`)
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
									<div
										className={`flex items-center justify-between mt-2 ${isRTL ? "flex-row-reverse" : ""}`}
									>
										<span className="text-xs text-muted-foreground">
											{order.tenantName}
										</span>
										<span className="text-xs text-muted-foreground">
											{formatDate(order.created_at, language)}
										</span>
									</div>
								</button>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
