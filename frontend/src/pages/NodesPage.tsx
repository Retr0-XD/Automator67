import { DashboardLayout } from '../components/layout/DashboardLayout';

export function NodesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nodes</h1>
          <p className="text-gray-600 mt-2">Manage your worker nodes across cloud providers</p>
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
              d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">No nodes yet</h3>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            Connect to free-tier cloud providers like Render, Railway, and Fly.io to create your distributed compute cluster.
          </p>
          <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add First Node
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
