/**
 * Authentication Types and Interfaces
 * Defines all TypeScript types used throughout the authentication system
 */

/**
 * Represents an authenticated user
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  githubUsername?: string;
  githubUrl?: string;
  createdAt: number | Date;
  updatedAt?: number | Date;
  emailVerified?: boolean;
  roles?: UserRole[];
  mfaEnabled?: boolean;
  active?: boolean;
}

/**
 * User roles for role-based access control
 */
export type UserRole = 'admin' | 'moderator' | 'user' | 'guest';

/**
 * GitHub OAuth callback data
 */
export interface GitHubOAuthCallback {
  /** Authorization code from GitHub */
  code: string;
  /** State parameter for CSRF protection */
  state?: string;
}

/**
 * GitHub OAuth response from backend
 */
export interface GitHubOAuthResponse {
  /** Success status */
  success: boolean;
  /** Authenticated user data */
  user?: AuthUser;
  /** Access token for API requests */
  accessToken?: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken?: string;
  /** Error message (if unsuccessful) */
  error?: string;
  /** Error code for client-side error handling */
  errorCode?: AuthErrorCode;
}

/**
 * Registration data for new users
 */
export interface SignupData {
  email: string;
  password: string;
  name?: string;
  confirmPassword?: string;
}

/**
 * Authentication credentials for login
 */
export interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * Response from authentication endpoints
 */
export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  error?: string;
  errorCode?: AuthErrorCode;
}

/**
 * Authentication error codes
 */
export type AuthErrorCode =
  | 'OAUTH_FAILED'
  | 'OAUTH_CANCELLED'
  | 'OAUTH_STATE_MISMATCH'
  | 'GITHUB_API_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'TOKEN_EXPIRED'
  | 'INVALID_TOKEN'
  | 'INVALID_ACCESS_TOKEN'
  | 'INVALID_REFRESH_TOKEN'
  | 'UNAUTHORIZED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Authentication state in the store
 */
export interface AuthState {
  /** Currently authenticated user (null if not logged in) */
  user: AuthUser | null;
  /** Access token for API requests */
  accessToken: string | null;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string | null;
  /** Whether authentication is being processed */
  isLoading: boolean;
  /** Current error (if any) */
  error: AuthErrorCode | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
}

/**
 * Authentication context value
 */
export interface AuthContextType extends AuthState {
  /** Function to log in a user */
  login: (email: string, password: string) => Promise<void>;
  /** Function to sign up a new user */
  signup: (data: SignupData) => Promise<void>;
  /** Function to log out the current user */
  logout: () => Promise<void>;
  /** Function to refresh authentication tokens */
  refreshTokens: () => Promise<void>;
  /** Function to clear error state */
  clearError: () => void;
}

/**
 * Password validation rules
 */
export interface PasswordValidationRules {
  /** Minimum password length */
  minLength: number;
  /** Require uppercase letters */
  requireUppercase: boolean;
  /** Require lowercase letters */
  requireLowercase: boolean;
  /** Require numbers */
  requireNumbers: boolean;
  /** Require special characters */
  requireSpecialChars: boolean;
  /** Allowed special characters */
  specialChars: string;
}

/**
 * Session configuration
 */
export interface SessionConfig {
  /** Access token expiration time in minutes */
  accessTokenExpiresIn: number;
  /** Refresh token expiration time in days */
  refreshTokenExpiresIn: number;
  /** Whether to persist session in localStorage */
  persistSession: boolean;
  /** Session storage key prefix */
  storageKeyPrefix: string;
}

/**
 * Authentication API endpoints
 */
export interface AuthApiEndpoints {
  /** Login endpoint */
  login: string;
  /** Sign up endpoint */
  signup: string;
  /** Logout endpoint */
  logout: string;
  /** Refresh token endpoint */
  refreshToken: string;
  /** Verify email endpoint */
  verifyEmail: string;
  /** Forgot password endpoint */
  forgotPassword: string;
  /** Reset password endpoint */
  resetPassword: string;
}

/**
 * Type guard to check if an object is an AuthUser
 */
export function isAuthUser(obj: unknown): obj is AuthUser {
  if (typeof obj !== 'object' || obj === null) return false;
  const user = obj as Record<string, unknown>;
  return (
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.name === 'string' &&
    typeof user.emailVerified === 'boolean' &&
    Array.isArray(user.roles)
  );
}

/**
 * Type guard to check if an object is an AuthResponse
 */
export function isAuthResponse(obj: unknown): obj is AuthResponse {
  if (typeof obj !== 'object' || obj === null) return false;
  const response = obj as Record<string, unknown>;
  return typeof response.success === 'boolean';
}
