import { useState } from 'react';
import './App.css';
import { GitHubOAuthButton } from './auth/components/GitHubOAuthButton';
import { GitHubCallbackHandler } from './auth/components/GitHubCallbackHandler';
import { useAuthStore } from './store/authStore';

function App() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Check if this is an OAuth callback
  const isOAuthCallback = window.location.pathname === '/auth/github/callback';

  if (isOAuthCallback) {
    return (
      <GitHubCallbackHandler
        onError={(error) => {
          setOauthError(error);
        }}
      />
    );
  }


  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Automator67</h1>
            <div className="mt-4 flex items-center justify-center gap-3">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-full border-2 border-gray-200"
                />
              )}
              <div className="text-left">
                <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600">@{user.githubUsername}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 text-center">✅ GitHub OAuth is working!</p>
            <p className="text-xs text-blue-600 mt-2 text-center">
              Dashboard UI coming in Milestone 1.3
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full py-2 px-4 border border-transparent rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Automator67</h1>
          <p className="text-gray-600">Democratizing Cloud Computing</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-gray-900">
              Sign in to your account
            </h2>
            <p className="text-center text-sm text-gray-600">
              Authenticate securely with your GitHub account
            </p>
            
            <GitHubOAuthButton
              onOAuthError={(error) => setOauthError(error)}
            />
            
            {oauthError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{oauthError}</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">
            Phase 1: GitHub OAuth Authentication ✅
          </p>
          <p className="text-xs text-gray-400">
            Secure, password-less authentication via GitHub
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
