import { Loader2 } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/constants";

export default function DashboardLayout() {
	const { isAuthenticated, isLoading, role } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	if (
		role !== ROLES.SHOP_OWNER &&
		role !== ROLES.STAFF &&
		role !== ROLES.ADMIN
	) {
		return <Navigate to="/login" replace />;
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
