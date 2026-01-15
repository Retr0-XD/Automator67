import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GitHubOAuthButton } from './GitHubOAuthButton';

describe('GitHubOAuthButton', () => {
  const originalLocation = window.location;
  
  beforeEach(() => {
    // Reset env vars before each test
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_GITHUB_CLIENT_ID', 'test-client-id');
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000');

    // Mock window.location
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;
    
    // Mock sessionStorage
    vi.spyOn(Storage.prototype, 'setItem');
    vi.spyOn(Storage.prototype, 'getItem');
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('renders the button with GitHub icon', () => {
    render(<GitHubOAuthButton />);
    const button = screen.getByRole('button', { name: /sign in with github/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Sign in with GitHub');
  });

  it('is disabled when disabled prop is true', () => {
    render(<GitHubOAuthButton disabled />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('redirects to GitHub OAuth when clicked', async () => {
    const onOAuthStart = vi.fn();
    render(<GitHubOAuthButton onOAuthStart={onOAuthStart} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onOAuthStart).toHaveBeenCalled();
      expect(sessionStorage.setItem).toHaveBeenCalledWith('oauth_state', expect.any(String));
      expect(window.location.href).toContain('https://github.com/login/oauth/authorize');
      expect(window.location.href).toContain('client_id=test-client-id');
    });
  });

  it('shows loading state during OAuth flow', async () => {
    render(<GitHubOAuthButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Button should show loading state briefly
    await waitFor(() => {
      expect(button).toHaveTextContent('Connecting to GitHub...');
    });
  });

  it('calls onOAuthError when client ID is missing', async () => {
    vi.stubEnv('VITE_GITHUB_CLIENT_ID', '');
    
    const onOAuthError = vi.fn();
    render(<GitHubOAuthButton onOAuthError={onOAuthError} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onOAuthError).toHaveBeenCalledWith('GitHub OAuth client ID not configured');
    });
  });

  it('includes correct OAuth parameters in redirect URL', async () => {
    render(<GitHubOAuthButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const href = window.location.href;
      expect(href).toContain('scope=read%3Auser%20user%3Aemail');
      expect(href).toContain('redirect_uri=');
      expect(href).toContain('state=');
    });
  });

  it('generates unique state for each OAuth flow', async () => {
    const states = new Set<string>();
    
    for (let i = 0; i < 3; i++) {
      const { unmount } = render(<GitHubOAuthButton />);
      const button = screen.getByRole('button');
      
      // Clear previous calls
      vi.mocked(sessionStorage.setItem).mockClear();
      
      fireEvent.click(button);
      
      await waitFor(() => {
        const calls = vi.mocked(sessionStorage.setItem).mock.calls;
        const stateCall = calls.find(call => call[0] === 'oauth_state');
        if (stateCall) {
          states.add(stateCall[1] as string);
        }
      });
      
      unmount();
    }
    
    expect(states.size).toBe(3); // Each state should be unique
  });

  it('applies custom className', () => {
    render(<GitHubOAuthButton className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});
