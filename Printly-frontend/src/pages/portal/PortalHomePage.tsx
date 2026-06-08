import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, Loader2, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export default function PortalHomePage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();

	const { data: profile } = useQuery({
		queryKey: ["portal-profile"],
		queryFn: portalApi.getProfile,
	});

	const { data: tenants, isLoading: tenantsLoading } = useQuery({
		queryKey: ["portal-tenants"],
		queryFn: portalApi.getTenants,
	});

	const totalBalance =
		tenants?.tenants?.reduce((sum, tenant) => sum + tenant.balance, 0) ?? 0;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">
					{t("portal.welcome")}, {profile?.full_name || ""}
				</h1>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="bg-background border border-border rounded-xl p-5">
					<div className="flex items-center justify-between">
						<span className="font-medium text-sm text-on-surface-variant">
							{t("portal.linked_shops")}
						</span>
						<Store className="h-4 w-4" />
					</div>
					<div className="mt-2">
						<span className="font-semibold text-xl tabular-nums text-on-surface">
							{tenantsLoading ? "—" : (tenants?.total ?? 0)}
						</span>
					</div>
				</div>

				<div className="bg-background border border-border rounded-xl p-5">
					<div className="flex items-center justify-between">
						<span className="font-medium text-sm text-on-surface-variant">
							{t("portal.total_balance")}
						</span>
						<Store className="h-4 w-4" />
					</div>
					<div className="mt-2">
						<span className="font-semibold text-xl tabular-nums text-on-surface">
							{tenantsLoading ? "—" : formatCurrency(totalBalance, language)}
						</span>
					</div>
				</div>
			</div>

			{tenantsLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : tenants?.tenants?.length === 0 ? (
				<div className="bg-background border border-border rounded-xl p-12 text-center">
					<Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<p className="text-muted-foreground">{t("portal.no_shops")}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{tenants?.tenants?.map((tenant) => (
						<button
							key={tenant.tenant_id}
							type="button"
							onClick={() => navigate(`/portal/${tenant.tenant_id}`)}
							className="bg-background border border-border rounded-xl p-5 text-start hover:bg-muted/30 transition-colors"
						>
							<div className="flex items-start justify-between mb-3">
								<div>
									<h3 className="font-bold text-sm">{tenant.tenant_name}</h3>
									{tenant.display_name && (
										<p className="text-xs text-muted-foreground">
											{tenant.display_name}
										</p>
									)}
								</div>
								{tenant.is_approved ? (
									<CheckCircle className="h-4 w-4 text-green-500" />
								) : (
									<Clock className="h-4 w-4 text-yellow-500" />
								)}
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">
									{t("customers.balance")}
								</span>
								<span className="text-sm font-semibold tabular-nums">
									{formatCurrency(tenant.balance, language)}
								</span>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
