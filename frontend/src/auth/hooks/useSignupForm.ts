/**
 * Custom hook for signup form state and validation
 */
import { useState, useCallback } from 'react';
import type { SignupData } from '../types';

/**
 * Validation error object
 */
export interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
}

/**
 * Signup form state
 */
export interface SignupFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Custom hook for managing signup form state and validation
 * @returns Form state, errors, handlers, and validation status
 */
export function useSignupForm() {
  const [formData, setFormData] = useState<SignupFormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Validate email format
   */
  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  }, []);

  /**
   * Validate password strength
   */
  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return undefined;
  }, []);

  /**
   * Validate confirm password
   */
  const validateConfirmPassword = useCallback(
    (confirmPassword: string, password: string): string | undefined => {
      if (!confirmPassword) {
        return 'Please confirm your password';
      }
      if (confirmPassword !== password) {
        return 'Passwords do not match';
      }
      return undefined;
    },
    []
  );

  /**
   * Validate name
   */
  const validateName = useCallback((name: string): string | undefined => {
    if (!name) {
      return 'Name is required';
    }
    if (name.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (name.length > 100) {
      return 'Name must not exceed 100 characters';
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    return undefined;
  }, []);

  /**
   * Validate entire form
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(
      formData.confirmPassword,
      formData.password
    );
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    formData,
    validateName,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
  ]);

  /**
   * Handle input change
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));

      // Clear error for this field
      if (errors[name as keyof ValidationErrors]) {
        setErrors(prev => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  /**
   * Handle field blur
   */
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  /**
   * Get signup data
   */
  const getSignupData = useCallback((): SignupData => {
    return {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };
  }, [formData]);

  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
    setTouched({});
  }, []);

  /**
   * Handle submit
   */
  const handleSubmit = useCallback(
    (onSubmit: (data: SignupData) => Promise<void>) => {
      return async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
          return;
        }

        setIsSubmitting(true);
        try {
          await onSubmit(getSignupData());
        } finally {
          setIsSubmitting(false);
        }
      };
    },
    [validateForm, getSignupData]
  );

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    validateForm,
    getSignupData,
  };
}
