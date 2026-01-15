import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import type { GitHubOAuthCallback } from '../types';

export interface GitHubCallbackHandlerProps {
  /** Callback when authentication succeeds */
  onSuccess?: () => void;
  /** Callback when authentication fails */
  onError?: (error: string) => void;
}

/**
 * GitHub OAuth Callback Handler Component
 * Processes the OAuth callback from GitHub and completes authentication
 */
export function GitHubCallbackHandler({ onSuccess, onError }: GitHubCallbackHandlerProps) {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { login } = useAuthStore();

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Parse URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        // Check for OAuth errors
        if (error) {
          throw new Error(`GitHub OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received from GitHub');
        }

        // Verify state to prevent CSRF attacks
        const savedState = sessionStorage.getItem('oauth_state');
        if (state && savedState && state !== savedState) {
          throw new Error('OAuth state mismatch - possible CSRF attack');
        }

        // Clear saved state
        sessionStorage.removeItem('oauth_state');

        // Exchange code for tokens via backend
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${apiBaseUrl}/api/auth/github/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state } as GitHubOAuthCallback),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'OAuth callback failed');
        }

        const data = await response.json();

        if (!data.success || !data.user || !data.accessToken) {
          throw new Error(data.error || 'Invalid OAuth response');
        }

        // Update auth store with user data
        login(data.user, data.accessToken, data.refreshToken || '');

        setStatus('success');
        onSuccess?.();

        // Redirect to home after short delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        setErrorMessage(message);
        setStatus('error');
        onError?.(message);
        console.error('OAuth callback error:', err);

        // Redirect to login after delay
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    processOAuthCallback();
  }, [login, onSuccess, onError]);

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Completing authentication...
          </h2>
          <p className="mt-2 text-sm text-gray-600">Please wait while we sign you in</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Authentication successful!</h2>
          <p className="mt-2 text-sm text-gray-600">Redirecting you to the dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Authentication failed</h2>
        <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
        <p className="mt-4 text-xs text-gray-500">Redirecting you back to login...</p>
      </div>
    </div>
  );
}

/**
 * Loading Spinner Component
 */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-12 w-12 text-blue-600 mx-auto"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
