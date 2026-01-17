import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, AuthState, AuthErrorCode } from '../auth/types';

/**
 * Auth store interface with state and actions
 */
interface AuthStore extends AuthState {
  // Actions
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AuthErrorCode | null) => void;
}

/**
 * Zustand store for authentication state management
 *
 * Features:
 * - Persistent authentication state (localStorage)
 * - User profile management
 * - Token management
 * - Loading and error states
 * - Login/logout actions
 *
 * @example
 * ```tsx
 * const { user, accessToken, login, logout } = useAuthStore();
 *
 * // Login user
 * login(userData, accessToken, refreshToken);
 *
 * // Logout user
 * logout();
 * ```
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: (user: AuthUser, accessToken: string, refreshToken: string) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Set user
      setUser: (user: AuthUser | null) => {
        set({
          user,
          isAuthenticated: user !== null,
        });
      },

      // Set access token
      setAccessToken: (accessToken: string | null) => {
        set({ accessToken });
      },

      // Set refresh token
      setRefreshToken: (refreshToken: string | null) => {
        set({ refreshToken });
      },

      // Set loading state
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      // Set error state
      setError: (error: AuthErrorCode | null) => {
        set({ error });
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        // Only persist user and tokens
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
