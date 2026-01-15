import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DashboardLayout } from './DashboardLayout';

describe('DashboardLayout', () => {
  it('renders without crashing', () => {
    render(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );
  });

  it('displays the app name', () => {
    render(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Automator67')).toBeInTheDocument();
  });

  it('displays Local Mode indicator', () => {
    render(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Local Mode')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('displays header with Dashboard title', () => {
    render(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays version number', () => {
    render(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('displays settings button', () => {
    render(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    );
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });
});
