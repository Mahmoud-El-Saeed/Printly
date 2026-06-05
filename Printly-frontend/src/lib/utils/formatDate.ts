import { format, formatDistanceToNow, isValid } from "date-fns";
import { ar } from "date-fns/locale";

export function formatDate(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	if (!isValid(d)) return "—";
	return format(d, "dd/MM/yyyy", { locale: ar });
}

export function formatDateTime(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	if (!isValid(d)) return "—";
	return format(d, "dd/MM/yyyy hh:mm a", { locale: ar });
}

export function formatRelative(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	if (!isValid(d)) return "—";
	return formatDistanceToNow(d, { addSuffix: true, locale: ar });
}
