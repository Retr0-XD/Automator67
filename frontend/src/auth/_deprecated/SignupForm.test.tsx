/**
 * Tests for SignupForm component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SignupForm } from './SignupForm';

describe('SignupForm component', () => {
  it('should render all form inputs', () => {
    const mockOnSubmit = vi.fn();
    render(<SignupForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('should render submit button', () => {
    const mockOnSubmit = vi.fn();
    render(<SignupForm onSubmit={mockOnSubmit} />);

    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should render password requirements', () => {
    const mockOnSubmit = vi.fn();
    render(<SignupForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText(/password must contain:/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/number/i)).toBeInTheDocument();
    expect(screen.getByText(/special character/i)).toBeInTheDocument();
  });

  it('should render terms and conditions', () => {
    const mockOnSubmit = vi.fn();
    render(<SignupForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText(/by signing up/i)).toBeInTheDocument();
    expect(screen.getByText(/terms of service/i)).toBeInTheDocument();
    expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    const mockOnSubmit = vi.fn();
    const { container } = render(
      <SignupForm onSubmit={mockOnSubmit} className="custom-class" />
    );

    const form = container.querySelector('form');
    expect(form).toHaveClass('custom-class');
  });

  it('should have disabled state', () => {
    const mockOnSubmit = vi.fn();
    render(<SignupForm onSubmit={mockOnSubmit} disabled={true} />);

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    expect(submitButton).toBeDisabled();
  });

  it('should have proper form attributes', () => {
    const mockOnSubmit = vi.fn();
    const { container } = render(<SignupForm onSubmit={mockOnSubmit} />);

    const form = container.querySelector('form');
    expect(form).toHaveAttribute('noValidate');
  });

  it('should have proper label associations', () => {
    const mockOnSubmit = vi.fn();
    render(<SignupForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/full name/i)).toHaveAttribute('id', 'name');
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('id', 'email');
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('id', 'password');
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('id', 'confirmPassword');
  });

  it('should render form with max-width class', () => {
    const mockOnSubmit = vi.fn();
    const { container } = render(<SignupForm onSubmit={mockOnSubmit} />);

    const form = container.querySelector('form');
    expect(form).toHaveClass('max-w-md');
  });
});
