import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { portalApi } from "@/lib/api/portal";
import { formatDate } from "@/lib/utils/formatDate";

interface PortalNotificationsTabProps {
	tenantId: string;
}

export function PortalNotificationsTab({
	tenantId,
}: PortalNotificationsTabProps) {
	const { t, language, isRTL } = useLanguage();
	const queryClient = useQueryClient();

	const {
		data: notifications,
		isLoading: notificationsLoading,
		isError: notificationsError,
	} = useQuery({
		queryKey: ["portal-notifications", tenantId],
		queryFn: () => portalApi.getNotifications(tenantId),
		enabled: !!tenantId,
	});

	const markReadMutation = useMutation({
		mutationFn: (notificationId: string) =>
			portalApi.markNotificationRead(tenantId, notificationId),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["portal-notifications", tenantId],
			}),
		onError: () => toast.error(t("common.error")),
	});

	const markAllReadMutation = useMutation({
		mutationFn: () => portalApi.markAllNotificationsRead(tenantId),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["portal-notifications", tenantId],
			}),
		onError: () => toast.error(t("common.error")),
	});

	return (
		<div className="space-y-3">
			{(notifications?.unread_count ?? 0) > 0 && (
				<Button
					variant="outline"
					size="sm"
					onClick={() => markAllReadMutation.mutate()}
					disabled={markAllReadMutation.isPending}
					className="gap-2"
				>
					<CheckCircle className="h-4 w-4" />
					{t("portal.mark_all_read")}
				</Button>
			)}

			{notificationsLoading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-primary" />
				</div>
			) : notificationsError ? (
				<div className="bg-card border border-border rounded-xl p-8 text-center text-error">
					{t("common.error")}
				</div>
			) : !notifications?.notifications?.length ? (
				<div className="bg-card border border-border rounded-xl p-8 text-center">
					<p className="text-sm text-muted-foreground">
						{t("portal.no_notifications")}
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{notifications.notifications.map((n) => (
						<div
							key={n.id}
							className={`bg-card border border-border rounded-xl p-4 ${
								!n.is_read ? "border-s-4 border-s-primary bg-primary/5" : ""
							}`}
						>
							<div
								className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
							>
								<div
									className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
								>
									{!n.is_read && (
										<span className="w-2 h-2 rounded-full bg-primary" />
									)}
									<span className="text-sm">{n.message}</span>
								</div>
								{!n.is_read && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => markReadMutation.mutate(n.id)}
										disabled={markReadMutation.isPending}
										className="text-primary"
									>
										{t("notifications.read")}
									</Button>
								)}
							</div>
							<div
								className={`flex items-center gap-3 mt-2 ${isRTL ? "flex-row-reverse" : ""}`}
							>
								<span className="text-xs text-muted-foreground">
									{t(`notifications.type_${n.notification_type}`)}
								</span>
								<span className="text-xs text-muted-foreground">
									{formatDate(n.created_at, language)}
								</span>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
