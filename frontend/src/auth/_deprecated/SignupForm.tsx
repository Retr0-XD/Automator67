/**
 * Signup Form Component
 * Handles user registration with validation and error handling
 */
import { cn } from '@/lib/utils';
import type { SignupData } from '../types';
import { useSignupForm } from '../hooks/useSignupForm';

/**
 * Props for SignupForm component
 */
interface SignupFormProps {
  /** Callback when form is submitted */
  onSubmit: (data: SignupData) => Promise<void>;
  /** Whether signup button should be disabled */
  disabled?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * SignupForm Component
 * Renders a signup form with validation and error handling
 */
export function SignupForm({
  onSubmit,
  disabled = false,
  className,
}: SignupFormProps) {
  const {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useSignupForm();

  const isFormDisabled = disabled || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('w-full max-w-md space-y-4', className)}
      noValidate
    >
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="John Doe"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isFormDisabled}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm transition-colors',
            'border-input bg-background placeholder-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            touched.name && errors.name && 'border-destructive ring-2 ring-destructive/20'
          )}
          aria-invalid={touched.name && !!errors.name}
          aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
        />
        {touched.name && errors.name && (
          <p id="name-error" className="mt-1 text-sm text-destructive">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="user@example.com"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isFormDisabled}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm transition-colors',
            'border-input bg-background placeholder-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            touched.email && errors.email && 'border-destructive ring-2 ring-destructive/20'
          )}
          aria-invalid={touched.email && !!errors.email}
          aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
        />
        {touched.email && errors.email && (
          <p id="email-error" className="mt-1 text-sm text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter a strong password"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isFormDisabled}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm transition-colors',
            'border-input bg-background placeholder-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            touched.password && errors.password && 'border-destructive ring-2 ring-destructive/20'
          )}
          aria-invalid={touched.password && !!errors.password}
          aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
        />
        <div className="mt-1 text-xs text-muted-foreground space-y-1">
          <p>Password must contain:</p>
          <ul className="list-inside list-disc ml-1">
            <li>At least 8 characters</li>
            <li>Uppercase letter (A-Z)</li>
            <li>Lowercase letter (a-z)</li>
            <li>Number (0-9)</li>
            <li>Special character (!@#$%^&*)</li>
          </ul>
        </div>
        {touched.password && errors.password && (
          <p id="password-error" className="mt-2 text-sm text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isFormDisabled}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm transition-colors',
            'border-input bg-background placeholder-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            touched.confirmPassword &&
              errors.confirmPassword &&
              'border-destructive ring-2 ring-destructive/20'
          )}
          aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
          aria-describedby={
            touched.confirmPassword && errors.confirmPassword
              ? 'confirmPassword-error'
              : undefined
          }
        />
        {touched.confirmPassword && errors.confirmPassword && (
          <p id="confirmPassword-error" className="mt-1 text-sm text-destructive">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isFormDisabled}
        className={cn(
          'w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground',
          'transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2',
          'focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
      </button>

      {/* Terms Agreement */}
      <p className="text-xs text-muted-foreground text-center">
        By signing up, you agree to our{' '}
        <a href="#" className="text-primary hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-primary hover:underline">
          Privacy Policy
        </a>
      </p>
    </form>
  );
}
