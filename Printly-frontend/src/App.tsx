import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PortalLayout from "@/components/layout/PortalLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterCustomerPage from "@/pages/auth/RegisterCustomerPage";
import RegisterShopOwnerPage from "@/pages/auth/RegisterShopOwnerPage";

const LandingPage = lazy(() => import("@/pages/LandingPage"));

const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const EditOrderPage = lazy(() => import("@/pages/orders/EditOrderPage"));
const NewOrderPage = lazy(() => import("@/pages/orders/NewOrderPage"));
const OrderDetailPage = lazy(() => import("@/pages/orders/OrderDetailPage"));
const OrdersListPage = lazy(() => import("@/pages/orders/OrdersListPage"));
const PortalHomePage = lazy(() => import("@/pages/portal/PortalHomePage"));
const PortalOrderDetailPage = lazy(
	() => import("@/pages/portal/PortalOrderDetailPage"),
);
const ShopPortalPage = lazy(() => import("@/pages/portal/ShopPortalPage"));

const BooksListPage = lazy(() => import("@/pages/books/BooksListPage"));
const BookDetailPage = lazy(() => import("@/pages/books/BookDetailPage"));
const CreateBookPage = lazy(() => import("@/pages/books/CreateBookPage"));
const EditBookPage = lazy(() => import("@/pages/books/EditBookPage"));

const WalkInCustomersPage = lazy(
	() => import("@/pages/customers/WalkInCustomersPage"),
);
const WalkInCustomerDetailPage = lazy(
	() => import("@/pages/customers/WalkInCustomerDetailPage"),
);
const CreateWalkInCustomerPage = lazy(
	() => import("@/pages/customers/CreateWalkInCustomerPage"),
);
const EditWalkInCustomerPage = lazy(
	() => import("@/pages/customers/EditWalkInCustomerPage"),
);
const MembersPage = lazy(() => import("@/pages/customers/MembersPage"));
const MemberDetailPage = lazy(
	() => import("@/pages/customers/MemberDetailPage"),
);
const CreateMemberPage = lazy(
	() => import("@/pages/customers/CreateMemberPage"),
);
const EditMemberPage = lazy(() => import("@/pages/customers/EditMemberPage"));
const LinkRequestsPage = lazy(
	() => import("@/pages/customers/LinkRequestsPage"),
);

const ExpensesPage = lazy(() => import("@/pages/expenses/ExpensesPage"));
const ExpenseDetailPage = lazy(
	() => import("@/pages/expenses/ExpenseDetailPage"),
);
const CreateExpensePage = lazy(
	() => import("@/pages/expenses/CreateExpensePage"),
);
const EditExpensePage = lazy(() => import("@/pages/expenses/EditExpensePage"));

const MaterialsPage = lazy(() => import("@/pages/materials/MaterialsPage"));
const MaterialDetailPage = lazy(
	() => import("@/pages/materials/MaterialDetailPage"),
);
const CreateMaterialPage = lazy(
	() => import("@/pages/materials/CreateMaterialPage"),
);
const EditMaterialPage = lazy(
	() => import("@/pages/materials/EditMaterialPage"),
);

const PaymentsPage = lazy(() => import("@/pages/payments/PaymentsPage"));
const PaymentDetailPage = lazy(
	() => import("@/pages/payments/PaymentDetailPage"),
);
const CreatePaymentPage = lazy(
	() => import("@/pages/payments/CreatePaymentPage"),
);
const EditPaymentPage = lazy(() => import("@/pages/payments/EditPaymentPage"));

const PricingPage = lazy(() => import("@/pages/pricing/PricingPage"));
const PricingRuleDetailPage = lazy(
	() => import("@/pages/pricing/PricingRuleDetailPage"),
);
const CreatePricingRulePage = lazy(
	() => import("@/pages/pricing/CreatePricingRulePage"),
);
const EditPricingRulePage = lazy(
	() => import("@/pages/pricing/EditPricingRulePage"),
);

