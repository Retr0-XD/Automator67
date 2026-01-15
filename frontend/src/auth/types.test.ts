/**
 * Tests for Authentication Types
 */
import { describe, it, expect } from 'vitest';
import {
  isAuthUser,
  isAuthResponse,
  type AuthUser,
  type AuthResponse,
  type SignupData,
  type AuthErrorCode,
  type UserRole,
} from './types';

describe('Auth Types', () => {
  describe('Type Guards', () => {
    describe('isAuthUser', () => {
      it('should return true for valid AuthUser object', () => {
        const validUser: AuthUser = {
          id: 'user123',
          email: 'user@example.com',
          name: 'John Doe',
          createdAt: new Date(),
          emailVerified: true,
          roles: ['user'],
        };

        expect(isAuthUser(validUser)).toBe(true);
      });

      it('should return true for AuthUser with optional fields', () => {
        const userWithOptional: AuthUser = {
          id: 'user123',
          email: 'user@example.com',
          name: 'John Doe',
          avatar: 'https://example.com/avatar.jpg',
          createdAt: new Date(),
          lastLogin: new Date(),
          emailVerified: true,
          roles: ['user', 'moderator'],
        };

        expect(isAuthUser(userWithOptional)).toBe(true);
      });

      it('should return false for object without required fields', () => {
        const invalidUser = {
          id: 'user123',
          email: 'user@example.com',
          // missing name, emailVerified, roles
        };

        expect(isAuthUser(invalidUser)).toBe(false);
      });

      it('should return false for object with wrong type fields', () => {
        const wrongTypeUser = {
          id: 123, // should be string
          email: 'user@example.com',
          name: 'John Doe',
          emailVerified: true,
          roles: ['user'],
        };

        expect(isAuthUser(wrongTypeUser)).toBe(false);
      });

      it('should return false for null or undefined', () => {
        expect(isAuthUser(null)).toBe(false);
        expect(isAuthUser(undefined)).toBe(false);
      });

      it('should return false for non-object values', () => {
        expect(isAuthUser('not an object')).toBe(false);
        expect(isAuthUser(123)).toBe(false);
        expect(isAuthUser(true)).toBe(false);
      });
    });

    describe('isAuthResponse', () => {
      it('should return true for valid AuthResponse object', () => {
        const response: AuthResponse = {
          success: true,
          user: {
            id: 'user123',
            email: 'user@example.com',
            name: 'John Doe',
            createdAt: new Date(),
            emailVerified: true,
            roles: ['user'],
          },
          accessToken: 'token123',
          refreshToken: 'refresh123',
        };

        expect(isAuthResponse(response)).toBe(true);
      });

      it('should return true for failed AuthResponse', () => {
        const response: AuthResponse = {
          success: false,
          error: 'Invalid credentials',
          errorCode: 'INVALID_CREDENTIALS',
        };

        expect(isAuthResponse(response)).toBe(true);
      });

      it('should return true for minimal AuthResponse', () => {
        const minimalResponse: AuthResponse = {
          success: true,
        };

        expect(isAuthResponse(minimalResponse)).toBe(true);
      });

      it('should return false for object without success field', () => {
        const invalidResponse = {
          user: { id: 'user123' },
          // missing success
        };

        expect(isAuthResponse(invalidResponse)).toBe(false);
      });

      it('should return false for null or undefined', () => {
        expect(isAuthResponse(null)).toBe(false);
        expect(isAuthResponse(undefined)).toBe(false);
      });
    });
  });

  describe('Type Definitions', () => {
    it('should allow valid SignupData', () => {
      const signupData: SignupData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        name: 'New User',
      };

      expect(signupData.email).toBe('newuser@example.com');
      expect(signupData.password).toBe('SecurePass123!');
      expect(signupData.name).toBe('New User');
    });

    it('should accept valid UserRole values', () => {
      const roles: UserRole[] = ['admin', 'moderator', 'user', 'guest'];

      roles.forEach(role => {
        expect(['admin', 'moderator', 'user', 'guest']).toContain(role);
      });
    });

    it('should accept valid AuthErrorCode values', () => {
      const errorCodes: AuthErrorCode[] = [
        'INVALID_CREDENTIALS',
        'USER_NOT_FOUND',
        'EMAIL_ALREADY_EXISTS',
        'WEAK_PASSWORD',
        'INVALID_EMAIL',
        'TOKEN_EXPIRED',
        'INVALID_TOKEN',
        'UNAUTHORIZED',
        'SERVER_ERROR',
        'NETWORK_ERROR',
      ];

      expect(errorCodes).toHaveLength(10);
    });
  });

  describe('AuthUser Interface', () => {
    it('should create valid AuthUser instance', () => {
      const user: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date('2026-01-01'),
        emailVerified: true,
        roles: ['user'],
      };

      expect(user.id).toBe('user-123');
      expect(user.email).toBe('test@example.com');
      expect(user.emailVerified).toBe(true);
      expect(user.roles).toContain('user');
    });
  });

  describe('AuthResponse Interface', () => {
    it('should create successful response', () => {
      const response: AuthResponse = {
        success: true,
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      expect(response.success).toBe(true);
      expect(response.accessToken).toBe('token');
    });

    it('should create failed response with error', () => {
      const response: AuthResponse = {
        success: false,
        error: 'Login failed',
        errorCode: 'INVALID_CREDENTIALS',
      };

      expect(response.success).toBe(false);
      expect(response.errorCode).toBe('INVALID_CREDENTIALS');
    });
  });
});
