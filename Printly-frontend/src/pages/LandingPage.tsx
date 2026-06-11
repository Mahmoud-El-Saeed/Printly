import {
	ClipboardList,
	DollarSign,
	Moon,
	PackageCheck,
	Printer,
	Settings2,
	ShoppingCart,
	Sun,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";

const features = [
	{ icon: ClipboardList, key: "orders" },
	{ icon: Users, key: "customers" },
	{ icon: PackageCheck, key: "inventory" },
	{ icon: DollarSign, key: "financials" },
	{ icon: Settings2, key: "pricing" },
	{ icon: ShoppingCart, key: "portal" },
] as const;

const steps = [
	{ num: 1, key: "step1" },
	{ num: 2, key: "step2" },
	{ num: 3, key: "step3" },
] as const;

const statKeys = ["shops", "orders", "satisfaction", "access"] as const;

export default function LandingPage() {
	const { t, isRTL } = useLanguage();

	const [darkMode, setDarkMode] = useState(() => {
		return localStorage.getItem("printly-dark-mode") === "true";
	});

	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 10);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const handleDarkModeChange = (val: boolean) => {
		setDarkMode(val);
		localStorage.setItem("printly-dark-mode", String(val));
		document.documentElement.classList.toggle("dark", val);
	};

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header
				className={`sticky top-0 z-50 border-b border-border transition-all duration-200 ${
					scrolled ? "bg-background/80 backdrop-blur-md" : "bg-background"
				}`}
			>
				<div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
							<Printer className="h-4 w-4" />
						</div>
						<span className="font-bold text-lg text-primary">
							{t("app.name")}
						</span>
					</div>
					<div className="flex items-center gap-3">
						<LanguageSwitcher />
						<div className="flex items-center gap-2">
							{darkMode ? (
								<Moon className="h-4 w-4 text-muted-foreground" />
							) : (
								<Sun className="h-4 w-4 text-muted-foreground" />
							)}
							<Switch
								checked={darkMode}
								onCheckedChange={handleDarkModeChange}
							/>
						</div>
						<Link to="/login">
							<Button variant="outline">{t("landing.login")}</Button>
						</Link>
					</div>
				</div>
			</header>

			<main className="flex-1">
				<section className="relative bg-gradient-to-br from-primary to-primary/80 py-20 md:py-28 overflow-hidden">
					<div
						className="absolute inset-0 opacity-10"
						style={{
							backgroundImage:
								"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
						}}
					/>
					<div className="absolute inset-0">
						<div
							className={`absolute top-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl ${
								isRTL ? "-left-36" : "-right-36"
							}`}
						/>
						<div
							className={`absolute bottom-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl ${
								isRTL ? "-right-48" : "-left-48"
							}`}
						/>
					</div>
					<div className="max-w-6xl mx-auto px-6 relative">
						<div className="max-w-2xl text-center mx-auto">
							<h1 className="font-bold text-4xl md:text-5xl tracking-tight text-primary-foreground mb-6">
								{t("landing.hero_title")}
							</h1>
							<p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-lg mx-auto">
								{t("landing.hero_subtitle")}
							</p>
							<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
								<Link to="/login">
									<Button
										size="lg"
										className="bg-white text-primary hover:bg-white/90 h-12 px-10 text-base"
									>
										{t("landing.login")}
									</Button>
								</Link>
								<Link to="/register/customer">
									<Button
										variant="outline"
										size="lg"
										className="bg-white text-primary hover:bg-white/90 h-12 px-10 text-base"
									>
										{t("landing.register_customer")}
									</Button>
								</Link>
								<Link to="/register/shop-owner">
									<Button
										variant="outline"
										size="lg"
										className="bg-white text-primary hover:bg-white/90 h-12 px-10 text-base"
									>
										{t("landing.register_shop")}
									</Button>
								</Link>
							</div>
						</div>
					</div>
				</section>

				<section className="py-16 md:py-20">
					<div className="max-w-6xl mx-auto px-6">
						<h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
							{t("landing.features.title")}
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{features.map(({ icon: Icon, key }) => (
								<div
									key={key}
									className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors duration-200"
								>
									<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
										<Icon className="h-5 w-5 text-primary" />
									</div>
									<h3 className="font-semibold text-foreground mb-2">
										{t(`landing.features.${key}.title`)}
									</h3>
									<p className="text-sm text-muted-foreground">
										{t(`landing.features.${key}.description`)}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="py-16 md:py-20 bg-muted">
					<div className="max-w-6xl mx-auto px-6">
						<h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
							{t("landing.how_it_works.title")}
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{steps.map(({ num, key }) => (
								<div key={key} className="text-center">
									<div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
										{num}
									</div>
									<h3 className="font-semibold text-foreground mb-2">
										{t(`landing.how_it_works.${key}.title`)}
									</h3>
									<p className="text-sm text-muted-foreground">
										{t(`landing.how_it_works.${key}.description`)}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="py-12 md:py-16 bg-secondary">
					<div className="max-w-6xl mx-auto px-6">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
							{statKeys.map((key) => (
								<div key={key}>
									<p className="text-2xl md:text-3xl font-bold text-primary tabular-nums">
										{t(`landing.stats.${key}`)}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>
			</main>

			<footer className="border-t border-border py-8">
				<div className="max-w-6xl mx-auto px-6">
					<div
						className={`flex flex-col md:flex-row items-start justify-between gap-6 mb-6 ${
							isRTL ? "md:flex-row-reverse" : ""
						}`}
					>
						<div
							className={`flex items-start gap-3 ${
								isRTL ? "flex-row-reverse" : ""
							}`}
						>
							<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground mt-1">
								<Printer className="h-4 w-4" />
							</div>
							<div>
								<span className="font-bold text-lg text-primary">
									{t("app.name")}
								</span>
								<p className="text-sm text-muted-foreground mt-1">
									{t("landing.footer.branding")}
								</p>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<Link
								to="/login"
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								{t("landing.footer.login")}
							</Link>
							<Link
								to="/register/customer"
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								{t("landing.footer.register")}
							</Link>
							<Link
								to="/register/shop-owner"
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								{t("landing.footer.shop_owner")}
							</Link>
						</div>
					</div>
					<div className="text-center text-sm text-muted-foreground">
						{t("landing.footer.copyright")}
					</div>
				</div>
			</footer>
		</div>
	);
}
