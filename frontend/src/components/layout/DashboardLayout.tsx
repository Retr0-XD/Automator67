import { ReactNode } from 'react';

export interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Main dashboard layout with sidebar and header
 * Used for all authenticated pages in local or cloud mode
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar will go here */}
        <aside className="w-64 bg-white border-r border-gray-200">
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Automator67</h1>
              <p className="text-xs text-gray-500 mt-1">Local Mode</p>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {/* Navigation items will go here */}
            </nav>
            
            {/* Footer */}
            <div className="px-4 py-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                v1.0.0
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header will go here */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
              <div className="flex items-center gap-4">
                <button className="text-sm text-gray-600 hover:text-gray-900">
                  Settings
                </button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
