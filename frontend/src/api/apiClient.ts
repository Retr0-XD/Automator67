import { useAuthStore } from '../store/authStore';

/**
 * Authenticated API Client
 *
 * Wraps fetch and automatically:
 * - Injects Authorization header with stored access token
 * - Handles 401/403 errors and logs out user
 * - Provides a consistent error format
 */
export class AuthenticatedApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an authenticated API request
   * Automatically injects Authorization header if token is available
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const { accessToken } = useAuthStore.getState();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add authorization header if token exists
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle unauthenticated/unauthorized
      if (response.status === 401 || response.status === 403) {
        const { logout } = useAuthStore.getState();
        logout();
        throw new Error('Authentication required. Please sign in again.');
      }

      // Try to parse as JSON
      const data = await response.json();

      // Check HTTP status
      if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}`);
        (error as any).statusCode = response.status;
        (error as any).data = data;
        throw error;
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options: RequestInit = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options: RequestInit = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options: RequestInit = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

/**
 * Default authenticated API client instance
 */
export const apiClient = new AuthenticatedApiClient();
