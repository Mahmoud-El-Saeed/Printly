import {
	ChevronDown,
	Loader2,
	LogOut,
	Moon,
	Printer,
	Sun,
	User,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
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
		return <Navigate to="/landing" replace />;
	}

	if (role !== ROLES.CUSTOMER) {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
}

function PortalLayout() {
	const { logout, user } = useAuth();
	const { t, isRTL } = useLanguage();
	const navigate = useNavigate();

	const [darkMode, setDarkMode] = useState(() => {
		return localStorage.getItem("printly-dark-mode") === "true";
	});

	useEffect(() => {
		document.documentElement.classList.toggle("dark", darkMode);
	}, [darkMode]);

	const handleDarkModeChange = (val: boolean) => {
		setDarkMode(val);
		localStorage.setItem("printly-dark-mode", String(val));
		document.documentElement.classList.toggle("dark", val);
	};

	const userInitial = user?.user_id
		? user.user_id.charAt(0).toUpperCase()
		: "C";

	return (
		<PortalProtectedRoute>
			<div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
				<header className="sticky top-0 z-50 border-b border-border backdrop-blur-md bg-background/80">
					<div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
						<div
							className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
						>
							<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
								<Printer className="h-4 w-4" />
							</div>
							<span className="font-bold text-lg text-primary">
								{t("app.name")}
							</span>
							<span className="text-sm text-muted-foreground font-medium hidden md:inline">
								{t("portal.title")}
							</span>
						</div>
						<div className="flex items-center gap-3">
							<LanguageSwitcher />
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type="button"
										className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
									>
										<div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
											{userInitial}
										</div>
										<ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56">
									<DropdownMenuLabel>
										<div className="flex flex-col gap-1">
											<span className="font-medium text-sm">
												{t("portal.profile_title")}
											</span>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => navigate("/portal/profile")}
										className="gap-2 cursor-pointer"
									>
										<User className="h-4 w-4" />
										{t("portal.edit_profile")}
									</DropdownMenuItem>
									<DropdownMenuItem className="gap-2 cursor-pointer">
										<div
											className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
										>
											{darkMode ? (
												<Moon className="h-4 w-4 text-muted-foreground" />
											) : (
												<Sun className="h-4 w-4 text-muted-foreground" />
											)}
											<span className="text-sm">{t("settings.dark_mode")}</span>
											<Switch
												checked={darkMode}
												onCheckedChange={handleDarkModeChange}
											/>
										</div>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={logout}
										className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
									>
										<LogOut className="h-4 w-4" />
										{t("auth.logout")}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							<button
								type="button"
								onClick={logout}
								className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
							>
								<LogOut className="h-5 w-5 text-muted-foreground" />
							</button>
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
