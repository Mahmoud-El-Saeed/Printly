import { useQuery } from "@tanstack/react-query";
import { Loader2, Moon, Sun, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatCurrency } from "@/lib/utils/formatCurrency";

interface PortalBalanceTabProps {
	tenantId: string;
}

export function PortalBalanceTab({ tenantId }: PortalBalanceTabProps) {
	const { t, language, isRTL } = useLanguage();

	const {
		data: balance,
		isLoading: balanceLoading,
		isError: balanceError,
	} = useQuery({
		queryKey: ["portal-balance", tenantId],
		queryFn: () => portalApi.getBalance(tenantId),
		enabled: !!tenantId,
	});

	return (
		<>
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
		</>
	);
}
