import ar from "./ar";
import en from "./en";

export type Language = "ar" | "en";

export type TranslationKeys = typeof en;

type MakeStrings<T> = {
	readonly [K in keyof T]: T[K] extends object ? MakeStrings<T[K]> : string;
};

export const translations: Record<Language, MakeStrings<TranslationKeys>> = {
	en,
	ar,
};

export function getTranslation(lang: Language): MakeStrings<TranslationKeys> {
	return translations[lang];
}

export function t(lang: Language, key: string): string {
	const keys = key.split(".");
	let result: unknown = translations[lang];
	
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
}