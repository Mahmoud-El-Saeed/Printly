import { format, formatDistanceToNow, isValid } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { Language } from "@/lib/i18n";

const locales = { ar, en: enUS } as const;

export function formatDate(
	date: string | Date,
	language: Language = "ar",
): string {
	const d = typeof date === "string" ? new Date(date) : date;
	if (!isValid(d)) return "—";
	return format(d, "dd/MM/yyyy", { locale: locales[language] });
}

export function formatDateTime(
	date: string | Date,
	language: Language = "ar",
): string {
	const d = typeof date === "string" ? new Date(date) : date;
	if (!isValid(d)) return "—";
	return format(d, "dd/MM/yyyy hh:mm a", { locale: locales[language] });
}

export function formatRelative(
	date: string | Date,
	language: Language = "ar",
): string {
	const d = typeof date === "string" ? new Date(date) : date;
	if (!isValid(d)) return "—";
	return formatDistanceToNow(d, { addSuffix: true, locale: locales[language] });
}
