import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { Language } from "@/lib/i18n";
import { getTranslation } from "@/lib/i18n";

interface LanguageContextType {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: string) => string;
	dir: "rtl" | "ltr";
	isRTL: boolean;
}

const LANGUAGE_STORAGE_KEY = "printly_language";

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
	const [language, setLanguageState] = useState<Language>(() => {
		// Check localStorage first, then browser language
		const stored = localStorage.getItem(
			LANGUAGE_STORAGE_KEY,
		) as Language | null;
		if (stored && (stored === "ar" || stored === "en")) return stored;
		// Default to Arabic if browser language is Arabic, otherwise English
		const browserLang = navigator.language;
		return browserLang.startsWith("ar") ? "ar" : "en";
	});

	const setLanguage = useCallback((lang: Language) => {
		setLanguageState(lang);
		localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
	}, []);

	// Apply direction and lang attribute to document
	useEffect(() => {
		const dir = language === "ar" ? "rtl" : "ltr";
		document.documentElement.setAttribute("dir", dir);
		document.documentElement.setAttribute("lang", language);
	}, [language]);

	const translations = getTranslation(language);

	// Translation helper — supports dot notation like "auth.login"
	const t = useCallback(
		(key: string): string => {
			const keys = key.split(".");
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let result: Record<string, unknown> = translations as unknown as Record<
				string,
				unknown
			>;
			for (const k of keys) {
				if (result && typeof result === "object" && k in result) {
					result = result[k];
				} else {
					return key;
				}
			}
			return typeof result === "string" ? result : key;
		},
		[translations],
	);

	const dir = language === "ar" ? "rtl" : "ltr";
	const isRTL = language === "ar";

	return (
		<LanguageContext.Provider value={{ language, setLanguage, t, dir, isRTL }}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage(): LanguageContextType {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return context;
}

export { LANGUAGE_STORAGE_KEY };
