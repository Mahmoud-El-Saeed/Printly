import { AlertTriangle, Globe, Palette, Store } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
// import { tenantApi } from "@/lib/api"; // TODO: Uncomment when /tenants/me endpoint is ready

export default function SettingsPage() {
	const { t, language, setLanguage, isRTL } = useLanguage();
	const { user } = useAuth();

	const [darkMode, setDarkMode] = useState(() => {
		return localStorage.getItem("printly-dark-mode") === "true";
	});

	const handleDarkModeChange = (val: boolean) => {
		setDarkMode(val);
		localStorage.setItem("printly-dark-mode", String(val));
		document.documentElement.classList.toggle("dark", val);
	};

	const [shopName, setShopName] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");

	// NOTE: Shop profile requires backend endpoint. Fields are display-only until /tenants/me is available.

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("settings.title")}
				subtitle={t("settings.subtitle")}
			/>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
				<div className="flex items-center gap-2 mb-4">
					<Store className="h-5 w-5 text-primary" />
					<h3 className="font-semibold text-lg">
						{t("settings.shop_profile")}
					</h3>
				</div>
				<p className="text-sm text-muted-foreground mb-4">
					{t("settings.shop_settings_soon")}
				</p>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>{t("settings.shop_name")}</Label>
						<Input
							value={shopName}
							onChange={(e) => setShopName(e.target.value)}
							placeholder={language === "ar" ? "مطبعة النور" : "My Print Shop"}
							disabled
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("settings.phone")}</Label>
						<Input
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="+20 xxx xxx xxxx"
							disabled
						/>
					</div>
					<div className="space-y-2 md:col-span-2">
						<Label>{t("settings.address")}</Label>
						<Input
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							placeholder={language === "ar" ? "القاهرة، مصر" : "Cairo, Egypt"}
							disabled
						/>
					</div>
				</div>
				{user && (
					<p className="text-xs text-muted-foreground mt-3">
						{t(`role.${user.role}`)} — ID: {user.user_id}
					</p>
				)}
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
				<div className="flex items-center gap-2 mb-4">
					<Globe className="h-5 w-5 text-primary" />
					<h3 className="font-semibold text-lg">
						{t("settings.language_region")}
					</h3>
				</div>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label>{t("settings.language")}</Label>
						<div className="flex gap-2">
							<Button
								variant={language === "ar" ? "default" : "outline"}
								onClick={() => setLanguage("ar")}
							>
								العربية
							</Button>
							<Button
								variant={language === "en" ? "default" : "outline"}
								onClick={() => setLanguage("en")}
							>
								English
							</Button>
						</div>
					</div>
					<p className="text-sm text-muted-foreground">
						{isRTL ? t("settings.rtl_enabled") : t("settings.ltr_enabled")}
					</p>
				</div>
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
				<div className="flex items-center gap-2 mb-4">
					<Palette className="h-5 w-5 text-primary" />
					<h3 className="font-semibold text-lg">{t("settings.appearance")}</h3>
				</div>
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<Label>{t("settings.dark_mode")}</Label>
						<p className="text-sm text-muted-foreground">
							{t("settings.dark_mode_desc")}
						</p>
					</div>
					<Switch checked={darkMode} onCheckedChange={handleDarkModeChange} />
				</div>
			</div>

			<div className="bg-surface-container-lowest border border-error rounded-xl p-6">
				<div className="flex items-center gap-2 mb-4">
					<AlertTriangle className="h-5 w-5 text-error" />
					<h3 className="font-semibold text-lg text-error">
						{t("settings.danger_zone")}
					</h3>
				</div>
				<Button variant="destructive" disabled>
					{t("settings.delete_account")}
				</Button>
			</div>

			{/* TODO: wire to API */}
			{/* <div className="flex justify-end">
				<Button
					onClick={() => toast.success(t("settings.saved"))}
					className="gap-2"
				>
					<Save className="h-4 w-4" />
					{t("settings.save")}
				</Button>
			</div> */}
		</div>
	);
}
