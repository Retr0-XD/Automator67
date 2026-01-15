import { useState } from 'react';
import './App.css';
import { LoginForm } from './auth/components/LoginForm';
import { SignupForm } from './auth/components/SignupForm';
import { useAuthStore } from './store/authStore';
import type { AuthCredentials, SignupData } from './auth/types';

function App() {
  const [showSignup, setShowSignup] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const handleLogin = async (credentials: AuthCredentials) => {
    // TODO: Replace with actual API call
    console.log('Login attempt:', credentials);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Mock successful login
    const mockUser = {
      id: '1',
      email: credentials.email,
      name: 'Demo User',
      emailVerified: false,
      roles: ['user' as const],
      createdAt: new Date(),
    };
    login(mockUser, 'mock-access-token', 'mock-refresh-token');
  };

  const handleSignup = async (data: SignupData) => {
    // TODO: Replace with actual API call
    console.log('Signup attempt:', data);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Mock successful signup
    const mockUser = {
      id: '1',
      email: data.email,
      name: data.name,
      emailVerified: false,
      roles: ['user' as const],
      createdAt: new Date(),
    };
    login(mockUser, 'mock-access-token', 'mock-refresh-token');
  };

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Automator67</h1>
            <p className="mt-2 text-gray-600">You are logged in as:</p>
            <p className="mt-1 text-lg font-semibold text-blue-600">{user.email}</p>
            <p className="mt-1 text-sm text-gray-500">Name: {user.name}</p>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 text-center">
              ✅ Authentication system is working!
            </p>
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
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setShowSignup(false)}
              className={`flex-1 py-2 text-center font-medium transition-colors ${
                !showSignup
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setShowSignup(true)}
              className={`flex-1 py-2 text-center font-medium transition-colors ${
                showSignup
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {showSignup ? (
            <SignupForm onSubmit={handleSignup} />
          ) : (
            <LoginForm onSubmit={handleLogin} />
          )}
        </div>

        <p className="text-center text-sm text-gray-500">
          Phase 1: Authentication Complete ✅
        </p>
      </div>
    </div>
  );
}

export default App;
