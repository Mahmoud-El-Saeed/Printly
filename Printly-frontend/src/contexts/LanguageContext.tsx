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
        const stored = localStorage.getItem(
            LANGUAGE_STORAGE_KEY,
        ) as Language | null;
        if (stored && (stored === "ar" || stored === "en")) return stored;
        const browserLang = navigator.language;
        return browserLang.startsWith("ar") ? "ar" : "en";
    });

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }, []);

    useEffect(() => {
        const dir = language === "ar" ? "rtl" : "ltr";
        document.documentElement.setAttribute("dir", dir);
        document.documentElement.setAttribute("lang", language);
    }, [language]);

    const translations = getTranslation(language);

    const t = useCallback(
        (key: string): string => {
            const keys = key.split(".");
            let result: unknown = translations;

            for (const k of keys) {
                if (
                    result &&
                    typeof result === "object" &&
                    k in (result as Record<string, unknown>)
                ) {
                    result = (result as Record<string, unknown>)[k];
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