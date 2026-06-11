import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";

interface UploadBookDialogProps {
	tenantId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function UploadBookDialog({
	tenantId,
	open,
	onOpenChange,
}: UploadBookDialogProps) {
	const { t } = useLanguage();
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [title, setTitle] = useState("");
	const [subject, setSubject] = useState("");
	const [totalPages, setTotalPages] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const mutation = useMutation({
		mutationFn: async () => {
			const formData = new FormData();
			formData.append("title", title);
			if (subject) formData.append("subject", subject);
			formData.append("total_pages", totalPages);
			if (selectedFile) formData.append("file", selectedFile);
			return portalApi.createBook(tenantId, formData);
		},
		onSuccess: () => {
			toast.success(t("portal.upload_success"));
			queryClient.invalidateQueries({ queryKey: ["portal-books", tenantId] });
			handleReset();
			onOpenChange(false);
		},
		onError: () => toast.error(t("common.error")),
	});

	const handleReset = () => {
		setTitle("");
		setSubject("");
		setTotalPages("");
		setSelectedFile(null);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
	};

	const handleSubmit = () => {
		if (!title.trim() || !totalPages || Number(totalPages) <= 0) return;
		mutation.mutate();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("portal.upload_book")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 pt-2">
					<div className="space-y-2">
						<Label>{t("portal.book_title_field")}</Label>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t("portal.book_title_field")}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("portal.subject_field")}</Label>
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder={t("portal.subject_field")}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("portal.pages_field")}</Label>
						<Input
							type="number"
							value={totalPages}
							onChange={(e) => setTotalPages(e.target.value)}
							min={1}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("portal.file_field")}</Label>
						<button
							type="button"
							className="border border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors w-full"
							onClick={() => fileInputRef.current?.click()}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ")
									fileInputRef.current?.click();
							}}
						>
							<input
								ref={fileInputRef}
								type="file"
								accept=".pdf,.doc,.docx"
								onChange={handleFileChange}
								className="hidden"
							/>
							{selectedFile ? (
								<span className="text-sm font-medium">{selectedFile.name}</span>
							) : (
								<div className="space-y-2">
									<Upload className="h-8 w-8 mx-auto text-muted-foreground/50" />
									<span className="text-sm text-muted-foreground">
										{t("portal.select_file")}
									</span>
									<span className="text-xs text-muted-foreground/70">
										{t("portal.drag_drop")}
									</span>
								</div>
							)}
						</button>
					</div>
					<Button
						onClick={handleSubmit}
						disabled={mutation.isPending || !title.trim() || !totalPages}
						className="w-full"
					>
						{mutation.isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							t("common.create")
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
