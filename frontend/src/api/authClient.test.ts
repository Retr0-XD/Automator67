import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthApiClient, ApiError } from './authClient';
import type { AuthCredentials, SignupData, AuthResponse } from '../auth/types';

// Mock fetch globally
const mockFetch = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = mockFetch;

describe('AuthApiClient', () => {
  let client: AuthApiClient;

  beforeEach(() => {
    client = new AuthApiClient('http://localhost:3000/api');
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('should send login request with credentials', async () => {
      const credentials: AuthCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse: AuthResponse = {
        success: true,
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          roles: ['user'],
          createdAt: new Date(),
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.login(credentials);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(credentials),
        }),
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw ApiError on failed login', async () => {
      const credentials: AuthCredentials = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          errorCode: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        }),
      });

      try {
        await client.login(credentials);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toBe('Invalid email or password');
          expect(error.statusCode).toBe(401);
          expect(error.errorCode).toBe('INVALID_CREDENTIALS');
        }
      }
    });
  });

  describe('signup', () => {
    it('should send signup request with user data', async () => {
      const signupData: SignupData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        confirmPassword: 'password123',
      };

      const mockResponse: AuthResponse = {
        success: true,
        user: {
          id: '2',
          email: 'newuser@example.com',
          name: 'New User',
          emailVerified: false,
          roles: ['user'],
          createdAt: new Date(),
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.signup(signupData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/signup',
        expect.objectContaining({
          method: 'POST',
          body: expect.not.stringContaining('confirmPassword'),
        }),
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw ApiError when email already exists', async () => {
      const signupData: SignupData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
        confirmPassword: 'password123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          errorCode: 'EMAIL_ALREADY_EXISTS',
          message: 'Email already registered',
        }),
      });

      await expect(client.signup(signupData)).rejects.toThrow(ApiError);
    });
  });

  describe('logout', () => {
    it('should send logout request with access token', async () => {
      const accessToken = 'valid-access-token';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await client.logout(accessToken);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/logout',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${accessToken}`,
          }),
        }),
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.refreshTokens(refreshToken);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }),
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw ApiError when refresh token is invalid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          errorCode: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token',
        }),
      });

      await expect(client.refreshTokens('invalid-token')).rejects.toThrow(
        ApiError,
      );
    });
  });

  describe('getProfile', () => {
    it('should fetch user profile with access token', async () => {
      const accessToken = 'valid-access-token';
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        roles: ['user'],
        createdAt: new Date(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await client.getProfile(accessToken);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/profile',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${accessToken}`,
          }),
        }),
      );

      expect(result).toEqual(mockUser);
    });

    it('should throw ApiError when token is expired', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          errorCode: 'TOKEN_EXPIRED',
          message: 'Access token expired',
        }),
      });

      await expect(client.getProfile('expired-token')).rejects.toThrow(ApiError);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      await expect(
        client.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(ApiError);
    });

    it('should create ApiError with correct properties', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          errorCode: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials',
        }),
      });

      try {
        await client.login({ email: 'test@example.com', password: 'wrong' });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(401);
          expect(error.errorCode).toBe('INVALID_CREDENTIALS');
          expect(error.message).toBe('Invalid credentials');
        }
      }
    });
  });
});
