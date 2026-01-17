import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import type { ReactNode } from 'react';
import { DashboardLayout } from './DashboardLayout';

function renderWithRouter(ui: ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('DashboardLayout', () => {
  it('renders without crashing', () => {
    renderWithRouter(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );
  });

  it('displays the app name', () => {
    renderWithRouter(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Automator67')).toBeInTheDocument();
  });

  it('displays Local Mode indicator', () => {
    renderWithRouter(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Local Mode')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderWithRouter(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('uses default title when not provided', () => {
    renderWithRouter(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('uses custom title when provided', () => {
    renderWithRouter(
      <DashboardLayout title="Custom Title">
        <div>Test content</div>
      </DashboardLayout>
    );
    expect(screen.getByRole('heading', { name: 'Custom Title' })).toBeInTheDocument();
  });
});
