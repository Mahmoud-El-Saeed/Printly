import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
// Layouts
import DashboardLayout from "@/components/layout/DashboardLayout";
import PortalLayout from "@/components/layout/PortalLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";
import RegisterCustomerPage from "@/pages/auth/RegisterCustomerPage";
import RegisterShopOwnerPage from "@/pages/auth/RegisterShopOwnerPage";
import BookDetailPage from "@/pages/books/BookDetailPage";
import BooksListPage from "@/pages/books/BooksListPage";
import CreateBookPage from "@/pages/books/CreateBookPage";
import EditBookPage from "@/pages/books/EditBookPage";
import CreateMemberPage from "@/pages/customers/CreateMemberPage";
import CreateWalkInCustomerPage from "@/pages/customers/CreateWalkInCustomerPage";
import EditMemberPage from "@/pages/customers/EditMemberPage";
import EditWalkInCustomerPage from "@/pages/customers/EditWalkInCustomerPage";
import LinkRequestsPage from "@/pages/customers/LinkRequestsPage";
import MembersPage from "@/pages/customers/MembersPage";
import WalkInCustomersPage from "@/pages/customers/WalkInCustomersPage";
// Dashboard Pages
import DashboardPage from "@/pages/dashboard/DashboardPage";
import ExpensesPage from "@/pages/expenses/ExpensesPage";
import MaterialsPage from "@/pages/materials/MaterialsPage";
import CreateMaterialPage from "@/pages/materials/CreateMaterialPage";
import MaterialDetailPage from "@/pages/materials/MaterialDetailPage";
import EditMaterialPage from "@/pages/materials/EditMaterialPage";
import NotificationsPage from "@/pages/notifications/NotificationsPage";
import NewOrderPage from "@/pages/orders/NewOrderPage";
import OrderDetailPage from "@/pages/orders/OrderDetailPage";
// Orders Pages
import OrdersListPage from "@/pages/orders/OrdersListPage";
import CreatePaymentPage from "@/pages/payments/CreatePaymentPage";
import EditPaymentPage from "@/pages/payments/EditPaymentPage";
import PaymentsPage from "@/pages/payments/PaymentsPage";
// Portal Pages
import PortalHomePage from "@/pages/portal/PortalHomePage";
import PricingPage from "@/pages/pricing/PricingPage";
import CreatePricingRulePage from "@/pages/pricing/CreatePricingRulePage";
import EditPricingRulePage from "@/pages/pricing/EditPricingRulePage";
import SettingsPage from "@/pages/settings/SettingsPage";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
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
						<Routes>
							{/* Auth Routes */}
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
								<Route index element={<DashboardPage />} />
								<Route path="orders" element={<OrdersListPage />} />
								<Route path="orders/new" element={<NewOrderPage />} />
								<Route path="orders/:id" element={<OrderDetailPage />} />
								<Route path="books" element={<BooksListPage />} />
								<Route path="books/new" element={<CreateBookPage />} />
								<Route path="books/:id" element={<BookDetailPage />} />
								<Route path="books/:id/edit" element={<EditBookPage />} />
								<Route
									path="customers/walk-in"
									element={<WalkInCustomersPage />}
								/>
								<Route
									path="customers/walk-in/new"
									element={<CreateWalkInCustomerPage />}
								/>
								<Route
									path="customers/walk-in/:id/edit"
									element={<EditWalkInCustomerPage />}
								/>
								<Route path="customers/members" element={<MembersPage />} />
								<Route
									path="customers/members/new"
									element={<CreateMemberPage />}
								/>
								<Route
									path="customers/members/:id/edit"
									element={<EditMemberPage />}
								/>
								<Route
									path="customers/link-requests"
									element={<LinkRequestsPage />}
								/>
								<Route path="materials" element={<MaterialsPage />} />
								<Route path="materials/new" element={<CreateMaterialPage />} />
								<Route path="materials/:id" element={<MaterialDetailPage />} />
								<Route path="materials/:id/edit" element={<EditMaterialPage />} />
								<Route path="pricing" element={<PricingPage />} />
								<Route path="pricing/new" element={<CreatePricingRulePage />} />
								<Route path="pricing/:id/edit" element={<EditPricingRulePage />} />
								<Route path="payments" element={<PaymentsPage />} />
								<Route path="payments/new" element={<CreatePaymentPage />} />
								<Route path="payments/:id/edit" element={<EditPaymentPage />} />
								<Route path="expenses" element={<ExpensesPage />} />
								<Route path="notifications" element={<NotificationsPage />} />
								<Route path="settings" element={<SettingsPage />} />
							</Route>

							{/* Customer Portal Routes (Protected - Customer Only) */}
							<Route element={<PortalLayout />}>
								<Route path="/portal" element={<PortalHomePage />} />
							</Route>

							{/* Catch all */}
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
						<Toaster position="top-center" richColors closeButton />
					</AuthProvider>
				</LanguageProvider>
			</BrowserRouter>
		</QueryClientProvider>
	);
}

export default App;
