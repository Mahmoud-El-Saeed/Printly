import { Label } from "@/components/ui/label";

interface FormFieldProps {
	label: string;
	error?: string;
	required?: boolean;
	children: React.ReactNode;
}

export function FormField({
	label,
	error,
	required = false,
	children,
}: FormFieldProps) {
	return (
		<div className="space-y-2">
			<Label>
				{label}
				{required && <span className="text-destructive">*</span>}
			</Label>
			{children}
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
}
