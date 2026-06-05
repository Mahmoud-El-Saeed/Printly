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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let result: Record<string, unknown> = translations[lang] as unknown as Record<
		string,
		unknown
	>;
	for (const k of keys) {
		if (result && typeof result === "object" && k in result) {
			result = result[k];
		} else {
			return key; // fallback: return the key itself
		}
	}
	return typeof result === "string" ? result : key;
}
