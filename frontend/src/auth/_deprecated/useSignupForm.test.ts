/**
 * Tests for useSignupForm hook
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSignupForm } from './useSignupForm';

describe('useSignupForm hook', () => {
  it('should initialize with empty form state', () => {
    const { result } = renderHook(() => useSignupForm());

    expect(result.current.formData.name).toBe('');
    expect(result.current.formData.email).toBe('');
    expect(result.current.formData.password).toBe('');
    expect(result.current.formData.confirmPassword).toBe('');
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should update form data on change', () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.email).toBe('test@example.com');
  });

  it('should handle blur events for tracking touched fields', () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.handleBlur({
        target: { name: 'email' },
      } as React.FocusEvent<HTMLInputElement>);
    });

    expect(result.current.touched.email).toBe(true);
  });

  it('should reset form to initial state', () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.email).toBe('test@example.com');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData.email).toBe('');
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('should validate required fields', () => {
    const { result } = renderHook(() => useSignupForm());

    let isValid = false;
    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid).toBe(false);
    expect(result.current.errors.name).toBe('Name is required');
    expect(result.current.errors.email).toBe('Email is required');
    expect(result.current.errors.password).toBe('Password is required');
    expect(result.current.errors.confirmPassword).toBe('Please confirm your password');
  });

  it('should return signup data', () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe' },
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: 'email', value: 'john@example.com' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    const data = result.current.getSignupData();
    expect(data.name).toBe('John Doe');
    expect(data.email).toBe('john@example.com');
  });

  it('should have all validation methods', () => {
    const { result } = renderHook(() => useSignupForm());

    expect(typeof result.current.validateForm).toBe('function');
    expect(typeof result.current.handleChange).toBe('function');
    expect(typeof result.current.handleBlur).toBe('function');
    expect(typeof result.current.getSignupData).toBe('function');
    expect(typeof result.current.resetForm).toBe('function');
    expect(typeof result.current.handleSubmit).toBe('function');
  });

  it('should create submit handler function', () => {
    const { result } = renderHook(() => useSignupForm());
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

    const submitHandler = result.current.handleSubmit(mockOnSubmit);
    expect(typeof submitHandler).toBe('function');
  });
});
