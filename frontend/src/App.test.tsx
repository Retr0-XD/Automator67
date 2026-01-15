import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    // Ensure we render the main login view (not the OAuth callback)
    window.history.pushState({}, '', '/');
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('displays the app title', () => {
    render(<App />);
    expect(screen.getByText('Automator67')).toBeInTheDocument();
  });

  it('shows mode selection by default', () => {
    render(<App />);
    expect(screen.getByText('Local Mode')).toBeInTheDocument();
    expect(screen.getByText('Cloud Mode')).toBeInTheDocument();
  });

  it('shows local mode button', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /use local mode/i });
    expect(button).toBeInTheDocument();
  });

  it('shows cloud mode button', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /use cloud mode/i });
    expect(button).toBeInTheDocument();
  });
});
