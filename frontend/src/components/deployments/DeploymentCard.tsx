import type { Deployment, DeploymentStatus, AppRuntime } from '../../store/deploymentsStore';
import { DeploymentStatusValues, AppRuntimeValues } from '../../store/deploymentsStore';

interface DeploymentCardProps {
  deployment: Deployment;
  onEdit?: (deployment: Deployment) => void;
  onDelete?: (deploymentId: string) => void;
}

/**
 * Get status badge color
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case DeploymentStatusValues.RUNNING:
      return 'bg-green-100 text-green-800 border-green-300';
    case DeploymentStatusValues.PENDING:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case DeploymentStatusValues.DEPLOYING:
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case DeploymentStatusValues.UPDATING:
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case DeploymentStatusValues.FAILED:
      return 'bg-red-100 text-red-800 border-red-300';
    case DeploymentStatusValues.STOPPED:
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

/**
 * Get runtime icon
 */
const getRuntimeIcon = (runtime: string): string => {
  switch (runtime) {
    case AppRuntimeValues.NODEJS:
      return '🟩';
    case AppRuntimeValues.PYTHON:
      return '🐍';
    case AppRuntimeValues.GO:
      return '🔵';
    case AppRuntimeValues.RUBY:
      return '💎';
    case AppRuntimeValues.RUST:
      return '🦀';
    case AppRuntimeValues.JAVA:
      return '☕';
    case AppRuntimeValues.DOCKER:
      return '🐳';
    default:
      return '📦';
  }
};

/**
 * DeploymentCard component - displays individual deployment
 */
export function DeploymentCard({ deployment, onEdit, onDelete }: DeploymentCardProps) {
  const uptime = Math.floor(
    (Date.now() - deployment.createdAt) / 1000 / 60
  ); // minutes

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="text-2xl">{getRuntimeIcon(deployment.runtime)}</div>
            <div>
              <h3 className="font-semibold text-gray-900">{deployment.name}</h3>
              <p className="text-sm text-gray-500">{deployment.runtime}</p>
            </div>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(deployment.status)}`}
          >
            {deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Type and Port */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            <span className="font-medium text-gray-900">{deployment.appType}</span>
            {deployment.port && `:${deployment.port}`}
          </span>
          <span className="text-gray-600">
            {deployment.instances} instance{deployment.instances !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Resources */}
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            Memory: <span className="font-medium">{deployment.resources.memoryLimitMb}MB</span>
          </p>
          <p>
            CPU: <span className="font-medium">{deployment.resources.cpuLimit}</span> cores
          </p>
        </div>

        {/* Nodes */}
        <div className="text-xs">
          <p className="text-gray-600 mb-1">Target Nodes:</p>
          <div className="flex flex-wrap gap-1">
            {deployment.targetNodeIds.length > 0 ? (
              deployment.targetNodeIds.map((nodeId) => (
                <span
                  key={nodeId}
                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200"
                >
                  {nodeId.slice(-8)}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No nodes selected</span>
            )}
          </div>
        </div>

        {/* Environment Variables */}
        {deployment.envVars.length > 0 && (
          <div className="text-xs">
            <p className="text-gray-600 mb-1">
              Env Variables: <span className="font-medium">{deployment.envVars.length}</span>
            </p>
          </div>
        )}

        {/* Uptime */}
        <div className="text-xs text-gray-500">
          Deployed: <span className="font-medium">{uptime} minutes ago</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(deployment)}
            className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(deployment.id)}
            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
