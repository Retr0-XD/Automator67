import { useState } from 'react';
import { CloudProviderValues, NodeStatusValues } from '../../store/nodesStore';
import type { Node, CloudProvider } from '../../store/nodesStore';

interface AddNodeFormProps {
  onSubmit: (node: Omit<Node, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Provider options for the form
 */
const PROVIDER_OPTIONS = [
  { value: CloudProviderValues.RENDER, label: 'Render', icon: '🚀' },
  { value: CloudProviderValues.RAILWAY, label: 'Railway', icon: '🚂' },
  { value: CloudProviderValues.FLYIO, label: 'Fly.io', icon: '✈️' },
  { value: CloudProviderValues.VERCEL, label: 'Vercel', icon: '▲' },
  { value: CloudProviderValues.NETLIFY, label: 'Netlify', icon: '◆' },
];

/**
 * Region options for popular regions
 */
const REGION_OPTIONS = [
  'us-east-1',
  'us-west-1',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
];

/**
 * AddNodeForm component - form for adding a new node
 */
export function AddNodeForm({ onSubmit, onCancel, isLoading }: AddNodeFormProps) {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<CloudProvider>(CloudProviderValues.RENDER);
  const [endpoint, setEndpoint] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [cpuCores, setCpuCores] = useState('2');
  const [memoryGb, setMemoryGb] = useState('4');
  const [diskGb, setDiskGb] = useState('20');
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Node name is required';
    }

    if (!endpoint.trim()) {
      newErrors.endpoint = 'Endpoint URL is required';
    } else if (!endpoint.startsWith('http')) {
      newErrors.endpoint = 'Endpoint must start with http:// or https://';
    }

    if (parseInt(cpuCores) < 1) {
      newErrors.cpuCores = 'CPU cores must be at least 1';
    }

    if (parseInt(memoryGb) < 1) {
      newErrors.memoryGb = 'Memory must be at least 1GB';
    }

    if (parseInt(diskGb) < 1) {
      newErrors.diskGb = 'Disk must be at least 1GB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const newNode: Omit<Node, 'id' | 'createdAt'> = {
      name,
      provider,
      endpoint,
      region,
      status: NodeStatusValues.INITIALIZING,
      health: {
        cpuPercent: 0,
        memoryPercent: 0,
        diskPercent: 0,
        uptime: 0,
        lastHeartbeat: Date.now(),
      },
      capabilities: {
        cpuCores: parseInt(cpuCores),
        memoryGb: parseInt(memoryGb),
        diskGb: parseInt(diskGb),
        networkBandwidth: '100 Mbps',
      },
      activeDeployments: 0,
    };

    onSubmit(newNode);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Node</h2>

      <div className="space-y-5">
        {/* Node Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Node Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g., Production Node 1"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cloud Provider</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PROVIDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setProvider(opt.value)}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  provider === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{opt.icon}</div>
                <div className="text-xs font-medium">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Endpoint URL */}
        <div>
          <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-1">
            Endpoint URL
          </label>
          <input
            id="endpoint"
            type="text"
            placeholder="https://node-api.example.com"
            value={endpoint}
            onChange={(e) => {
              setEndpoint(e.target.value);
              if (errors.endpoint) setErrors({ ...errors, endpoint: '' });
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.endpoint
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.endpoint && <p className="mt-1 text-sm text-red-600">{errors.endpoint}</p>}
          <p className="mt-1 text-xs text-gray-500">
            The URL where the Node Wrapper API is running
          </p>
        </div>

        {/* Region Selection */}
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
            Region
          </label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Capabilities */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Node Capabilities</h3>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="cpuCores" className="block text-xs font-medium text-gray-700 mb-1">
                CPU Cores
              </label>
              <input
                id="cpuCores"
                type="number"
                min="1"
                value={cpuCores}
                onChange={(e) => {
                  setCpuCores(e.target.value);
                  if (errors.cpuCores) setErrors({ ...errors, cpuCores: '' });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.cpuCores
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.cpuCores && <p className="mt-1 text-xs text-red-600">{errors.cpuCores}</p>}
            </div>

            <div>
              <label htmlFor="memoryGb" className="block text-xs font-medium text-gray-700 mb-1">
                Memory (GB)
              </label>
              <input
                id="memoryGb"
                type="number"
                min="1"
                value={memoryGb}
                onChange={(e) => {
                  setMemoryGb(e.target.value);
                  if (errors.memoryGb) setErrors({ ...errors, memoryGb: '' });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.memoryGb
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.memoryGb && <p className="mt-1 text-xs text-red-600">{errors.memoryGb}</p>}
            </div>

            <div>
              <label htmlFor="diskGb" className="block text-xs font-medium text-gray-700 mb-1">
                Disk (GB)
              </label>
              <input
                id="diskGb"
                type="number"
                min="1"
                value={diskGb}
                onChange={(e) => {
                  setDiskGb(e.target.value);
                  if (errors.diskGb) setErrors({ ...errors, diskGb: '' });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.diskGb
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.diskGb && <p className="mt-1 text-xs text-red-600">{errors.diskGb}</p>}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? 'Adding Node...' : 'Add Node'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
