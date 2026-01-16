import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { GitHubCallbackHandler } from './auth/components/GitHubCallbackHandler';
import { GitHubOAuthButton } from './auth/components/GitHubOAuthButton';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DatabasePage } from './pages/DatabasePage';
import { DashboardPage } from './pages/DashboardPage';
import { DeploymentsPage } from './pages/DeploymentsPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { NodesPage } from './pages/NodesPage';
import { StoragePage } from './pages/StoragePage';
import { useAuthStore } from './store/authStore';

type Mode = 'local' | 'cloud' | null;

const MODE_KEY = 'automator67_mode';

function ModeSelector({ onLocal, onCloud }: { onLocal: () => void; onCloud: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Automator67</h1>
          <p className="text-gray-600">Democratizing Cloud Computing</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-8 border-2 border-green-200 hover:border-green-400 transition-colors">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
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
                onClick={onLocal}
                className="w-full py-2 px-4 border border-transparent rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Use Local Mode
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 border-2 border-blue-200 hover:border-blue-400 transition-colors">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
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
                onClick={onCloud}
                className="w-full py-2 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Use Cloud Mode
              </button>
            </div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs text-gray-400">Both modes are fully user-owned. No centralized services.</p>
        </div>
      </div>
    </div>
  );
}

function DashboardRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <DashboardLayout title="Dashboard">
            <DashboardPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/nodes"
        element={
          <DashboardLayout title="Nodes">
            <NodesPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/deployments"
        element={
          <DashboardLayout title="Deployments">
            <DeploymentsPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/database"
        element={
          <DashboardLayout title="Database">
            <DatabasePage />
          </DashboardLayout>
        }
      />
      <Route
        path="/storage"
        element={
          <DashboardLayout title="Storage">
            <StoragePage />
          </DashboardLayout>
        }
      />
      <Route
        path="/monitoring"
        element={
          <DashboardLayout title="Monitoring">
            <MonitoringPage />
          </DashboardLayout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);

  const isOAuthCallback = window.location.pathname === '/auth/github/callback';

  useEffect(() => {
    const savedMode = localStorage.getItem(MODE_KEY) as Mode;
    if (savedMode === 'local' || savedMode === 'cloud') {
      setMode(savedMode);
    }
  }, []);

  const handleLocalMode = () => {
    localStorage.setItem(MODE_KEY, 'local');
    setMode('local');
  };

  const handleCloudMode = () => {
    localStorage.setItem(MODE_KEY, 'cloud');
    setMode('cloud');
  };

  const handleResetMode = () => {
    localStorage.removeItem(MODE_KEY);
    setMode(null);
    logout();
  };

  if (isOAuthCallback) {
    return <GitHubCallbackHandler onError={(error) => setOauthError(error)} />;
  }

  if (mode === null) {
    return <ModeSelector onLocal={handleLocalMode} onCloud={handleCloudMode} />;
  }

  if (mode === 'local') {
    return (
      <Router>
        <DashboardRoutes />
      </Router>
    );
  }

  if (mode === 'cloud' && isAuthenticated && user) {
    return (
      <Router>
        <DashboardRoutes />
      </Router>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Automator67</h1>
          <p className="text-gray-600">Cloud Mode - Authentication Required</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-gray-900">Sign in with GitHub</h2>
            <p className="text-center text-sm text-gray-600">Connect to your self-hosted backend</p>

            <GitHubOAuthButton onOAuthError={(error) => setOauthError(error)} />

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
          <p className="text-xs text-gray-400">Requires your own GitHub OAuth app + backend deployment</p>
        </div>
      </div>
    </div>
  );
}

export default App;
