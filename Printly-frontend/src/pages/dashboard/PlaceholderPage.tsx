import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const placeholderPages: Record<string, { key: string; phase: string }> = {
	"/orders": { key: "nav.orders", phase: "Phase 5" },
	"/books": { key: "nav.books", phase: "Phase 6" },
	"/customers/walk-in": { key: "nav.walk_in", phase: "Phase 7" },
	"/customers/members": { key: "nav.members", phase: "Phase 7" },
	"/customers/link-requests": { key: "nav.link_requests", phase: "Phase 7" },
	"/materials": { key: "nav.materials", phase: "Phase 8" },
	"/pricing": { key: "nav.pricing", phase: "Phase 9" },
	"/payments": { key: "nav.payments", phase: "Phase 10" },
	"/expenses": { key: "nav.expenses", phase: "Phase 11" },
	"/notifications": { key: "nav.notifications", phase: "Phase 12" },
	"/settings": { key: "nav.settings", phase: "—" },
};

export default function PlaceholderPage() {
	const location = useLocation();
	const { t } = useLanguage();
	const page = placeholderPages[location.pathname] || {
		key: "common.coming_soon",
		phase: "—",
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">{t(page.key)}</h1>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>
						{t(page.key)} — {page.phase}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">
						{t("common.page_under_development")}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
