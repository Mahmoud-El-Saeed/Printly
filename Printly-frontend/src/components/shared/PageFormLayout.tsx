import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface PageFormLayoutProps {
	title: string;
	subtitle: string;
	backHref: string;
	isLoading?: boolean;
	children: React.ReactNode;
	actions?: React.ReactNode;
}

export function PageFormLayout({
	title,
	subtitle,
	backHref,
	isLoading = false,
	children,
	actions,
}: PageFormLayoutProps) {
	const { t } = useLanguage();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Link to={backHref}>
					<Button variant="ghost" size="sm" className="gap-2">
						<ArrowLeft className="h-4 w-4" />
						{t("common.back")}
					</Button>
				</Link>
				{actions}
			</div>
			<PageHeader title={title} subtitle={subtitle} />
			<div className="border-t" />
			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			) : (
				children
			)}
		</div>
	);
}
