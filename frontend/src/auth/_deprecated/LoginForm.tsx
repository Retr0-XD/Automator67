import React from 'react';
import { useLoginForm } from '../hooks/useLoginForm';
import type { AuthCredentials } from '../types';
import { cn } from '../../lib/utils';

/**
 * Login form component props
 */
interface LoginFormProps {
  /** Callback function executed when form is submitted with valid data */
  onSubmit: (data: AuthCredentials) => Promise<void>;
  /** Whether to disable the form */
  disabled?: boolean;
  /** Additional CSS classes for the form wrapper */
  className?: string;
}

/**
 * Login form component with email and password validation
 *
 * Provides a complete login form with:
 * - Email and password input fields
 * - Real-time validation feedback
 * - Error display
 * - Loading states
 * - Accessibility features (ARIA labels, semantic HTML)
 * - Responsive Tailwind CSS styling
 *
 * @component
 * @example
 * ```tsx
 * <LoginForm
 *   onSubmit={async (data) => {
 *     // Call authentication API
 *     await loginUser(data);
 *   }}
 * />
 * ```
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  disabled = false,
  className,
}) => {
  const {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useLoginForm();

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={cn('w-full max-w-md space-y-4', className)}
    >
      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled || isSubmitting}
          aria-invalid={touched.email && !!errors.email}
          aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
          className={cn(
            'mt-1 block w-full rounded-lg border px-4 py-2 text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
            touched.email && errors.email
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          )}
          placeholder="you@example.com"
        />
        {touched.email && errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-500">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password Input */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled || isSubmitting}
          aria-invalid={touched.password && !!errors.password}
          aria-describedby={
            touched.password && errors.password ? 'password-error' : undefined
          }
          className={cn(
            'mt-1 block w-full rounded-lg border px-4 py-2 text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
            touched.password && errors.password
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          )}
          placeholder="••••••••"
        />
        {touched.password && errors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-500">
            {errors.password}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={disabled || isSubmitting}
        className={cn(
          'w-full rounded-lg px-4 py-2 font-medium text-white',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          disabled || isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
        )}
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>

      {/* Sign Up Link */}
      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
          Sign up
        </a>
      </p>
    </form>
  );
};

export default LoginForm;
