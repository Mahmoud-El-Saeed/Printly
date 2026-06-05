import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { authApi } from "@/lib/api/auth";
import { clearTokens, getAccessToken } from "@/lib/api/client";
import type { Role } from "@/lib/constants";
import { ROLES } from "@/lib/constants";
import type { TokenData } from "@/types";

interface AuthContextType {
	user: TokenData | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	role: Role | null;
	tenantId: string | null;
	login: (email: string, password: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<TokenData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Decode JWT payload to get user data without calling API
	const decodeToken = useCallback((token: string): TokenData | null => {
		try {
			const base64Payload = token.split(".")[1];
			const payload = JSON.parse(atob(base64Payload));
			return {
				user_id: payload.user_id,
				tenant_id: payload.tenant_id || null,
				role: payload.role,
			};
		} catch {
			return null;
		}
	}, []);

	// Check for existing token on mount
	useEffect(() => {
		const token = getAccessToken();
		if (token) {
			const userData = decodeToken(token);
			if (userData) {
				setUser(userData);
			} else {
				clearTokens();
			}
		}
		setIsLoading(false);
	}, [decodeToken]);

	const login = useCallback(
		async (email: string, password: string) => {
			const tokenResponse = await authApi.login({ email, password });
			const userData = decodeToken(tokenResponse.access_token);
			if (userData) {
				setUser(userData);
			}
		},
		[decodeToken],
	);

	const logout = useCallback(() => {
		clearTokens();
		setUser(null);
		window.location.href = "/login";
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated: !!user,
				isLoading,
				role: (user?.role as Role) || null,
				tenantId: user?.tenant_id || null,
				login,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

export function useRequireAuth(): AuthContextType {
	const auth = useAuth();
	if (!auth.isAuthenticated) {
		throw new Error("User must be authenticated");
	}
	return auth;
}

export function useRequireRole(...roles: Role[]): AuthContextType {
	const auth = useRequireAuth();
	if (!auth.role || !roles.includes(auth.role)) {
		throw new Error(`Required role: ${roles.join(" or ")}`);
	}
	return auth;
}

export { ROLES };
