import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatCurrency } from "@/lib/utils/formatCurrency";

interface PortalPricingDialogProps {
	tenantId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const COMPONENT_TYPE_LABELS: Record<string, string> = {
	PAGE_PRINT: "pricing_component.page_print",
	COVER: "pricing_component.cover",
	BINDING: "pricing_component.binding",
	LAMINATION: "pricing_component.lamination",
	EXTRA_SERVICE: "pricing_component.extra_service",
};

const UNIT_TYPE_LABELS: Record<string, string> = {
	PER_PAGE: "pricing_unit.per_page",
	PER_UNIT: "pricing_unit.per_unit",
};

export function PortalPricingDialog({
	tenantId,
	open,
	onOpenChange,
}: PortalPricingDialogProps) {
	const { t, language } = useLanguage();

	const { data: pricing, isLoading } = useQuery({
		queryKey: ["portal-pricing", tenantId],
		queryFn: () => portalApi.getPricing(tenantId),
		enabled: open && !!tenantId,
	});

	const groupedRules = pricing?.rules.reduce(
		(acc, rule) => {
			const type = rule.component_type;
			if (!acc[type]) acc[type] = [];
			acc[type].push(rule);
			return acc;
		},
		{} as Record<string, typeof pricing.rules>,
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("portal.pricing_info")}</DialogTitle>
				</DialogHeader>
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-primary" />
					</div>
				) : !pricing?.rules.length ? (
					<div className="text-center text-sm text-muted-foreground py-8">
						{t("common.no_data")}
					</div>
				) : (
					<div className="space-y-4">
						{groupedRules &&
							Object.entries(groupedRules).map(([type, rules]) => (
								<div key={type}>
									<h3 className="font-bold text-sm mb-2">
										{t(COMPONENT_TYPE_LABELS[type] || type)}
									</h3>
									<div className="border border-border rounded-xl overflow-hidden">
										<table className="w-full text-start border-collapse">
											<thead>
												<tr className="text-muted-foreground bg-muted/30">
													<th className="px-3 py-2 font-medium text-xs border-b border-border">
														{t("pricing.component_name")}
													</th>
													<th className="px-3 py-2 font-medium text-xs border-b border-border">
														{t("pricing.price")}
													</th>
													<th className="px-3 py-2 font-medium text-xs border-b border-border">
														{t("pricing.unit_type")}
													</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-border">
												{rules.map((rule) => (
													<tr
														key={`${rule.component_type}-${rule.component_name}`}
													>
														<td className="px-3 py-2 text-sm font-medium">
															{rule.component_name}
														</td>
														<td className="px-3 py-2 text-sm tabular-nums">
															{formatCurrency(rule.price, language)}
														</td>
														<td className="px-3 py-2 text-sm">
															{t(
																UNIT_TYPE_LABELS[rule.unit_type] ||
																	rule.unit_type,
															)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							))}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
