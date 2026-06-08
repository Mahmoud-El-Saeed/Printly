import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Mail } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { FilterBar } from "@/components/shared/FilterBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { notificationsApi } from "@/lib/api/notifications";
import { formatDate } from "@/lib/utils/formatDate";
import type { NotificationResponse } from "@/types/notification";

export default function NotificationsPage() {
	const { t, language } = useLanguage();
	const [typeFilter, setTypeFilter] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 10;
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ["notifications", typeFilter, page],
		queryFn: () =>
			notificationsApi.list({
				notification_type: (typeFilter || undefined) as
					| "order"
					| "payment"
					| "system"
					| "alert"
					| undefined,
				offset: (page - 1) * pageSize,
				limit: pageSize,
				order_by: "created_at",
				order_dir: "desc",
			}),
	});

	const markReadMutation = useMutation({
		mutationFn: (notificationId: string) =>
			notificationsApi.markAsRead(notificationId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
		onError: () => {
			toast.error(t("common.action_failed"));
		},
	});

	const markAllReadMutation = useMutation({
		mutationFn: () => notificationsApi.markAllAsRead(),
		onSuccess: () => {
			toast.success(t("notifications.marked_all_read"));
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const onMarkAllRead = useCallback(() => {
		markAllReadMutation.mutate();
	}, [markAllReadMutation]);

	const columns = [
		{
			key: "title",
			header: t("notifications.title"),
			render: (row: NotificationResponse) => (
				<div className="flex items-center gap-2">
					{!row.is_read && (
						<span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
					)}
					<span
						className={
							row.is_read
								? "text-on-surface-variant"
								: "font-semibold text-on-surface"
						}
					>
						{row.title}
					</span>
				</div>
			),
		},
		{
			key: "message",
			header: t("notifications.message"),
			render: (row: NotificationResponse) => (
				<span className="line-clamp-1 max-w-[300px] text-on-surface-variant">
					{row.message}
				</span>
			),
		},
		{
			key: "notification_type",
			header: t("notifications.type"),
			render: (row: NotificationResponse) => (
				<span className="text-on-surface-variant">
					{t(`notifications.type_${row.notification_type}`)}
				</span>
			),
		},
		{
			key: "is_read",
			header: t("notifications.status"),
			render: (row: NotificationResponse) => (
				<span
					className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
						row.is_read
							? "bg-green-100 text-green-800"
							: "bg-blue-100 text-blue-800"
					}`}
				>
					{row.is_read ? t("notifications.read") : t("notifications.unread")}
				</span>
			),
		},
		{
			key: "created_at",
			header: t("notifications.created"),
			render: (row: NotificationResponse) => (
				<span className="text-on-surface-variant text-xs">
					{formatDate(row.created_at, language)}
				</span>
			),
		},
		{
			key: "actions",
			header: t("notifications.actions"),
			render: (row: NotificationResponse) => (
				<div className="flex justify-end gap-1">
					<button
						type="button"
						aria-label="Mark as read"
						className="p-1.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors disabled:opacity-50"
						disabled={row.is_read || markReadMutation.isPending}
						onClick={(e) => {
							e.stopPropagation();
							markReadMutation.mutate(row.id);
						}}
					>
						<Check className="h-4 w-4" />
					</button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-end justify-between">
				<PageHeader
					title={t("notifications.title")}
					subtitle={t("notifications.subtitle")}
				/>
				<Button
					variant="outline"
					className="gap-2"
					onClick={onMarkAllRead}
					disabled={markAllReadMutation.isPending}
				>
					<CheckCheck className="h-4 w-4" />
					{t("notifications.mark_all_read")}
				</Button>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<StatsCard
					icon={Bell}
					label={t("notifications.total")}
					value={String(data?.total_count ?? 0)}
				/>
				<StatsCard
					icon={Mail}
					label={t("notifications.unread")}
					value={String(data?.unread_count ?? 0)}
					changeColor="text-error"
				/>
			</div>

			<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-wrap items-center gap-4">
				<FilterBar
					filters={[
						{
							key: "type",
							placeholder: t("notifications.all_types"),
							options: [
								{
									value: "order",
									label: t("notifications.type_order"),
								},
								{
									value: "payment",
									label: t("notifications.type_payment"),
								},
								{
									value: "system",
									label: t("notifications.type_system"),
								},
								{
									value: "alert",
									label: t("notifications.type_alert"),
								},
							],
							value: typeFilter,
							onChange: setTypeFilter,
						},
					]}
				/>
			</div>

			<DataTable
				columns={columns}
				data={data?.notifications ?? []}
				total={data?.total_count ?? 0}
				page={page}
				pageSize={pageSize}
				onPageChange={setPage}
				rowKey={(row) => row.id}
				emptyMessage={
					isLoading ? t("common.loading") : t("notifications.no_data")
				}
			/>
		</div>
	);
}
