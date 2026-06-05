export function formatCurrency(amount: number | string): string {
	const num = typeof amount === "string" ? parseFloat(amount) : amount;
	return new Intl.NumberFormat("ar-EG", {
		style: "currency",
		currency: "EGP",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);
}

export function formatNumber(num: number): string {
	return new Intl.NumberFormat("ar-EG").format(num);
}

export function formatPercentage(value: number): string {
	return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
