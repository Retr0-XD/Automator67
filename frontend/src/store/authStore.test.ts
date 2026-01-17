import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { AuthUser } from '../auth/types';

describe('useAuthStore', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    // Reset store state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe('Initial State', () => {
    it('should have null user initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toBeNull();
    });

    it('should have null accessToken initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.accessToken).toBeNull();
    });

    it('should have null refreshToken initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.refreshToken).toBeNull();
    });

    it('should not be authenticated initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isLoading).toBe(false);
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.error).toBeNull();
    });
  });

  describe('Login', () => {
    it('should set user and tokens on login', () => {
      const { result } = renderHook(() => useAuthStore());
      const mockUser: AuthUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        roles: ['user'],
        createdAt: new Date('2026-01-15T00:00:00Z'),
      };
      const mockAccessToken = 'mock-access-token-123';
      const mockRefreshToken = 'mock-refresh-token-123';

      act(() => {
        result.current.login(mockUser, mockAccessToken, mockRefreshToken);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe(mockAccessToken);
      expect(result.current.refreshToken).toBe(mockRefreshToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should clear error on successful login', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set an error first
      act(() => {
        result.current.setError('INVALID_CREDENTIALS');
      });

      expect(result.current.error).toBe('INVALID_CREDENTIALS');

      // Login should clear the error
      const mockUser: AuthUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        roles: ['user'],
        createdAt: new Date('2026-01-15T00:00:00Z'),
      };

      act(() => {
        result.current.login(mockUser, 'access-token', 'refresh-token');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Logout', () => {
    it('should clear user and tokens on logout', () => {
      const { result } = renderHook(() => useAuthStore());
      const mockUser: AuthUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        roles: ['user'],
        createdAt: new Date('2026-01-15T00:00:00Z'),
      };

      // Login first
      act(() => {
        result.current.login(mockUser, 'access-token', 'refresh-token');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('State Setters', () => {
    it('should set user', () => {
      const { result } = renderHook(() => useAuthStore());
      const mockUser: AuthUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        roles: ['user'],
        createdAt: new Date('2026-01-15T00:00:00Z'),
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear authentication when user is set to null', () => {
      const { result } = renderHook(() => useAuthStore());
      const mockUser: AuthUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        roles: ['user'],
        createdAt: new Date('2026-01-15T00:00:00Z'),
      };

      // Set user first
      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Clear user
      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set access token', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAccessToken('new-access-token');
      });

      expect(result.current.accessToken).toBe('new-access-token');
    });

    it('should set refresh token', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setRefreshToken('new-refresh-token');
      });

      expect(result.current.refreshToken).toBe('new-refresh-token');
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set error state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError('INVALID_CREDENTIALS');
      });

      expect(result.current.error).toBe('INVALID_CREDENTIALS');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Persistence', () => {
    it('should persist user and tokens to localStorage', () => {
      const { result } = renderHook(() => useAuthStore());
      const mockUser: AuthUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        roles: ['user'],
        createdAt: new Date('2026-01-15T00:00:00Z'),
      };

      act(() => {
        result.current.login(mockUser, 'access-token', 'refresh-token');
      });

      // Check localStorage
      const stored = localStorage.getItem('auth-storage');
      expect(stored).toBeTruthy();

      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.user).toBeTruthy();
        expect(parsed.state.accessToken).toBe('access-token');
        expect(parsed.state.refreshToken).toBe('refresh-token');
        expect(parsed.state.isAuthenticated).toBe(true);
      }
    });

    it('should not persist loading and error states', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
        result.current.setError('INVALID_CREDENTIALS');
      });

      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.isLoading).toBeUndefined();
        expect(parsed.state.error).toBeUndefined();
      }
    });
  });
});
