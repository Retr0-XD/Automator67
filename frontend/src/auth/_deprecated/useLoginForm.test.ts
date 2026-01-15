import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useLoginForm } from './useLoginForm';

describe('useLoginForm', () => {
  describe('Initial State', () => {
    it('should have empty initial form data', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.formData.email).toBe('');
      expect(result.current.formData.password).toBe('');
    });

    it('should have empty initial errors', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.errors).toEqual({});
    });

    it('should have isSubmitting as false', () => {
      const { result } = renderHook(() => useLoginForm());
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('Form Interaction', () => {
    it('should update form data on change', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.email).toBe('test@example.com');
    });

    it('should track touched fields', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleBlur({
          target: { name: 'email' },
        } as React.FocusEvent<HTMLInputElement>);
      });

      expect(result.current.touched.email).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate email format', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'invalid-email' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors.email).toBeDefined();
    });

    it('should require password', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors.password).toBe('Password is required');
    });
  });

  describe('Form Reset', () => {
    it('should reset form to initial state', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: 'password', value: 'password123' },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleBlur({
          target: { name: 'email' },
        } as React.FocusEvent<HTMLInputElement>);
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.email).toBe('');
      expect(result.current.formData.password).toBe('');
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });
  });

  describe('Utility Methods', () => {
    it('should return login data with trimmed email', () => {
      const { result } = renderHook(() => useLoginForm());

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: '  test@example.com  ' },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: 'password', value: 'password123' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      const data = result.current.getLoginData();
      expect(data.email).toBe('test@example.com');
      expect(data.password).toBe('password123');
    });

    it('should create submit handler', () => {
      const { result } = renderHook(() => useLoginForm());
      const handler = result.current.handleSubmit(async () => {
        // Mock implementation
      });
      expect(typeof handler).toBe('function');
    });
  });
});
