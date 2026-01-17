import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';

const SidebarWithRouter = () => (
  <MemoryRouter>
    <DashboardLayout>
      <div>Test Content</div>
    </DashboardLayout>
  </MemoryRouter>
);

// Note: This test file is deprecated. The Sidebar component has been consolidated into DashboardLayout.
// Tests have been updated to use DashboardLayout.

describe('Sidebar (Deprecated - Consolidated into DashboardLayout)', () => {
  it('renders without crashing', () => {
    render(<SidebarWithRouter />);
  });

  it('displays app name', () => {
    render(<SidebarWithRouter />);
    expect(screen.getByText('Automator67')).toBeInTheDocument();
  });

  it('displays Local Mode indicator', () => {
    render(<SidebarWithRouter />);
    expect(screen.getByText('Local Mode')).toBeInTheDocument();
  });

  it('displays all navigation items', () => {
    render(<SidebarWithRouter />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Nodes')).toBeInTheDocument();
    expect(screen.getByText('Deployments')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    render(<SidebarWithRouter />);
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('displays version number', () => {
    render(<SidebarWithRouter />);
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('displays settings and mode buttons', () => {
    render(<SidebarWithRouter />);
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to mode/i })).toBeInTheDocument();
  });
});
