import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageSwitcher({ className }: { className?: string }) {
	const { language, setLanguage } = useLanguage();

	const toggle = () => {
		setLanguage(language === "ar" ? "en" : "ar");
	};

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={toggle}
			className={`gap-2 text-sm font-medium ${className || ""}`}
		>
			<Languages className="h-4 w-4" />
			{language === "ar" ? "English" : "عربي"}
		</Button>
	);
}
