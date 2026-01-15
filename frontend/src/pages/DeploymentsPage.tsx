import { DashboardLayout } from '../components/layout/DashboardLayout';

export function DeploymentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deployments</h1>
          <p className="text-gray-600 mt-2">Deploy and manage your applications</p>
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">No deployments</h3>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            Deploy applications across your nodes with automatic load balancing and scaling.
          </p>
          <button
            disabled
            className="mt-6 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          >
            Add nodes first
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
