export function DashboardPage() {
  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to Automator67</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Nodes</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            <p className="text-xs text-gray-500 mt-2">No nodes added yet</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Deployments</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            <p className="text-xs text-gray-500 mt-2">No active deployments</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">CPU Usage</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">0%</p>
            <p className="text-xs text-gray-500 mt-2">No activity</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Memory</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">0 MB</p>
            <p className="text-xs text-gray-500 mt-2">No activity</p>
          </div>
        </div>

        {/* Getting started */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900">Getting Started</h2>
          <p className="text-sm text-blue-700 mt-2">
            Add your first node to start deploying applications across free-tier cloud services.
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add Node
          </button>
        </div>
      </div>
    );
}
