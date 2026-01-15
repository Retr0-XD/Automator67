import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('displays the app title', () => {
    render(<App />);
    expect(screen.getByText('Automator67')).toBeInTheDocument();
  });

  it('displays the tagline', () => {
    render(<App />);
    expect(screen.getByText('Democratizing Cloud Computing')).toBeInTheDocument();
  });

  it('displays Sign In tab by default', () => {
    render(<App />);
    const signInButtons = screen.getAllByRole('button', { name: /sign in/i });
    expect(signInButtons.length).toBeGreaterThan(0);
  });

  it('displays the login form by default', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });
});
