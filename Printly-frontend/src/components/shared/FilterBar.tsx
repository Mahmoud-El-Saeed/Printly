import { SearchInput } from "@/components/shared/SearchInput";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
	searchValue: string;
	onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	searchPlaceholder?: string;
	filters?: Array<{
		key: string;
		placeholder: string;
		options: Array<{ value: string; label: string }>;
		value: string;
		onChange: (value: string) => void;
	}>;
}

export function FilterBar({
	searchValue,
	onSearchChange,
	searchPlaceholder,
	filters,
}: FilterBarProps) {
	return (
		<div className="flex flex-wrap items-center gap-4">
			<SearchInput
				value={searchValue}
				onChange={onSearchChange}
				placeholder={searchPlaceholder}
				className="min-w-[240px]"
			/>
			{filters?.map((filter) => (
				<Select
					key={filter.key}
					value={filter.value}
					onValueChange={filter.onChange}
				>
					<SelectTrigger className="w-[160px]">
						<SelectValue placeholder={filter.placeholder} />
					</SelectTrigger>
					<SelectContent>
						{filter.options.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			))}
		</div>
	);
}
