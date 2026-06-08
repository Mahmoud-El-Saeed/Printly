import { Bell, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TopBar() {
	const { role } = useAuth();
	const { t } = useLanguage();
	const navigate = useNavigate();

	return (
		<header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 h-14">
			<div className="flex items-center gap-4">
				<div>
					<p className="text-sm font-medium">{t(`role.${role}`)}</p>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<LanguageSwitcher />

				<Button
					variant="ghost"
					size="icon"
					onClick={() => navigate("/notifications")}
					className="relative"
					aria-label={t("nav.notifications")}
				>
					<Bell className="h-4 w-4" />
				</Button>

				<Button variant="ghost" size="icon" aria-label={t("settings.title")}>
					<User className="h-4 w-4" />
				</Button>
			</div>
		</header>
	);
}
