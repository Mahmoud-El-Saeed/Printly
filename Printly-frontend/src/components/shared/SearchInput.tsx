import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

interface SearchInputProps {
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	className?: string;
}
export function SearchInput({
	value,
	onChange,
	placeholder,
	className,
}: SearchInputProps) {
	return (
		<div className={cn("relative", className)}>
			<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<Input
				type="text"
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				className="pl-10 pr-4"
			/>
		</div>
	);
}
