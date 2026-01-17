import { useState } from 'react';
import { useNodesStore } from '../../store/nodesStore';
import { AppRuntimeValues, DeploymentStatusValues } from '../../store/deploymentsStore';
import type { Deployment, EnvVar, Resources, AppRuntime } from '../../store/deploymentsStore';

interface DeploymentWizardProps {
  onSubmit: (deployment: Deployment) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type WizardStep = 'basic' | 'source' | 'resources' | 'nodes' | 'review';

/**
 * DeploymentWizard component - multi-step wizard for creating deployments
 */
export function DeploymentWizard({ onSubmit, onCancel, isLoading }: DeploymentWizardProps) {
  const nodes = useNodesStore((state) => state.getAllNodes());

  const [step, setStep] = useState<WizardStep>('basic');

  // Basic info
  const [name, setName] = useState('');
  const [appType, setAppType] = useState<'backend' | 'worker' | 'cron'>('backend');
  const [runtime, setRuntime] = useState<AppRuntime>('nodejs');
  const [entrypoint, setEntrypoint] = useState('');
  const [port, setPort] = useState('3000');

  // Source
  const [sourceUrl, setSourceUrl] = useState('');

  // Resources
  const [resources, setResources] = useState<Resources>({
    memoryLimitMb: 512,
    cpuLimit: 0.5,
    storageLimitMb: 1024,
  });
  const [instances, setInstances] = useState('1');

  // Environment variables
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [envKey, setEnvKey] = useState('');
  const [envValue, setEnvValue] = useState('');

  // Target nodes
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate current step
   */
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'basic') {
      if (!name.trim()) newErrors.name = 'Deployment name is required';
      if (!entrypoint.trim()) newErrors.entrypoint = 'Entrypoint command is required';
      if (appType === 'backend' && (!port || parseInt(port) < 1 || parseInt(port) > 65535)) {
        newErrors.port = 'Valid port number is required';
      }
    }

    if (step === 'source') {
      if (!sourceUrl.trim()) newErrors.sourceUrl = 'Source URL is required (Git repo or Docker image)';
    }

