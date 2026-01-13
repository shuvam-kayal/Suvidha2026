/**
 * API Client - Axios instance with auth interceptors
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create axios instance
export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const { accessToken } = useAuthStore.getState();

        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - Handle auth errors and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && originalRequest) {
            const { refreshToken, logout, setTokens } = useAuthStore.getState();

            // If we have a refresh token, try to refresh
            if (refreshToken && !originalRequest.url?.includes('/refresh')) {
                try {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
                    setTokens(newAccessToken, newRefreshToken);

                    // Retry original request with new token
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    }
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, logout user
                    logout();
                }
            } else {
                // No refresh token, logout
                logout();
            }
        }

        return Promise.reject(error);
    }
);

// =============================================================================
// AUTH API FUNCTIONS
// =============================================================================

export interface OtpRequestResponse {
    success: boolean;
    message: string;
    expiresIn: number;
    _devOtp?: string; // Only in development
}

export interface OtpVerifyResponse {
    success: boolean;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: string;
        phoneNumber: string;
        name: string | null;
        email: string | null;
        isNewUser: boolean;
    };
}

/**
 * Request OTP for phone number
 */
export async function requestOtp(phoneNumber: string): Promise<OtpRequestResponse> {
    const response = await api.post<OtpRequestResponse>('/auth/otp/request', {
        phoneNumber,
    });
    return response.data;
}

/**
 * Verify OTP and login
 */
export async function verifyOtp(phoneNumber: string, otp: string): Promise<OtpVerifyResponse> {
    const response = await api.post<OtpVerifyResponse>('/auth/otp/verify', {
        phoneNumber,
        otp,
    });
    return response.data;
}

/**
 * Get current user profile
 */
export async function getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
}

/**
 * Logout - invalidate session
 */
export async function logout() {
    try {
        await api.post('/auth/logout');
    } catch {
        // Ignore errors, still clear local state
    }
    useAuthStore.getState().logout();
}

export default api;
