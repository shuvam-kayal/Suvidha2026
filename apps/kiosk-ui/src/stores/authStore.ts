/**
 * Authentication Store - Zustand State Management
 * Handles auth state, tokens, and user data
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

interface User {
    id: string;
    phoneNumber: string;
    name: string | null;
    email: string | null;
    isNewUser?: boolean;
}

interface AuthState {
    // State
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setTokens: (accessToken: string, refreshToken: string) => void;
    setUser: (user: User) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    logout: () => void;
    clearError: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            // Initial state
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            // Actions
            setTokens: (accessToken, refreshToken) =>
                set({
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    error: null,
                }),

            setUser: (user) =>
                set({
                    user,
                    isAuthenticated: true,
                }),

            setLoading: (isLoading) => set({ isLoading }),

            setError: (error) =>
                set({
                    error,
                    isLoading: false,
                }),

            logout: () =>
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    error: null,
                }),

            clearError: () => set({ error: null }),
        }),
        {
            name: 'suvidha-auth',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectError = (state: AuthState) => state.error;
export const selectAccessToken = (state: AuthState) => state.accessToken;
