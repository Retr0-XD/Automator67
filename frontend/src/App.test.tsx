import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('displays the React logo', () => {
    render(<App />);
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });
});
