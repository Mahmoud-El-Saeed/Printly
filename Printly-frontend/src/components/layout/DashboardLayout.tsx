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
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils/cn";

const navItems = [
	{ to: "/", label: "لوحة التحكم", icon: LayoutDashboard },
	{ to: "/orders", label: "الطلبات", icon: ClipboardList },
	{ to: "/books", label: "الكتب", icon: BookOpen },
	{
		label: "العملاء",
		icon: Users,
		children: [
			{ to: "/customers/walk-in", label: "عملاء واجهة" },
			{ to: "/customers/members", label: "الأعضاء" },
			{ to: "/customers/link-requests", label: "طلبات الربط" },
		],
	},
	{ to: "/materials", label: "المواد", icon: Package },
	{ to: "/pricing", label: "التسعير", icon: DollarSign },
	{ to: "/payments", label: "المدفوعات", icon: Receipt },
	{ to: "/expenses", label: "المصروفات", icon: FileText },
	{ to: "/notifications", label: "الإشعارات", icon: Bell },
	{ to: "/settings", label: "الإعدادات", icon: Settings },
];

export default function Sidebar() {
	const [collapsed, setCollapsed] = useState(false);
	const { logout } = useAuth();
	const location = useLocation();

	const isActive = (path: string) => {
		if (path === "/") return location.pathname === "/";
		return location.pathname.startsWith(path);
	};

	return (
		<aside
			className={cn(
				"flex flex-col h-screen border-l bg-sidebar-background transition-all duration-300 sticky top-0",
				collapsed ? "w-16" : "w-64",
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b">
				{!collapsed && (
					<h1 className="text-lg font-bold text-primary">Printly</h1>
				)}
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setCollapsed(!collapsed)}
					className="shrink-0"
				>
					{collapsed ? (
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
									to={item.to!}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
										isActive(item.to!)
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
					{!collapsed && <span className="truncate">تسجيل الخروج</span>}
				</Button>
			</div>
		</aside>
	);
}
