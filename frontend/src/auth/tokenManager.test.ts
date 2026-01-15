import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  TokenStorage,
  TokenRefreshManager,
  initializeTokenStorage,
} from './tokenManager';
import { useAuthStore } from '../store/authStore';
import { authApi, ApiError } from '../api/authClient';

// Mock authApi
vi.mock('../api/authClient', () => ({
  authApi: {
    refreshTokens: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    statusCode: number;
    errorCode: string;
    constructor(statusCode: number, errorCode: string, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.errorCode = errorCode;
    }
  },
}));

describe('TokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveAccessToken', () => {
    it('should save access token to localStorage', () => {
      TokenStorage.saveAccessToken('test-access-token');
      expect(localStorage.getItem('auth_access_token')).toBe('test-access-token');
    });
  });

  describe('getAccessToken', () => {
    it('should retrieve access token from localStorage', () => {
      localStorage.setItem('auth_access_token', 'stored-token');
      expect(TokenStorage.getAccessToken()).toBe('stored-token');
    });

    it('should return null if no token exists', () => {
      expect(TokenStorage.getAccessToken()).toBeNull();
    });
  });

  describe('saveRefreshToken', () => {
    it('should save refresh token to localStorage', () => {
      TokenStorage.saveRefreshToken('test-refresh-token');
      expect(localStorage.getItem('auth_refresh_token')).toBe('test-refresh-token');
    });
  });

  describe('getRefreshToken', () => {
    it('should retrieve refresh token from localStorage', () => {
      localStorage.setItem('auth_refresh_token', 'stored-refresh-token');
      expect(TokenStorage.getRefreshToken()).toBe('stored-refresh-token');
    });

    it('should return null if no token exists', () => {
      expect(TokenStorage.getRefreshToken()).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should remove all tokens from localStorage', () => {
      localStorage.setItem('auth_access_token', 'access-token');
      localStorage.setItem('auth_refresh_token', 'refresh-token');

      TokenStorage.clearTokens();

      expect(localStorage.getItem('auth_access_token')).toBeNull();
      expect(localStorage.getItem('auth_refresh_token')).toBeNull();
    });
  });

  describe('hasTokens', () => {
    it('should return true if both tokens exist', () => {
      localStorage.setItem('auth_access_token', 'access-token');
      localStorage.setItem('auth_refresh_token', 'refresh-token');
      expect(TokenStorage.hasTokens()).toBe(true);
    });

    it('should return false if access token is missing', () => {
      localStorage.setItem('auth_refresh_token', 'refresh-token');
      expect(TokenStorage.hasTokens()).toBe(false);
    });

    it('should return false if refresh token is missing', () => {
      localStorage.setItem('auth_access_token', 'access-token');
      expect(TokenStorage.hasTokens()).toBe(false);
    });

    it('should return false if no tokens exist', () => {
      expect(TokenStorage.hasTokens()).toBe(false);
    });
  });
});

describe('TokenRefreshManager', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      TokenStorage.saveRefreshToken('valid-refresh-token');

      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      vi.mocked(authApi.refreshTokens).mockResolvedValueOnce(mockResponse);

      const result = await TokenRefreshManager.refreshTokens();

      expect(result).toBe(true);
      expect(TokenStorage.getAccessToken()).toBe('new-access-token');
      expect(TokenStorage.getRefreshToken()).toBe('new-refresh-token');
      expect(useAuthStore.getState().accessToken).toBe('new-access-token');
      expect(useAuthStore.getState().refreshToken).toBe('new-refresh-token');
    });

    it('should return false if no refresh token exists', async () => {
      const result = await TokenRefreshManager.refreshTokens();
      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should handle refresh failure', async () => {
      TokenStorage.saveRefreshToken('invalid-refresh-token');

      vi.mocked(authApi.refreshTokens).mockRejectedValueOnce(
        new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token'),
      );

      const result = await TokenRefreshManager.refreshTokens();

      expect(result).toBe(false);
      expect(TokenStorage.getAccessToken()).toBeNull();
      expect(TokenStorage.getRefreshToken()).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should prevent multiple simultaneous refresh requests', async () => {
      TokenStorage.saveRefreshToken('valid-refresh-token');

      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      vi.mocked(authApi.refreshTokens).mockResolvedValue(mockResponse);

      // Make two refresh requests simultaneously
      const promise1 = TokenRefreshManager.refreshTokens();
      const promise2 = TokenRefreshManager.refreshTokens();

      await Promise.all([promise1, promise2]);

      // API should only be called once
      expect(authApi.refreshTokens).toHaveBeenCalledTimes(1);
    });
  });

  describe('isTokenExpiredError', () => {
    it('should return true for TOKEN_EXPIRED error', () => {
      const error = new ApiError(401, 'TOKEN_EXPIRED', 'Token expired');
      expect(TokenRefreshManager.isTokenExpiredError(error)).toBe(true);
    });

    it('should return true for INVALID_ACCESS_TOKEN error', () => {
      const error = new ApiError(401, 'INVALID_ACCESS_TOKEN', 'Invalid token');
      expect(TokenRefreshManager.isTokenExpiredError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new ApiError(400, 'INVALID_CREDENTIALS', 'Invalid credentials');
      expect(TokenRefreshManager.isTokenExpiredError(error)).toBe(false);
    });

    it('should return false for non-ApiError errors', () => {
      const error = new Error('Network error');
      expect(TokenRefreshManager.isTokenExpiredError(error)).toBe(false);
    });
  });

  describe('retryWithRefresh', () => {
    it('should return result on successful request', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await TokenRefreshManager.retryWithRefresh(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry after token refresh on TOKEN_EXPIRED error', async () => {
      TokenStorage.saveRefreshToken('valid-refresh-token');

      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      vi.mocked(authApi.refreshTokens).mockResolvedValueOnce(mockResponse);

      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(
          new ApiError(401, 'TOKEN_EXPIRED', 'Token expired'),
        )
        .mockResolvedValueOnce('success');

      const result = await TokenRefreshManager.retryWithRefresh(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(authApi.refreshTokens).toHaveBeenCalledTimes(1);
    });

    it('should throw error if not a token error', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValue(
          new ApiError(400, 'INVALID_CREDENTIALS', 'Invalid credentials'),
        );

      await expect(
        TokenRefreshManager.retryWithRefresh(mockFn),
      ).rejects.toThrow('Invalid credentials');
    });
  });
});

describe('initializeTokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('should load tokens from storage into auth store', () => {
    localStorage.setItem('auth_access_token', 'stored-access-token');
    localStorage.setItem('auth_refresh_token', 'stored-refresh-token');

    initializeTokenStorage();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('stored-access-token');
    expect(state.refreshToken).toBe('stored-refresh-token');
  });

  it('should not update store if no tokens exist', () => {
    initializeTokenStorage();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('should not update store if only one token exists', () => {
    localStorage.setItem('auth_access_token', 'stored-access-token');

    initializeTokenStorage();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
  });
});
