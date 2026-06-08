import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConfirmDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	onConfirm: () => void;
	isLoading?: boolean;
}

export function ConfirmDeleteDialog({
	open,
	onOpenChange,
	title,
	description,
	onConfirm,
	isLoading = false,
}: ConfirmDeleteDialogProps) {
	const { t } = useLanguage();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						{t("common.cancel")}
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isLoading}
					>
						{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
						{isLoading ? t("common.deleting") : t("common.delete")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
