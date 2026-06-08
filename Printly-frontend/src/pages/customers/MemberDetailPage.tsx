import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { customersApi } from "@/lib/api/customers";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";

export default function MemberDetailPage() {
	const { t, language } = useLanguage();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const queryClient = useQueryClient();

	const {
		data: member,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["member", id],
		queryFn: () => customersApi.getMember(id ?? ""),
		enabled: !!id,
	});

	const deleteMutation = useMutation({
		mutationFn: () => customersApi.deleteMember(id ?? ""),
		onSuccess: () => {
			setDeleteOpen(false);
			queryClient.invalidateQueries({ queryKey: ["members"] });
			navigate("/customers/members");
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	if (isError) {
		return (
			<div className="flex items-center justify-center py-12 text-error">
				{t("common.error")}
			</div>
		);
	}

	if (isLoading || !member) {
		return (
			<div className="flex items-center justify-center h-64 text-muted-foreground">
				{t("common.loading")}
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			<div className="flex items-center gap-4">
				<button
					type="button"
					className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
					onClick={() => navigate("/customers/members")}
				>
					<ArrowLeft className="h-5 w-5" />
				</button>
				<div>
					<h2 className="font-bold text-2xl tracking-tight text-on-surface">
						{member.name}
					</h2>
					<p className="text-sm text-on-surface-variant">
						{t("customers.member_detail_title")}
					</p>
				</div>
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
				<div className="bg-surface-container px-6 py-3 border-b border-outline-variant flex items-center justify-between">
					<h3 className="font-bold text-sm text-on-surface">
						{t("customers.member_info")}
					</h3>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							className="gap-2"
							onClick={() => navigate(`/customers/members/${id}/edit`)}
						>
							<Pencil className="h-4 w-4" />
							{t("common.edit")}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="gap-2 text-error hover:bg-error-container"
							onClick={() => setDeleteOpen(true)}
						>
							<Trash2 className="h-4 w-4" />
							{t("common.delete")}
						</Button>
					</div>
				</div>
				<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("customers.name")}
						</span>
						<span className="text-sm font-semibold text-on-surface">
							{member.name}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("customers.email")}
						</span>
						<span className="text-sm text-on-surface">
							{member.email ?? "—"}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("customers.phone")}
						</span>
						<span className="text-sm text-on-surface">
							{member.phone ?? "—"}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("customers.balance")}
						</span>
						<span className="text-sm tabular-nums text-on-surface">
							{formatCurrency(member.balance, language)}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("customers.status")}
						</span>
						<span
							className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
								member.is_approved
									? "bg-green-100 text-green-800"
									: "bg-yellow-100 text-yellow-800"
							}`}
						>
							{member.is_approved
								? t("customers.approved")
								: t("customers.pending")}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs font-medium text-on-surface-variant">
							{t("common.created")}
						</span>
						<span className="text-sm text-on-surface">
							{formatDate(member.created_at, language)}
						</span>
					</div>
				</div>
			</div>

			<ConfirmDeleteDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title={t("common.delete")}
				description={t("common.delete_confirm")}
				onConfirm={() => deleteMutation.mutate()}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
