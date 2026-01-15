import { authApi, ApiError } from '../api/authClient';
import { useAuthStore } from '../store/authStore';

/**
 * Token storage keys
 */
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
} as const;

/**
 * Token Storage Manager
 *
 * Handles secure storage and retrieval of authentication tokens.
 * Tokens are stored in localStorage for persistence across sessions.
 */
export class TokenStorage {
  /**
   * Save access token to storage
   */
  static saveAccessToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Failed to save access token:', error);
    }
  }

  /**
   * Get access token from storage
   */
  static getAccessToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  }

  /**
   * Save refresh token to storage
   */
  static saveRefreshToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Failed to save refresh token:', error);
    }
  }

  /**
   * Get refresh token from storage
   */
  static getRefreshToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Remove all tokens from storage
   */
  static clearTokens(): void {
    try {
      localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Check if tokens exist in storage
   */
  static hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }
}

/**
 * Token Refresh Manager
 *
 * Handles automatic token refresh when access token expires.
 * Integrates with auth store to update application state.
 */
export class TokenRefreshManager {
  private static refreshPromise: Promise<boolean> | null = null;

  /**
   * Refresh authentication tokens
   *
   * @returns Promise that resolves to true if refresh succeeded, false otherwise
   */
  static async refreshTokens(): Promise<boolean> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private static async performRefresh(): Promise<boolean> {
    const refreshToken = TokenStorage.getRefreshToken();

    if (!refreshToken) {
      console.error('No refresh token available');
      this.handleRefreshFailure();
      return false;
    }

    try {
      // Call refresh endpoint
      const response = await authApi.refreshTokens(refreshToken);

      // Update tokens in storage
      TokenStorage.saveAccessToken(response.accessToken);
      TokenStorage.saveRefreshToken(response.refreshToken);

      // Update store
      useAuthStore.getState().setAccessToken(response.accessToken);
      useAuthStore.getState().setRefreshToken(response.refreshToken);

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.handleRefreshFailure();
      return false;
    }
  }

  /**
   * Handle refresh failure by logging out user
   */
  private static handleRefreshFailure(): void {
    // Clear all auth data
    TokenStorage.clearTokens();
    useAuthStore.getState().logout();
  }

  /**
   * Check if error is due to expired token
   */
  static isTokenExpiredError(error: unknown): boolean {
    return (
      error instanceof ApiError &&
      (error.errorCode === 'TOKEN_EXPIRED' ||
        error.errorCode === 'INVALID_ACCESS_TOKEN')
    );
  }

  /**
   * Attempt to retry a request after refreshing token
   *
   * @param requestFn - Function that makes the API request
   * @returns Result of the request or null if refresh fails
   */
  static async retryWithRefresh<T>(
    requestFn: () => Promise<T>,
  ): Promise<T | null> {
    try {
      // Try the request first
      return await requestFn();
    } catch (error) {
      // If token expired, try to refresh and retry
      if (this.isTokenExpiredError(error)) {
        const refreshed = await this.refreshTokens();

        if (refreshed) {
          try {
            // Retry the request with new token
            return await requestFn();
          } catch (retryError) {
            console.error('Request failed after token refresh:', retryError);
            return null;
          }
        }
      }

      // Re-throw if not a token error or refresh failed
      throw error;
    }
  }
}

/**
 * Initialize token storage on app startup
 *
 * Loads tokens from storage and sets them in the auth store.
 * Should be called when the application starts.
 */
export function initializeTokenStorage(): void {
  const accessToken = TokenStorage.getAccessToken();
  const refreshToken = TokenStorage.getRefreshToken();

  if (accessToken && refreshToken) {
    const store = useAuthStore.getState();
    store.setAccessToken(accessToken);
    store.setRefreshToken(refreshToken);
  }
}
