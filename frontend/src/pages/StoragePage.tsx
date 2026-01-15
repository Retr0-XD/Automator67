import { DashboardLayout } from '../components/layout/DashboardLayout';

export function StoragePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Storage</h1>
          <p className="text-gray-600 mt-2">Manage distributed file storage</p>
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
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">No storage configured</h3>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            Connect storage providers to distribute files across multiple services.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
