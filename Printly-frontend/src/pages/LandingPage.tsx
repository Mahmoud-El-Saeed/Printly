import { ArrowRight, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LandingPage() {
	const { t } = useLanguage();

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="border-b border-outline-variant">
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
						<Link to="/login">
							<Button variant="outline">{t("landing.login")}</Button>
						</Link>
					</div>
				</div>
			</header>

			<main className="flex-1 flex items-center justify-center px-6">
				<div className="max-w-2xl text-center">
					<div className="flex justify-center mb-6">
						<div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
							<Printer className="h-8 w-8" />
						</div>
					</div>
					<h1 className="font-bold text-4xl tracking-tight text-on-surface mb-4">
						{t("landing.hero_title")}
					</h1>
					<p className="text-lg text-on-surface-variant mb-8 max-w-lg mx-auto">
						{t("landing.hero_subtitle")}
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link to="/login">
							<Button size="lg" className="gap-2 px-8">
								{t("landing.login")}
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
						<Link to="/register/customer">
							<Button variant="outline" size="lg" className="px-8">
								{t("landing.register_customer")}
							</Button>
						</Link>
					</div>
				</div>
			</main>

			<footer className="border-t border-outline-variant py-6">
				<div className="max-w-6xl mx-auto px-6 text-center text-sm text-on-surface-variant">
					{t("landing.footer")}
				</div>
			</footer>
		</div>
	);
}
