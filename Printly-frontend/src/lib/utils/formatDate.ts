import { formatDistanceToNow, isValid } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { Language } from "@/lib/i18n";

function toWesternDigits(str: string): string {
	return str.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function formatDate(
	date: string | Date,
	language: Language = "ar",
): string {
	const d = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(d.getTime())) return "—";
	const locale = language === "ar" ? "ar-EG-u-nu-latn" : "en-US";
	return toWesternDigits(
		new Intl.DateTimeFormat(locale, {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		}).format(d),
	);
}

export function formatDateTime(
	date: string | Date,
	language: Language = "ar",
): string {
	const d = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(d.getTime())) return "—";
	const locale = language === "ar" ? "ar-EG-u-nu-latn" : "en-US";
	return toWesternDigits(
		new Intl.DateTimeFormat(locale, {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		}).format(d),
	);
}

export function formatRelative(
	date: string | Date,
	language: Language = "ar",
): string {
	const d = typeof date === "string" ? new Date(date) : date;
	if (!isValid(d)) return "—";
	const result = formatDistanceToNow(d, {
		addSuffix: true,
		locale: language === "ar" ? ar : enUS,
	});
	return toWesternDigits(result);
}