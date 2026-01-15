import { useState, useEffect } from 'react';
import './App.css';
import { GitHubOAuthButton } from './auth/components/GitHubOAuthButton';
import { GitHubCallbackHandler } from './auth/components/GitHubCallbackHandler';
import { useAuthStore } from './store/authStore';

function App() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [localMode, setLocalMode] = useState<boolean>(false);
  const [showAuthChoice, setShowAuthChoice] = useState<boolean>(true);

  // Check if this is an OAuth callback
  const isOAuthCallback = window.location.pathname === '/auth/github/callback';
  
  // Check if user previously chose local mode
  useEffect(() => {
    const savedMode = localStorage.getItem('automator67_mode');
    if (savedMode === 'local') {
      setLocalMode(true);
      setShowAuthChoice(false);
    }
  }, []);

  const handleLocalMode = () => {
    localStorage.setItem('automator67_mode', 'local');
    setLocalMode(true);
    setShowAuthChoice(false);
  };

  const handleCloudMode = () => {
    localStorage.setItem('automator67_mode', 'cloud');
    setShowAuthChoice(false);
  };

  const handleResetMode = () => {
    localStorage.removeItem('automator67_mode');
    setLocalMode(false);
    setShowAuthChoice(true);
    logout();
  };

  if (isOAuthCallback) {
    return (
      <GitHubCallbackHandler
        onError={(error) => {
          setOauthError(error);
        }}
      />
    );
  }

  // Local mode - no auth required
  if (localMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Automator67</h1>
            <p className="mt-2 text-gray-600">Running in Local Mode</p>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 text-center">✅ Local mode active</p>
            <p className="text-xs text-green-600 mt-2 text-center">
              All data stored locally on your device. No cloud sync.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => alert('Dashboard coming in Milestone 1.3!')}
              className="w-full py-2 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Open Dashboard
            </button>
            
            <button
              onClick={handleResetMode}
              className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Switch to Cloud Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cloud mode with authentication
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
            <p className="text-sm text-blue-800 text-center">✅ Cloud sync enabled</p>
            <p className="text-xs text-blue-600 mt-2 text-center">
              Your data syncs across devices via your backend
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => alert('Dashboard coming in Milestone 1.3!')}
              className="w-full py-2 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Open Dashboard
            </button>
            
            <button
              onClick={logout}
              className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show mode choice screen
  if (showAuthChoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Automator67</h1>
            <p className="text-gray-600">Democratizing Cloud Computing</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Local Mode */}
            <div className="bg-white rounded-lg shadow-md p-8 border-2 border-green-200 hover:border-green-400 transition-colors">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Local Mode</h2>
                <p className="text-sm text-gray-600">
                  Run completely offline. All data stored locally on your device. No account needed.
                </p>
                <ul className="text-xs text-gray-500 space-y-1 text-left">
                  <li>✅ Zero setup required</li>
                  <li>✅ Complete privacy</li>
                  <li>✅ Works offline</li>
                  <li>❌ No cross-device sync</li>
                </ul>
                <button
                  onClick={handleLocalMode}
                  className="w-full py-2 px-4 border border-transparent rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Use Local Mode
                </button>
              </div>
            </div>

            {/* Cloud Mode */}
            <div className="bg-white rounded-lg shadow-md p-8 border-2 border-blue-200 hover:border-blue-400 transition-colors">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Cloud Mode</h2>
                <p className="text-sm text-gray-600">
                  Connect to your own backend for sync and portability. Requires your own deployment.
                </p>
                <ul className="text-xs text-gray-500 space-y-1 text-left">
                  <li>✅ Sync across devices</li>
                  <li>✅ Backup & restore</li>
                  <li>✅ You own the backend</li>
                  <li>⚙️ Requires self-hosted API</li>
                </ul>
                <button
                  onClick={handleCloudMode}
                  className="w-full py-2 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Use Cloud Mode
                </button>
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-gray-400">
              Both modes are fully user-owned. No centralized services.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Cloud mode - show GitHub auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Automator67</h1>
          <p className="text-gray-600">Cloud Mode - Authentication Required</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-gray-900">
              Sign in with GitHub
            </h2>
            <p className="text-center text-sm text-gray-600">
              Connect to your self-hosted backend
            </p>
            
            <GitHubOAuthButton
              onOAuthError={(error) => setOauthError(error)}
            />
            
            {oauthError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{oauthError}</p>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleResetMode}
                className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to mode selection
              </button>
            </div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs text-gray-400">
            Requires your own GitHub OAuth app + backend deployment
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
