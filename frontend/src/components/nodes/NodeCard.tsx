import type { Node, NodeStatus } from '../../store/nodesStore';
import { NodeStatusValues } from '../../store/nodesStore';

interface NodeCardProps {
  node: Node;
  onEdit?: (node: Node) => void;
  onDelete?: (nodeId: string) => void;
  onSelect?: (nodeId: string) => void;
}

/**
 * Status badge color mapping
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case NodeStatusValues.READY:
      return 'bg-green-100 text-green-800 border-green-300';
    case NodeStatusValues.INITIALIZING:
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case NodeStatusValues.BUSY:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case NodeStatusValues.DEGRADED:
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case NodeStatusValues.FAILED:
      return 'bg-red-100 text-red-800 border-red-300';
    case NodeStatusValues.REMOVED:
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

/**
 * Provider icon mapping
 */
const getProviderIcon = (provider: string): string => {
  switch (provider) {
    case 'render':
      return '🚀';
    case 'railway':
      return '🚂';
    case 'flyio':
      return '✈️';
    case 'vercel':
      return '▲';
    case 'netlify':
      return '◆';
    default:
      return '☁️';
  }
};

/**
 * Health indicator color based on percentage
 */
const getHealthBarColor = (percentage: number): string => {
  if (percentage < 50) return 'bg-green-500';
  if (percentage < 75) return 'bg-yellow-500';
  return 'bg-red-500';
};

/**
 * NodeCard component - displays individual node information
 */
export function NodeCard({ node, onEdit, onDelete, onSelect }: NodeCardProps) {
  const maxHealthPercent = Math.max(
    node.health.cpuPercent,
    node.health.memoryPercent,
    node.health.diskPercent
  );

  const uptime = Math.floor(node.health.uptime / 3600);

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(node.id)}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="text-2xl">{getProviderIcon(node.provider)}</div>
            <div>
              <h3 className="font-semibold text-gray-900">{node.name}</h3>
              <p className="text-sm text-gray-500">{node.region}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(node.status)}`}>
            {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4 space-y-3">
        {/* Health Bars */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-600">CPU</span>
              <span className="text-xs text-gray-500">{node.health.cpuPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getHealthBarColor(node.health.cpuPercent)} transition-all`}
                style={{ width: `${node.health.cpuPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-600">Memory</span>
              <span className="text-xs text-gray-500">{node.health.memoryPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getHealthBarColor(node.health.memoryPercent)} transition-all`}
                style={{ width: `${node.health.memoryPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-600">Disk</span>
              <span className="text-xs text-gray-500">{node.health.diskPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getHealthBarColor(node.health.diskPercent)} transition-all`}
                style={{ width: `${node.health.diskPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-500">Uptime</span>
            <p className="font-medium text-gray-900">{uptime}h</p>
          </div>
          <div>
            <span className="text-gray-500">Deployments</span>
            <p className="font-medium text-gray-900">{node.activeDeployments}</p>
          </div>
          <div>
            <span className="text-gray-500">CPU Cores</span>
            <p className="font-medium text-gray-900">{node.capabilities.cpuCores}</p>
          </div>
          <div>
            <span className="text-gray-500">Memory</span>
            <p className="font-medium text-gray-900">{node.capabilities.memoryGb}GB</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node);
            }}
            className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