const NotificationsPage = lazy(
	() => import("@/pages/notifications/NotificationsPage"),
);
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));

function PageLoader() {
	return (
		<div
			className="flex items-center justify-center h-64"
			role="status"
			aria-label="Loading"
		>
			<Loader2 className="h-8 w-8 animate-spin text-primary" />
			<span className="sr-only">Loading...</span>
		</div>
	);
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<LanguageProvider>
					<AuthProvider>
						<ErrorBoundary>
							<Routes>
								{/* Auth Routes */}
								<Route
									path="/landing"
									element={
										<Suspense fallback={<PageLoader />}>
											<LandingPage />
										</Suspense>
									}
								/>
								<Route path="/login" element={<LoginPage />} />
								<Route
									path="/register/shop-owner"
									element={<RegisterShopOwnerPage />}
								/>
								<Route
									path="/register/customer"
									element={<RegisterCustomerPage />}
								/>

								{/* Dashboard Routes (Protected) */}
								<Route element={<DashboardLayout />}>
									<Route
										index
										element={
											<Suspense fallback={<PageLoader />}>
												<DashboardPage />
											</Suspense>
										}
									/>
									<Route
										path="orders"
										element={
											<Suspense fallback={<PageLoader />}>
												<OrdersListPage />
											</Suspense>
										}
									/>
									<Route
										path="orders/new"
										element={
											<Suspense fallback={<PageLoader />}>
												<NewOrderPage />
											</Suspense>
										}
									/>
									<Route
										path="orders/:id"
										element={
											<Suspense fallback={<PageLoader />}>
												<OrderDetailPage />
											</Suspense>
										}
									/>
									<Route
										path="orders/:id/edit"
										element={
											<Suspense fallback={<PageLoader />}>
												<EditOrderPage />
											</Suspense>
										}
									/>
									<Route
										path="books"
										element={
											<Suspense fallback={<PageLoader />}>
												<BooksListPage />
											</Suspense>
										}
									/>
									<Route
										path="books/new"
										element={
											<Suspense fallback={<PageLoader />}>
												<CreateBookPage />
											</Suspense>
										}
									/>
									<Route
										path="books/:id"
										element={
											<Suspense fallback={<PageLoader />}>
												<BookDetailPage />
											</Suspense>
										}
									/>
									<Route
										path="books/:id/edit"
										element={
											<Suspense fallback={<PageLoader />}>
												<EditBookPage />
											</Suspense>
										}
									/>
									<Route
										path="customers/walk-in"
										element={
											<Suspense fallback={<PageLoader />}>
												<WalkInCustomersPage />
											</Suspense>
										}
									/>
									<Route
										path="customers/walk-in/:id"
										element={
											<Suspense fallback={<PageLoader />}>
												<WalkInCustomerDetailPage />
											</Suspense>
										}
									/>
									<Route
										path="customers/walk-in/new"
										element={
											<Suspense fallback={<PageLoader />}>
												<CreateWalkInCustomerPage />
											</Suspense>
										}
									/>
									<Route
										path="customers/walk-in/:id/edit"
										element={
											<Suspense fallback={<PageLoader />}>
												<EditWalkInCustomerPage />
											</Suspense>
										}
									/>
									<Route
										path="customers/members"
										element={
											<Suspense fallback={<PageLoader />}>
												<MembersPage />
											</Suspense>
										}
									/>
									<Route
										path="customers/members/:id"
										element={
											<Suspense fallback={<PageLoader />}>
												<MemberDetailPage />
											</Suspense>
										}
									/>
									<Route
										path="customers/members/new"
										element={
											<Suspense fallback={<PageLoader />}>
												<CreateMemberPage />
											</Suspense>
										}
									/>
									<Route
										path="customers/members/:id/edit"
										element={
											<Suspense fallback={<PageLoader />}>
												<EditMemberPage />
											</Suspense>
										}
									/>
									<Route
										path="customers/link-requests"
										element={
											<Suspense fallback={<PageLoader />}>
												<LinkRequestsPage />
											</Suspense>
										}
									/>
									<Route
										path="materials"
										element={
											<Suspense fallback={<PageLoader />}>
												<MaterialsPage />
											</Suspense>
										}
									/>
									<Route
										path="materials/new"
										element={
											<Suspense fallback={<PageLoader />}>
												<CreateMaterialPage />
											</Suspense>
										}
									/>
									<Route
										path="materials/:id"
										element={
											<Suspense fallback={<PageLoader />}>
												<MaterialDetailPage />
											</Suspense>
										}
									/>
									<Route
										path="materials/:id/edit"
										element={
											<Suspense fallback={<PageLoader />}>
												<EditMaterialPage />
											</Suspense>
										}
									/>
									<Route
										path="pricing"
										element={
											<Suspense fallback={<PageLoader />}>
												<PricingPage />
											</Suspense>
										}
									/>
									<Route
										path="pricing/new"
										element={
											<Suspense fallback={<PageLoader />}>
												<CreatePricingRulePage />
											</Suspense>
										}
									/>
									<Route
										path="pricing/:id"
										element={
											<Suspense fallback={<PageLoader />}>
												<PricingRuleDetailPage />
											</Suspense>
										}
									/>
									<Route
										path="pricing/:id/edit"
										element={
											<Suspense fallback={<PageLoader />}>
												<EditPricingRulePage />
											</Suspense>
										}
									/>
									<Route
										path="payments"
										element={
											<Suspense fallback={<PageLoader />}>
												<PaymentsPage />
											</Suspense>
										}
									/>
									<Route
										path="payments/new"
										element={
											<Suspense fallback={<PageLoader />}>
												<CreatePaymentPage />
											</Suspense>
										}
									/>
									<Route
										path="payments/:id"
										element={
											<Suspense fallback={<PageLoader />}>
												<PaymentDetailPage />
											</Suspense>
										}
									/>
									<Route
										path="payments/:id/edit"
										element={
											<Suspense fallback={<PageLoader />}>
												<EditPaymentPage />
											</Suspense>
										}
									/>
									<Route
										path="expenses"
										element={
											<Suspense fallback={<PageLoader />}>
												<ExpensesPage />
											</Suspense>
										}
									/>
									<Route
										path="expenses/new"
										element={
											<Suspense fallback={<PageLoader />}>
												<CreateExpensePage />
											</Suspense>
										}
									/>
									<Route
										path="expenses/:id"
										element={
											<Suspense fallback={<PageLoader />}>
												<ExpenseDetailPage />
											</Suspense>
										}
									/>
									<Route
										path="expenses/:id/edit"
										element={
											<Suspense fallback={<PageLoader />}>
												<EditExpensePage />
											</Suspense>
										}
									/>
									<Route
										path="notifications"
										element={
											<Suspense fallback={<PageLoader />}>
												<NotificationsPage />
											</Suspense>
										}
									/>
									<Route
										path="settings"
										element={
											<Suspense fallback={<PageLoader />}>
												<SettingsPage />
											</Suspense>
										}
									/>
								</Route>

								{/* Customer Portal Routes (Protected - Customer Only) */}
								<Route element={<PortalLayout />}>
									<Route
										path="/portal"
										element={
											<Suspense fallback={<PageLoader />}>
												<PortalHomePage />
											</Suspense>
										}
									/>
									<Route
										path="/portal/:tenantId"
										element={
											<Suspense fallback={<PageLoader />}>
												<ShopPortalPage />
											</Suspense>
										}
									/>
									<Route
										path="/portal/:tenantId/orders/:orderId"
										element={
											<Suspense fallback={<PageLoader />}>
												<PortalOrderDetailPage />
											</Suspense>
										}
									/>
								</Route>

								{/* Catch all */}
								<Route path="*" element={<Navigate to="/landing" replace />} />
							</Routes>
						</ErrorBoundary>
						<Toaster position="top-center" richColors closeButton />
					</AuthProvider>
				</LanguageProvider>
			</BrowserRouter>
		</QueryClientProvider>
	);
}

export default App;
