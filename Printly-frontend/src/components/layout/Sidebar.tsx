import {
	Bell,
	BookOpen,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	DollarSign,
	FileText,
	LayoutDashboard,
	LogOut,
	Package,
	Receipt,
	Settings,
	Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils/cn";

export default function Sidebar() {
	const [collapsed, setCollapsed] = useState(false);
	const { logout } = useAuth();
	const { t, isRTL } = useLanguage();
	const location = useLocation();

	const isActive = (path: string) => {
		if (path === "/") return location.pathname === "/";
		return location.pathname.startsWith(path);
	};

	const navItems = [
		{ to: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
		{ to: "/orders", label: t("nav.orders"), icon: ClipboardList },
		{ to: "/books", label: t("nav.books"), icon: BookOpen },
		{
			label: t("nav.customers"),
			icon: Users,
			children: [
				{ to: "/customers/walk-in", label: t("nav.walk_in") },
				{ to: "/customers/members", label: t("nav.members") },
				{ to: "/customers/link-requests", label: t("nav.link_requests") },
			],
		},
		{ to: "/materials", label: t("nav.materials"), icon: Package },
		{ to: "/pricing", label: t("nav.pricing"), icon: DollarSign },
		{ to: "/payments", label: t("nav.payments"), icon: Receipt },
		{ to: "/expenses", label: t("nav.expenses"), icon: FileText },
		{ to: "/notifications", label: t("nav.notifications"), icon: Bell },
		{ to: "/settings", label: t("nav.settings"), icon: Settings },
	];

	return (
		<aside
			className={cn(
				"flex flex-col h-screen border-e bg-sidebar-background transition-all duration-300 sticky top-0",
				collapsed ? "w-16" : "w-64",
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b">
				{!collapsed && (
					<h1 className="text-lg font-bold text-primary">{t("app.name")}</h1>
				)}
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setCollapsed(!collapsed)}
					className="shrink-0"
				>
					{collapsed ? (
						isRTL ? (
							<ChevronRight className="h-4 w-4" />
						) : (
							<ChevronLeft className="h-4 w-4" />
						)
					) : isRTL ? (
						<ChevronLeft className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					)}
				</Button>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto py-2 px-2">
				<ul className="space-y-1">
					{navItems.map((item) => {
						if ("children" in item && item.children) {
							return (
								<li key={item.label}>
									{!collapsed && (
										<p className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
											<item.icon className="h-4 w-4" />
											{item.label}
										</p>
									)}
									{item.children.map((child) => (
										<NavLink
											key={child.to}
											to={child.to}
											className={cn(
												"flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
												isActive(child.to)
													? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
													: "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
											)}
										>
											<span className="truncate">{child.label}</span>
										</NavLink>
									))}
								</li>
							);
						}

						return (
							<li key={item.to}>
								<NavLink
									to={item.to}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
										isActive(item.to)
											? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
											: "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
									)}
									title={collapsed ? item.label : undefined}
								>
									<item.icon className="h-4 w-4 shrink-0" />
									{!collapsed && <span className="truncate">{item.label}</span>}
								</NavLink>
							</li>
						);
					})}
				</ul>
			</nav>

			{/* Footer */}
			<Separator />
			<div className="p-2">
				<Button
					variant="ghost"
					className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
					onClick={logout}
				>
					<LogOut className="h-4 w-4 shrink-0" />
					{!collapsed && <span className="truncate">{t("auth.logout")}</span>}
				</Button>
			</div>
		</aside>
	);
}
