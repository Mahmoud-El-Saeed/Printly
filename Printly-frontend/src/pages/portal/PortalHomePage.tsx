import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PortalHomePage() {
	const { t } = useLanguage();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">{t("portal.title")}</h1>
				<p className="text-muted-foreground">{t("portal.welcome")}</p>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>{t("portal.my_tenants")}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">{t("common.no_data")}</p>
				</CardContent>
			</Card>
		</div>
	);
}
