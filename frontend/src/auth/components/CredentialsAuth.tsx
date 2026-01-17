import { useState } from 'react';
import { authApi, ApiError } from '../../api/authClient';
import { useAuthStore } from '../../store/authStore';
import type { AuthCredentials, SignupData } from '../types';

interface CredentialsAuthProps {
  onBack: () => void;
}

type AuthMode = 'login' | 'signup';

type FormState = AuthCredentials & { confirmPassword: string };

const INITIAL_FORM: FormState = {
  email: '',
  password: '',
  confirmPassword: '',
};

export function CredentialsAuth({ onBack }: CredentialsAuthProps) {
  const { login: setAuth, setError, setLoading, isLoading } = useAuthStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): string | null => {
    if (!form.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address';
    if (!form.password || form.password.length < 8) return 'Password must be at least 8 characters';
    if (mode === 'signup' && form.password !== form.confirmPassword) {
      return 'Passwords must match';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const validationError = validate();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      if (mode === 'login') {
        const response = await authApi.login({ email: form.email.trim(), password: form.password });
        const token = response.token || response.accessToken || '';
        setAuth(response.user, token, response.refreshToken || token);
      } else {
        const signupPayload: SignupData = {
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        };

        const response = await authApi.signup(signupPayload);
        const token = response.token || response.accessToken || '';
        setAuth(response.user, token, response.refreshToken || token);
      }
    } catch (error) {
      const apiError = error as ApiError;
      setMessage(apiError instanceof ApiError ? apiError.message : 'Authentication failed');
      setError(apiError instanceof ApiError ? apiError.errorCode : 'UNKNOWN_ERROR');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Automator67</h1>
          <p className="text-gray-600">Cloud Mode - {mode === 'login' ? 'Sign In' : 'Create Account'}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div className="flex gap-2 justify-center" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                mode === 'login'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
              aria-selected={mode === 'login'}
              onClick={() => setMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
              aria-selected={mode === 'signup'}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
                autoComplete="email"
                className="mt-1 block w-full rounded-lg border px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting || isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="mt-1 block w-full rounded-lg border px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting || isLoading}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  required
                  autoComplete="new-password"
                  className="mt-1 block w-full rounded-lg border px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting || isLoading}
                />
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : mode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to mode selection
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CredentialsAuth;
