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
import BooksListPage from "@/pages/books/BooksListPage";
import LinkRequestsPage from "@/pages/customers/LinkRequestsPage";
import MembersPage from "@/pages/customers/MembersPage";
import WalkInCustomersPage from "@/pages/customers/WalkInCustomersPage";
// Dashboard Pages
import DashboardPage from "@/pages/dashboard/DashboardPage";
import PlaceholderPage from "@/pages/dashboard/PlaceholderPage";
import NewOrderPage from "@/pages/orders/NewOrderPage";
import OrderDetailPage from "@/pages/orders/OrderDetailPage";
// Orders Pages
import OrdersListPage from "@/pages/orders/OrdersListPage";

// Portal Pages
import PortalHomePage from "@/pages/portal/PortalHomePage";

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
								<Route
									path="customers/walk-in"
									element={<WalkInCustomersPage />}
								/>
								<Route path="customers/members" element={<MembersPage />} />
								<Route
									path="customers/link-requests"
									element={<LinkRequestsPage />}
								/>
								<Route path="materials" element={<PlaceholderPage />} />
								<Route path="pricing" element={<PlaceholderPage />} />
								<Route path="payments" element={<PlaceholderPage />} />
								<Route path="expenses" element={<PlaceholderPage />} />
								<Route path="notifications" element={<PlaceholderPage />} />
								<Route path="settings" element={<PlaceholderPage />} />
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
