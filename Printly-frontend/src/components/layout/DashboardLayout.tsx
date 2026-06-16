import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ROLES } from "@/lib/constants";

export default function DashboardLayout() {
	const { isAuthenticated, isLoading, role } = useAuth();
	const { t } = useLanguage();
	const location = useLocation();

	useEffect(() => {
		const titles: Record<string, string> = {
			"/": t("dashboard.title"),
			"/orders": t("orders.title"),
			"/books": t("books.title"),
			"/customers/walk-in": t("customers.walk_in"),
			"/customers/members": t("customers.members"),
			"/materials": t("materials.title"),
			"/invoices": t("invoices.title"),
			"/payments": t("payments.title"),
			"/expenses": t("expenses.title"),
			"/settings": t("settings.title"),
			"/notifications": t("notifications.title"),
		};

		const matched = Object.entries(titles).find(
			([path]) =>
				location.pathname === path || location.pathname.startsWith(`${path}/`),
		);

		document.title = matched ? `${matched[1]} | Printly` : "Printly";
	}, [location.pathname, t]);

	if (isLoading) {
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				role="status"
				aria-label="Loading"
			>
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<span className="sr-only">Loading...</span>
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/landing" replace />;
	}

	if (
		role !== ROLES.SHOP_OWNER &&
		role !== ROLES.STAFF &&
		role !== ROLES.ADMIN
	) {
		return <Navigate to="/landing" replace />;
	}

	return (
		<div className="min-h-screen flex">
			<Sidebar />
			<div className="flex-1 flex flex-col min-h-screen">
				<TopBar />
				<main className="flex-1 p-6">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
