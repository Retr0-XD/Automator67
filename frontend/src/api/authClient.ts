import type {
  AuthCredentials,
  SignupData,
  AuthResponse,
  AuthUser,
  AuthErrorCode,
} from '../auth/types';

/**
 * API Configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const AUTH_ENDPOINTS = {
  login: '/auth/login',
  signup: '/auth/signup',
  logout: '/auth/logout',
  refresh: '/auth/refresh',
  profile: '/auth/profile',
};

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  errorCode: AuthErrorCode;

  constructor(
    statusCode: number,
    errorCode: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

/**
 * Authentication API Client
 *
 * Provides methods for authentication-related API calls:
 * - Login
 * - Signup
 * - Logout
 * - Token refresh
 * - Profile fetching
 *
 * All methods return promises and handle HTTP errors properly.
 */
export class AuthApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Parse response body
      const data = await response.json();

      // Handle HTTP errors
      if (!response.ok) {
        throw new ApiError(
          response.status,
          data.errorCode || 'UNKNOWN_ERROR',
          data.message || 'An error occurred',
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or parsing errors
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Network error',
      );
    }
  }

  /**
   * Login with email and password
   *
   * @param credentials - User login credentials
   * @returns Authentication response with user and tokens
   */
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>(AUTH_ENDPOINTS.login, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  /**
   * Register a new user
   *
   * @param data - User signup data
   * @returns Authentication response with user and tokens
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...signupData } = data;
    return this.request<AuthResponse>(AUTH_ENDPOINTS.signup, {
      method: 'POST',
      body: JSON.stringify(signupData),
    });
  }

  /**
   * Logout current user
   *
   * @param accessToken - Current access token
   */
  async logout(accessToken: string): Promise<void> {
    await this.request<void>(AUTH_ENDPOINTS.logout, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Refresh authentication tokens
   *
   * @param refreshToken - Current refresh token
   * @returns New access and refresh tokens
   */
  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.request<{ accessToken: string; refreshToken: string }>(
      AUTH_ENDPOINTS.refresh,
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      },
    );
  }

  /**
   * Get current user profile
   *
   * @param accessToken - Current access token
   * @returns User profile data
   */
  async getProfile(accessToken: string): Promise<AuthUser> {
    return this.request<AuthUser>(AUTH_ENDPOINTS.profile, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}

/**
 * Default auth API client instance
 */
export const authApi = new AuthApiClient();
