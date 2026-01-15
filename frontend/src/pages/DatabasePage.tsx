import { DashboardLayout } from '../components/layout/DashboardLayout';

export function DatabasePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database</h1>
          <p className="text-gray-600 mt-2">Query your distributed databases</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">No databases configured</h3>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            Connect database nodes to query across MongoDB, PostgreSQL, and other providers.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
