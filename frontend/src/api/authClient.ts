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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const AUTH_ENDPOINTS = {
  login: '/auth/login',
  signup: '/auth/signup',
  profile: '/me',
  refresh: '/auth/refresh', // placeholder; backend not implemented
  logout: '/auth/logout', // placeholder; backend not implemented
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
    const raw = await this.request<{ user: AuthUser; token: string }>(AUTH_ENDPOINTS.login, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    return {
      success: true,
      user: raw.user,
      accessToken: raw.token,
      refreshToken: raw.token, // backend does not issue refresh tokens; reuse access token
      token: raw.token,
    };
  }

  /**
   * Register a new user
   *
   * @param data - User signup data
   * @returns Authentication response with user and tokens
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    const { confirmPassword, ...signupData } = data;
    const raw = await this.request<{ user: AuthUser; token: string }>(AUTH_ENDPOINTS.signup, {
      method: 'POST',
      body: JSON.stringify(signupData),
    });

    return {
      success: true,
      user: raw.user,
      accessToken: raw.token,
      refreshToken: raw.token,
      token: raw.token,
    };
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    // Backend does not support logout yet; clear client state upstream
    return Promise.resolve();
  }

  /**
   * Refresh authentication tokens
   * Not supported by backend yet
   */
  async refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
    throw new ApiError(400, 'INVALID_REFRESH_TOKEN', 'Refresh tokens are not supported yet');
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
