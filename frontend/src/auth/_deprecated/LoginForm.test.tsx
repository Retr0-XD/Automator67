import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm Component', () => {
  describe('Rendering', () => {
    it('should render email input field', () => {
      const mockSubmit = vi.fn();
      render(<LoginForm onSubmit={mockSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should render password input field', () => {
      const mockSubmit = vi.fn();
      render(<LoginForm onSubmit={mockSubmit} />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should render sign in button', () => {
      const mockSubmit = vi.fn();
      render(<LoginForm onSubmit={mockSubmit} />);

      const button = screen.getByRole('button', { name: /sign in/i });
      expect(button).toBeInTheDocument();
    });

    it('should render sign up link', () => {
      const mockSubmit = vi.fn();
      render(<LoginForm onSubmit={mockSubmit} />);

      const link = screen.getByRole('link', { name: /sign up/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/signup');
    });
  });

  describe('Props', () => {
    it('should apply custom className', () => {
      const mockSubmit = vi.fn();
      const { container } = render(
        <LoginForm onSubmit={mockSubmit} className="custom-class" />
      );

      const form = container.querySelector('form');
      expect(form).toHaveClass('custom-class');
    });

    it('should disable form when disabled prop is true', () => {
      const mockSubmit = vi.fn();
      render(<LoginForm onSubmit={mockSubmit} disabled={true} />);

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const button = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement;

      expect(emailInput.disabled).toBe(true);
      expect(passwordInput.disabled).toBe(true);
      expect(button.disabled).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      const mockSubmit = vi.fn();
      render(<LoginForm onSubmit={mockSubmit} />);

      const emailLabel = screen.getByText(/email address/i);
      const emailInput = screen.getByLabelText(/email address/i);

      expect(emailLabel.tagName).toBe('LABEL');
      expect(emailInput).toBeInTheDocument();
    });

    it('should use semantic form element', () => {
      const mockSubmit = vi.fn();
      const { container } = render(<LoginForm onSubmit={mockSubmit} />);

      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form).toHaveAttribute('novalidate');
    });

    it('should have properly labeled inputs with ids', () => {
      const mockSubmit = vi.fn();
      render(<LoginForm onSubmit={mockSubmit} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('id', 'email');
      expect(passwordInput).toHaveAttribute('id', 'password');
    });
  });
});
