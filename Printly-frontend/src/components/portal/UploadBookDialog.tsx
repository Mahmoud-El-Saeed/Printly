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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
	const [colorMode, setColorMode] = useState("bw");
	const [sidesPerPage, setSidesPerPage] = useState("1");
	const [copies, setCopies] = useState("1");
	const [bindingType, setBindingType] = useState("");
	const [hasLamination, setHasLamination] = useState(false);
	const [notes, setNotes] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const mutation = useMutation({
		mutationFn: async () => {
			const formData = new FormData();
			formData.append("title", title);
			if (subject) formData.append("subject", subject);
			formData.append("total_pages", totalPages);
			formData.append("color_mode", colorMode);
			formData.append("sides_per_page", String(sidesPerPage));
			formData.append("copies", String(copies));
			if (bindingType) formData.append("binding_type", bindingType);
			formData.append("has_lamination", String(hasLamination));
			if (notes) formData.append("notes", notes);
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
		setColorMode("bw");
		setSidesPerPage("1");
		setCopies("1");
		setBindingType("");
		setHasLamination(false);
		setNotes("");
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
			<DialogContent className="max-h-[90vh] overflow-y-auto">
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
					<div className="grid grid-cols-2 gap-4">
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
							<Label>{t("portal.book_color_mode")}</Label>
							<Select value={colorMode} onValueChange={setColorMode}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="bw">
										{t("portal.book_color_bw")}
									</SelectItem>
									<SelectItem value="color">
										{t("portal.book_color_color")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>{t("portal.book_sides")}</Label>
							<Select value={sidesPerPage} onValueChange={setSidesPerPage}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">{t("orders.single_side")}</SelectItem>
									<SelectItem value="2">{t("orders.double_side")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>{t("portal.book_copies")}</Label>
							<Input
								type="number"
								value={copies}
								onChange={(e) => setCopies(e.target.value)}
								min={1}
							/>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>{t("portal.book_binding")}</Label>
							<Select value={bindingType} onValueChange={setBindingType}>
								<SelectTrigger>
									<SelectValue placeholder={t("orders.none")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">{t("orders.none")}</SelectItem>
									<SelectItem value="spiral">
										{t("books.binding_spiral")}
									</SelectItem>
									<SelectItem value="glue">
										{t("books.binding_glue")}
									</SelectItem>
									<SelectItem value="staple">
										{t("books.binding_staple")}
									</SelectItem>
									<SelectItem value="hardcover">
										{t("books.binding_hardcover")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>{t("portal.book_lamination")}</Label>
							<div className="flex items-center gap-2 h-10">
								<Switch
									checked={hasLamination}
									onCheckedChange={setHasLamination}
								/>
								<span className="text-sm text-muted-foreground">
									{hasLamination ? t("orders.glossy") : t("orders.none")}
								</span>
							</div>
						</div>
					</div>
					<div className="space-y-2">
						<Label>{t("portal.book_notes")}</Label>
						<Textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder={t("orders.notes_placeholder")}
							rows={2}
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
