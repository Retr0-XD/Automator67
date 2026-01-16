import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../../store/authStore';

// Mock the auth store
const mockUseAuthStore = useAuthStore as any;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders children in local mode', () => {
    localStorage.setItem('automator67_mode', 'local');
    
    render(
      <BrowserRouter>
        <ProtectedRoute mode="local">
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects when mode does not match', () => {
    localStorage.setItem('automator67_mode', 'local');
    
    const { container } = render(
      <BrowserRouter>
        <ProtectedRoute mode="cloud">
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    // Should not render the protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects in cloud mode when not authenticated', () => {
    localStorage.setItem('automator67_mode', 'cloud');
    
    render(
      <BrowserRouter>
        <ProtectedRoute mode="cloud">
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    // Should not render the protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