    if (step === 'nodes') {
      if (selectedNodes.length === 0) newErrors.nodes = 'At least one node must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Move to next step
   */
  const handleNext = () => {
    if (validateStep()) {
      const steps: WizardStep[] = ['basic', 'source', 'resources', 'nodes', 'review'];
      const currentIndex = steps.indexOf(step);
      if (currentIndex < steps.length - 1) {
        setStep(steps[currentIndex + 1]);
      }
    }
  };

  /**
   * Move to previous step
   */
  const handleBack = () => {
    const steps: WizardStep[] = ['basic', 'source', 'resources', 'nodes', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  /**
   * Add environment variable
   */
  const handleAddEnvVar = () => {
    if (envKey.trim()) {
      setEnvVars([...envVars, { key: envKey, value: envValue, secret: false }]);
      setEnvKey('');
      setEnvValue('');
    }
  };

  /**
   * Remove environment variable
   */
  const handleRemoveEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  /**
   * Toggle node selection
   */
  const handleToggleNode = (nodeId: string) => {
    setSelectedNodes((prev) =>
      prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
    );
  };

  /**
   * Handle form submission
   */
  const handleSubmit = () => {
    const deployment: Deployment = {
      id: `deploy-${Date.now()}`,
      name,
      appType,
      runtime,
      status: DeploymentStatusValues.PENDING,
      sourceUrl,
      entrypoint,
      port: appType === 'backend' ? parseInt(port) : undefined,
      instances: parseInt(instances),
      targetNodeIds: selectedNodes,
      envVars,
      resources,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      replicas: [],
    };

    onSubmit(deployment);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Wizard Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Deploy Application</h2>
        <div className="flex items-center justify-between">
          {(['basic', 'source', 'resources', 'nodes', 'review'] as const).map((s, i, arr) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                  step === s
                    ? 'bg-blue-600 text-white'
                    : arr.indexOf(step) > i
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {i + 1}
              </div>
              {i < arr.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    arr.indexOf(step) > i ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Wizard Steps */}
      <div className="space-y-4 mb-6">
        {step === 'basic' && (
          <>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Deployment Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="e.g., My API Server"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="appType" className="block text-sm font-medium text-gray-700 mb-1">
                  Application Type
                </label>
                <select
                  id="appType"
                  value={appType}
                  onChange={(e) => setAppType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="backend">Backend Service</option>
                  <option value="worker">Background Worker</option>
                  <option value="cron">Cron Job</option>
                </select>
              </div>

              <div>
                <label htmlFor="runtime" className="block text-sm font-medium text-gray-700 mb-1">
                  Runtime
                </label>
                <select
                  id="runtime"
                  value={runtime}
                  onChange={(e) => setRuntime(e.target.value as AppRuntime)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={AppRuntimeValues.NODEJS}>Node.js</option>
                  <option value={AppRuntimeValues.PYTHON}>Python</option>
                  <option value={AppRuntimeValues.GO}>Go</option>
                  <option value={AppRuntimeValues.RUBY}>Ruby</option>
                  <option value={AppRuntimeValues.RUST}>Rust</option>
                  <option value={AppRuntimeValues.JAVA}>Java</option>
                  <option value={AppRuntimeValues.DOCKER}>Docker</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="entrypoint" className="block text-sm font-medium text-gray-700 mb-1">
                Entrypoint Command
              </label>
              <input
                id="entrypoint"
                type="text"
                placeholder="e.g., node server.js"
                value={entrypoint}
                onChange={(e) => {
                  setEntrypoint(e.target.value);
                  if (errors.entrypoint) setErrors({ ...errors, entrypoint: '' });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.entrypoint
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.entrypoint && <p className="mt-1 text-sm text-red-600">{errors.entrypoint}</p>}
            </div>

            {appType === 'backend' && (
              <div>
                <label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  id="port"
                  type="number"
                  min="1"
                  max="65535"
                  value={port}
                  onChange={(e) => {
                    setPort(e.target.value);
                    if (errors.port) setErrors({ ...errors, port: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.port
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              </div>
            )}
          </>
        )}

        {step === 'source' && (
          <div>
            <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Source URL
            </label>
            <input
              id="sourceUrl"
              type="text"
              placeholder="https://github.com/user/repo or docker.io/image:tag"
              value={sourceUrl}
              onChange={(e) => {
                setSourceUrl(e.target.value);
                if (errors.sourceUrl) setErrors({ ...errors, sourceUrl: '' });
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.sourceUrl
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.sourceUrl && <p className="mt-1 text-sm text-red-600">{errors.sourceUrl}</p>}
            <p className="mt-2 text-sm text-gray-500">
              GitHub repository or Docker image to deploy from
            </p>
          </div>
        )}

        {step === 'resources' && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="memory" className="block text-sm font-medium text-gray-700 mb-1">
                  Memory (MB)
                </label>
                <input
                  id="memory"
                  type="number"
                  min="256"
                  value={resources.memoryLimitMb}
                  onChange={(e) =>
                    setResources({ ...resources, memoryLimitMb: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="cpu" className="block text-sm font-medium text-gray-700 mb-1">
                  CPU (cores)
                </label>
                <input
                  id="cpu"
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={resources.cpuLimit}
                  onChange={(e) =>
                    setResources({ ...resources, cpuLimit: parseFloat(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="storage" className="block text-sm font-medium text-gray-700 mb-1">
                  Storage (MB)
                </label>
                <input
                  id="storage"
                  type="number"
                  min="256"
                  value={resources.storageLimitMb}
                  onChange={(e) =>
                    setResources({ ...resources, storageLimitMb: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="instances" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Instances
              </label>
              <input
                id="instances"
                type="number"
                min="1"
                value={instances}
                onChange={(e) => setInstances(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment Variables
              </label>
              <div className="space-y-2">
                {envVars.map((envVar, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700 flex-1">
                      {envVar.key} = {envVar.secret ? '••••••' : envVar.value}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEnvVar(idx)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={envKey}
                  onChange={(e) => setEnvKey(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={envValue}
                  onChange={(e) => setEnvValue(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddEnvVar}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'nodes' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Target Nodes
              </label>
              {nodes.length === 0 ? (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  No nodes available. Please add nodes first.
                </p>
              ) : (
                <div className="space-y-2">
                  {nodes.map((node) => (
                    <label
                      key={node.id}
                      className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNodes.includes(node.id)}
                        onChange={() => handleToggleNode(node.id)}
                        className="rounded"
                      />
                      <span className="ml-2 text-sm">
                        {node.name} ({node.provider}) - {node.region}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {errors.nodes && <p className="mt-1 text-sm text-red-600">{errors.nodes}</p>}
            </div>
          </>
        )}

        {step === 'review' && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p>
                <span className="font-medium text-gray-700">Name:</span> {name}
              </p>
              <p>
                <span className="font-medium text-gray-700">Type:</span> {appType}
              </p>
              <p>
                <span className="font-medium text-gray-700">Runtime:</span> {runtime}
              </p>
              <p>
                <span className="font-medium text-gray-700">Source:</span> {sourceUrl}
              </p>
              <p>
                <span className="font-medium text-gray-700">Instances:</span> {instances}
              </p>
              <p>
                <span className="font-medium text-gray-700">Target Nodes:</span>{' '}
                {selectedNodes.length} selected
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Actions */}
      <div className="flex justify-between gap-3">
        <button
          type="button"
          onClick={step === 'basic' ? onCancel : handleBack}
          className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          {step === 'basic' ? 'Cancel' : 'Back'}
        </button>

        {step !== 'review' && (
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next
          </button>
        )}

        {step === 'review' && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? 'Deploying...' : 'Deploy'}
          </button>
        )}
      </div>
    </div>
  );
}
