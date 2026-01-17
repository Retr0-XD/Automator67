import { useState, useCallback } from 'react';
import type { AuthCredentials } from '../types';

/**
 * Validation error messages for login form fields
 */
interface ValidationErrors {
  email?: string;
  password?: string;
}

/**
 * Login form state interface
 */
interface LoginFormState {
  email: string;
  password: string;
}

/**
 * Custom hook for managing login form state and validation
 *
 * Provides form state management, field validation, error handling,
 * and submit handler creation for a login form.
 *
 * @returns {Object} Form state and handlers
 * @returns {LoginFormState} formData - Current form values
 * @returns {ValidationErrors} errors - Current validation errors
 * @returns {Record<string, boolean>} touched - Which fields have been touched
 * @returns {boolean} isSubmitting - Whether form is currently submitting
 * @returns {Function} handleChange - Input change handler
 * @returns {Function} handleBlur - Input blur handler for touch tracking
 * @returns {Function} handleSubmit - Returns a submit handler function
 * @returns {Function} resetForm - Reset form to initial state
 * @returns {Function} validateForm - Validate all fields
 * @returns {Function} getLoginData - Get current form data as AuthCredentials
 */
export const useLoginForm = () => {
  const [formData, setFormData] = useState<LoginFormState>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate email format
   */
  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }
    // RFC 5322 simplified email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  }, []);

  /**
   * Validate password field
   */
  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return undefined;
  }, []);

  /**
   * Validate all form fields
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.email, formData.password, validateEmail, validatePassword]);

  /**
   * Handle input change events
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  }, [errors]);

  /**
   * Handle input blur events - mark field as touched
   */
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  /**
   * Create a submit handler function
   * @param onSubmit - Callback function to execute when form is valid
   * @returns Form submit handler
   */
  const handleSubmit = (onSubmit: (data: AuthCredentials) => Promise<void>) => {
    return async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(getLoginData());
      } finally {
        setIsSubmitting(false);
      }
    };
  };

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData({
      email: '',
      password: '',
    });
    setErrors({});
    setTouched({});
  }, []);

  /**
   * Get current form data as AuthCredentials
   */
  const getLoginData = useCallback((): AuthCredentials => {
    return {
      email: formData.email.trim(),
      password: formData.password,
    };
  }, [formData]);

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
    getLoginData,
  };
};
