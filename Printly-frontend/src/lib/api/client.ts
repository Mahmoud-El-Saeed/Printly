import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";
import type { RefreshRequest, TokenResponse } from "@/types";

const REFRESH_TOKEN_KEY = "printly_refresh_token";
const ACCESS_TOKEN_KEY = "printly_access_token";

// ==================== Token Storage ====================

export function getAccessToken(): string | null {
	return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setTokens(tokens: TokenResponse): void {
	localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
	localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearTokens(): void {
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ==================== Axios Instance ====================

const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor: attach access token
apiClient.interceptors.request.use(
	(config) => {
		const token = getAccessToken();
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// Response interceptor: handle 401 → refresh token
let isRefreshing = false;
let failedQueue: Array<{
	resolve: (token: string) => void;
	reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
	failedQueue.forEach((promise) => {
		if (error) {
			promise.reject(error);
		} else if (token) {
			promise.resolve(token);
		}
	});
	failedQueue = [];
}

apiClient.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// Skip if not a 401 or if it's already a retry or auth endpoint
		if (
			error.response?.status !== 401 ||
			originalRequest._retry ||
			originalRequest.url?.startsWith("/auth")
		) {
			return Promise.reject(error);
		}

		// If already refreshing, queue this request
		if (isRefreshing) {
			return new Promise((resolve, reject) => {
				failedQueue.push({ resolve, reject });
			})
				.then((token) => {
					originalRequest.headers.Authorization = `Bearer ${token}`;
					return apiClient(originalRequest);
				})
				.catch((err) => Promise.reject(err));
		}

		originalRequest._retry = true;
		isRefreshing = true;

		const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
		if (!refreshToken) {
			clearTokens();
			window.location.href = "/login";
			return Promise.reject(error);
		}

		try {
			const response = await axios.post<TokenResponse>(
				`${API_BASE_URL}/auth/refresh`,
				{ refresh_token: refreshToken } satisfies RefreshRequest,
			);

			const { access_token, refresh_token } = response.data;
			setTokens({ access_token, refresh_token, token_type: "bearer" });

			processQueue(null, access_token);

			originalRequest.headers.Authorization = `Bearer ${access_token}`;
			return apiClient(originalRequest);
		} catch (refreshError) {
			processQueue(refreshError, null);
			clearTokens();
			window.location.href = "/login";
			return Promise.reject(refreshError);
		} finally {
			isRefreshing = false;
		}
	},
);

export default apiClient;
