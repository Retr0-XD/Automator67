import { useEffect, useState } from 'react';
import { useDeploymentsStore, DeploymentStatusValues } from '../store/deploymentsStore';
import { DeploymentWizard } from '../components/deployments/DeploymentWizard';
import { DeploymentCard } from '../components/deployments/DeploymentCard';
import type { Deployment, DeploymentStatus } from '../store/deploymentsStore';

export function DeploymentsPage() {
  const { deployments, isLoading, error, clearError, fetchDeployments, createDeployment, deleteDeployment } = useDeploymentsStore();
  const [showWizard, setShowWizard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load deployments on mount
  useEffect(() => {
    fetchDeployments().catch((err) => console.error('Failed to load deployments:', err));
  }, [fetchDeployments]);

  /**
   * Handle deploying a new application
   */
  const handleDeploy = async (deployment: Omit<Deployment, 'id' | 'createdAt' | 'updatedAt' | 'replicas'>) => {
    try {
      setIsSubmitting(true);
      clearError();
      await createDeployment({
        name: deployment.name,
        appType: deployment.appType,
        runtime: deployment.runtime,
        sourceUrl: deployment.sourceUrl || '',
        entrypoint: deployment.entrypoint,
        instances: deployment.instances,
        targetNodeIds: deployment.targetNodeIds,
        resources: deployment.resources,
        envVars: deployment.envVars,
        healthCheck: deployment.healthCheck,
        port: deployment.port,
      });
      setShowWizard(false);
    } catch (err) {
      console.error('Failed to deploy:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle removing a deployment
   */
  const handleRemoveDeployment = async (deploymentId: string) => {
    if (confirm('Are you sure you want to remove this deployment?')) {
      try {
        await deleteDeployment(deploymentId);
      } catch (err) {
        console.error('Failed to remove deployment:', err);
      }
    }
  };

  /**
   * Group deployments by status
   */
  const deploymentsByStatus = (status: DeploymentStatus) =>
    deployments.filter((d) => d.status === status);

  const hasDeployments = deployments.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deployments</h1>
          <p className="text-gray-600 mt-2">
            Deploy applications to your nodes ({deployments.length} deployment{deployments.length !== 1 ? 's' : ''})
          </p>
        </div>
        <button
          onClick={() => setShowWizard(!showWizard)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          {showWizard ? 'Cancel' : '+ New Deployment'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Deployment Wizard */}
      {showWizard && (
        <DeploymentWizard
          onSubmit={handleDeploy}
          onCancel={() => setShowWizard(false)}
          isLoading={isSubmitting}
        />
      )}

      {/* Loading State */}
      {isLoading && !showWizard && deployments.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading deployments...</p>
        </div>
      )}

      {/* Empty State */}
      {!hasDeployments && !showWizard && (
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
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">No deployments yet</h3>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            Create your first deployment to start running applications on your nodes. Add nodes first before deploying.
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Create First Deployment
          </button>
        </div>
      )}

      {/* Deployments by Status */}
      {hasDeployments && (
        <div className="space-y-8">
          {/* Running */}
          {deploymentsByStatus(DeploymentStatusValues.RUNNING).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-600" />
                Running ({deploymentsByStatus(DeploymentStatusValues.RUNNING).length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deploymentsByStatus(DeploymentStatusValues.RUNNING).map((deployment) => (
                  <DeploymentCard
                    key={deployment.id}
                    deployment={deployment}
                    onDelete={handleRemoveDeployment}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Deploying */}
          {deploymentsByStatus(DeploymentStatusValues.DEPLOYING).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
                Deploying ({deploymentsByStatus(DeploymentStatusValues.DEPLOYING).length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deploymentsByStatus(DeploymentStatusValues.DEPLOYING).map((deployment) => (
                  <DeploymentCard
                    key={deployment.id}
                    deployment={deployment}
                    onDelete={handleRemoveDeployment}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending */}
          {deploymentsByStatus(DeploymentStatusValues.PENDING).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-600" />
                Pending ({deploymentsByStatus(DeploymentStatusValues.PENDING).length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deploymentsByStatus(DeploymentStatusValues.PENDING).map((deployment) => (
                  <DeploymentCard
                    key={deployment.id}
                    deployment={deployment}
                    onDelete={handleRemoveDeployment}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Failed */}
          {deploymentsByStatus(DeploymentStatusValues.FAILED).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600" />
                Failed ({deploymentsByStatus(DeploymentStatusValues.FAILED).length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deploymentsByStatus(DeploymentStatusValues.FAILED).map((deployment) => (
                  <DeploymentCard
                    key={deployment.id}
                    deployment={deployment}
                    onDelete={handleRemoveDeployment}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stopped */}
          {deploymentsByStatus(DeploymentStatusValues.STOPPED).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-600" />
                Stopped ({deploymentsByStatus(DeploymentStatusValues.STOPPED).length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deploymentsByStatus(DeploymentStatusValues.STOPPED).map((deployment) => (
                  <DeploymentCard
                    key={deployment.id}
                    deployment={deployment}
                    onDelete={handleRemoveDeployment}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
