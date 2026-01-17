import { useEffect, useState } from 'react';
import { useNodesStore } from '../store/nodesStore';
import { CloudProviderValues } from '../store/nodesStore';
import { NodeCard } from '../components/nodes/NodeCard';
import { AddNodeForm } from '../components/nodes/AddNodeForm';
import type { Node, CloudProvider } from '../store/nodesStore';

export function NodesPage() {
  const { nodes, isLoading, error, clearError, fetchNodes, createNode, deleteNode } = useNodesStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load nodes on mount
  useEffect(() => {
    fetchNodes().catch((err) => console.error('Failed to load nodes:', err));
  }, [fetchNodes]);

  /**
   * Handle adding a new node
   */
  const handleAddNode = async (nodeData: Omit<Node, 'id' | 'createdAt'>) => {
    try {
      setIsSubmitting(true);
      clearError();

      await createNode({
        provider: nodeData.provider,
        endpoint: nodeData.endpoint,
        region: nodeData.region,
        credentials: nodeData.capabilities,
        capabilities: nodeData.capabilities,
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to add node:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle removing a node
   */
  const handleRemoveNode = async (nodeId: string) => {
    if (confirm('Are you sure you want to remove this node?')) {
      try {
        await deleteNode(nodeId);
      } catch (err) {
        console.error('Failed to remove node:', err);
      }
    }
  };

  /**
   * Group nodes by provider
   */
  const nodesByProvider = (provider: CloudProvider) =>
    nodes.filter((node) => node.provider === provider);

  const hasNodes = nodes.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nodes</h1>
          <p className="text-gray-600 mt-2">
            Manage your worker nodes across cloud providers ({nodes.length} node{nodes.length !== 1 ? 's' : ''})
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {showAddForm ? 'Cancel' : '+ Add Node'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Add Node Form */}
      {showAddForm && (
        <AddNodeForm
          onSubmit={handleAddNode}
          onCancel={() => setShowAddForm(false)}
          isLoading={isSubmitting}
        />
      )}

      {/* Loading State */}
      {isLoading && !showAddForm && nodes.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading nodes...</p>
        </div>
      )}

      {/* Empty State */}
      {!hasNodes && !showAddForm && (
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
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add First Node
          </button>
        </div>
      )}

      {/* Nodes Grid */}
      {hasNodes && (
        <div className="space-y-6">
          {/* Render Nodes */}
          {nodesByProvider(CloudProviderValues.RENDER).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">🚀 Render Nodes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nodesByProvider(CloudProviderValues.RENDER).map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    onDelete={handleRemoveNode}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Railway Nodes */}
          {nodesByProvider(CloudProviderValues.RAILWAY).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">🚂 Railway Nodes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nodesByProvider(CloudProviderValues.RAILWAY).map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    onDelete={handleRemoveNode}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Fly.io Nodes */}
          {nodesByProvider(CloudProviderValues.FLYIO).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">✈️ Fly.io Nodes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nodesByProvider(CloudProviderValues.FLYIO).map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    onDelete={handleRemoveNode}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Vercel Nodes */}
          {nodesByProvider(CloudProviderValues.VERCEL).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">▲ Vercel Nodes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nodesByProvider(CloudProviderValues.VERCEL).map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    onDelete={handleRemoveNode}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Netlify Nodes */}
          {nodesByProvider(CloudProviderValues.NETLIFY).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">◆ Netlify Nodes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nodesByProvider(CloudProviderValues.NETLIFY).map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    onDelete={handleRemoveNode}
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
