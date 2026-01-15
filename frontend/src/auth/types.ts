/**
 * Authentication Types and Interfaces
 * Defines all TypeScript types used throughout the authentication system
 */

/**
 * Represents an authenticated user
 */
export interface AuthUser {
  /** Unique identifier for the user */
  id: string;
  /** User's email address (unique) */
  email: string;
  /** User's full name */
  name: string;
  /** User's profile picture URL (optional) */
  avatar?: string;
  /** Timestamp when user account was created */
  createdAt: Date;
  /** Timestamp of last login */
  lastLogin?: Date;
  /** Whether email is verified */
  emailVerified: boolean;
  /** User roles for access control */
  roles: UserRole[];
}

/**
 * User roles for role-based access control
 */
export type UserRole = 'admin' | 'moderator' | 'user' | 'guest';

/**
 * Authentication credentials for login
 */
export interface AuthCredentials {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/**
 * Registration data for new users
 */
export interface SignupData extends AuthCredentials {
  /** Full name of the user */
  name: string;
  /** Confirmation of password */
  confirmPassword: string;
}

/**
 * Response from authentication endpoints
 */
export interface AuthResponse {
  /** Success status of the authentication request */
  success: boolean;
  /** Authenticated user data (if successful) */
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
 * Authentication error codes
 */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'TOKEN_EXPIRED'
  | 'INVALID_TOKEN'
  | 'UNAUTHORIZED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR';

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
