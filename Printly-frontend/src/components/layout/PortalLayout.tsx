import { Loader2, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ROLES } from "@/lib/constants";

function PortalProtectedRoute({ children }: { children: ReactNode }) {
	const { isAuthenticated, isLoading, role } = useAuth();

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
		return <Navigate to="/login" replace />;
	}

	if (role !== ROLES.CUSTOMER) {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
}

function PortalLayout() {
	const { logout } = useAuth();
	const { t } = useLanguage();

	return (
		<PortalProtectedRoute>
			<div className="min-h-screen bg-gradient-to-br from-background to-muted">
				<header className="border-b bg-background">
					<div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
						<h1 className="text-lg font-bold text-primary">
							{t("portal.title")}
						</h1>
						<div className="flex items-center gap-2">
							<LanguageSwitcher />
							<Button
								variant="ghost"
								size="sm"
								onClick={logout}
								className="gap-2"
							>
								<LogOut className="h-4 w-4" />
								{t("auth.logout")}
							</Button>
						</div>
					</div>
				</header>
				<main className="max-w-6xl mx-auto p-6">
					<Outlet />
				</main>
			</div>
		</PortalProtectedRoute>
	);
}

export default PortalLayout;
