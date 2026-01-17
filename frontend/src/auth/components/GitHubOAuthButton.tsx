import { useState } from 'react';
import { cn } from '../../lib/utils';

export interface GitHubOAuthButtonProps {
  /** Optional CSS class name */
  className?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Callback when OAuth flow starts */
  onOAuthStart?: () => void;
  /** Callback when OAuth flow completes with error */
  onOAuthError?: (error: string) => void;
}

/**
 * GitHub OAuth Sign In Button Component
 * Handles the GitHub OAuth authentication flow
 */
export function GitHubOAuthButton({
  className,
  disabled = false,
  onOAuthStart,
  onOAuthError,
}: GitHubOAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGitHubLogin = async () => {
    try {
      setIsLoading(true);
      onOAuthStart?.();

      // Get OAuth configuration from backend
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      
      // Generate random state for CSRF protection
      const state = generateRandomState();
      sessionStorage.setItem('oauth_state', state);

      // Redirect to GitHub OAuth authorization
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      
      if (!clientId) {
        throw new Error('GitHub OAuth client ID not configured');
      }

      const redirectUri = `${window.location.origin}/auth/github/callback`;
      const scope = 'read:user user:email';
      
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
      
      // Redirect to GitHub
      window.location.href = githubAuthUrl;
    } catch (error) {
      setIsLoading(false);
      const message = error instanceof Error ? error.message : 'OAuth initialization failed';
      onOAuthError?.(message);
      console.error('GitHub OAuth error:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGitHubLogin}
      disabled={disabled || isLoading}
      className={cn(
        'w-full flex items-center justify-center gap-3 px-4 py-3',
        'rounded-lg font-medium text-white transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'bg-gray-900 hover:bg-gray-800 focus:ring-gray-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isLoading && 'animate-pulse',
        className,
      )}
      aria-label="Sign in with GitHub"
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span>Connecting to GitHub...</span>
        </>
      ) : (
        <>
          <GitHubIcon />
          <span>Sign in with GitHub</span>
        </>
      )}
    </button>
  );
}

/**
 * GitHub Logo SVG Icon
 */
function GitHubIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Loading Spinner SVG
 */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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

/**
 * Generate a random state string for CSRF protection
 */
function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
