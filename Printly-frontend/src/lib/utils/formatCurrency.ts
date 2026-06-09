import type { Language } from "@/lib/i18n";

export function formatCurrency(
	amount: number | string,
	language: Language = "ar",
): string {
	const num = typeof amount === "string" ? parseFloat(amount) : amount;
	const locale = language === "ar" ? "ar-EG-u-nu-latn" : "en-US";
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: "EGP",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);
}

export function formatNumber(num: number, language: Language = "ar"): string {
	const locale = language === "ar" ? "ar-EG-u-nu-latn" : "en-US";
	return new Intl.NumberFormat(locale).format(num);
}

export function formatPercentage(value: number): string {
	return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}