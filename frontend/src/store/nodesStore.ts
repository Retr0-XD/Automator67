import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/apiClient';

/**
 * Node status union type
 */
export type NodeStatus = 'initializing' | 'ready' | 'busy' | 'degraded' | 'failed' | 'removed';

/**
 * Cloud provider union type
 */
export type CloudProvider = 'render' | 'railway' | 'flyio' | 'vercel' | 'netlify';

/**
 * Node status const for values
 */
export const NodeStatusValues = {
  INITIALIZING: 'initializing' as const,
  READY: 'ready' as const,
  BUSY: 'busy' as const,
  DEGRADED: 'degraded' as const,
  FAILED: 'failed' as const,
  REMOVED: 'removed' as const,
};

/**
 * Cloud provider const for values
 */
export const CloudProviderValues = {
  RENDER: 'render' as const,
  RAILWAY: 'railway' as const,
  FLYIO: 'flyio' as const,
  VERCEL: 'vercel' as const,
  NETLIFY: 'netlify' as const,
};

/**
 * Node metrics interface
 */
export interface NodeMetrics {
  cpuPercent: number;
  memoryPercent: number;
  diskPercent: number;
  activeRequests: number;
  errorRate: number;
  avgResponseTimeMs: number;
}

/**
 * Node interface
 */
export interface Node {
  id: string;
  name: string;
  provider: CloudProvider;
  endpoint: string;
  region: string;
  status: NodeStatus;
  health: {
    cpuPercent: number;
    memoryPercent: number;
    diskPercent: number;
    uptime: number; // seconds
    lastHeartbeat: number; // timestamp
  };
  capabilities: {
    cpuCores: number;
    memoryGb: number;
    diskGb: number;
    networkBandwidth: string;
  };
  createdAt: number; // timestamp
  activeDeployments: number;
  metrics?: NodeMetrics;
}

/**
 * Nodes store state interface
 */
interface NodesState {
  nodes: Node[];
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Nodes store actions interface
 */
interface NodesActions {
  // Node management
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  getNode: (nodeId: string) => Node | undefined;

  // Node selection
  selectNode: (nodeId: string | null) => void;

  // Nodes list
  getAllNodes: () => Node[];
  getNodesByProvider: (provider: CloudProvider) => Node[];
  getNodesByStatus: (status: NodeStatus) => Node[];

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Batch operations
  setNodes: (nodes: Node[]) => void;
  clearNodes: () => void;

  // API operations
  fetchNodes: () => Promise<void>;
  createNode: (data: {
    provider: CloudProvider;
    endpoint: string;
    region: string;
    credentials: Record<string, unknown>;
    capabilities: {
      cpuCores: number;
      memoryGb: number;
      diskGb: number;
      networkBandwidth: string;
    };
  }) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
}

/**
 * Zustand store for nodes management
 *
 * Features:
 * - Persistent nodes state (localStorage)
 * - CRUD operations for nodes
 * - Node selection
 * - Filtering by provider/status
 * - Loading and error states
 *
 * @example
 * ```tsx
 * const { nodes, addNode, removeNode } = useNodesStore();
 *
 * // Add a node
 * addNode(newNode);
 *
 * // Get nodes by provider
 * const renderNodes = getNodesByProvider(CloudProvider.RENDER);
 * ```
 */
export const useNodesStore = create<NodesState & NodesActions>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: [],
      selectedNodeId: null,
      isLoading: false,
      error: null,

      // Add node
      addNode: (node: Node) => {
        set((state) => ({
          nodes: [...state.nodes, node],
        }));
      },

      // Remove node
      removeNode: (nodeId: string) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          selectedNodeId:
            state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        }));
      },

      // Update node
      updateNode: (nodeId: string, updates: Partial<Node>) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId ? { ...node, ...updates } : node
          ),
        }));
      },

      // Get single node
      getNode: (nodeId: string) => {
        return get().nodes.find((node) => node.id === nodeId);
      },

      // Select node
      selectNode: (nodeId: string | null) => {
        set({ selectedNodeId: nodeId });
      },

      // Get all nodes
      getAllNodes: () => {
        return get().nodes;
      },

      // Get nodes by provider
      getNodesByProvider: (provider: CloudProvider) => {
        return get().nodes.filter((node) => node.provider === provider);
      },

      // Get nodes by status
      getNodesByStatus: (status: NodeStatus) => {
        return get().nodes.filter((node) => node.status === status);
      },

      // Set loading state
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      // Set error
      setError: (error: string | null) => {
        set({ error });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set nodes (for bulk loading)
      setNodes: (nodes: Node[]) => {
        set({ nodes });
      },

      // Clear nodes
      clearNodes: () => {
        set({ nodes: [], selectedNodeId: null });
      },

      // Fetch nodes from API
      fetchNodes: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get<{
            data: Node[];
            timestamp: string;
            requestId: string;
          }>('/nodes');
          set({ nodes: response.data, isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to fetch nodes';
          set({ error: message, isLoading: false });
        }
      },

      // Create node via API
      createNode: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post<{
            data: Node;
            timestamp: string;
            requestId: string;
          }>('/nodes', data);
          set((state) => ({
            nodes: [...state.nodes, response.data],
            isLoading: false,
          }));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to create node';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      // Delete node via API
      deleteNode: async (nodeId: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.delete(`/nodes/${nodeId}`);
          set((state) => ({
            nodes: state.nodes.filter((n) => n.id !== nodeId),
            selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
            isLoading: false,
          }));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to delete node';
          set({ error: message, isLoading: false });
          throw err;
        }
      },
    }),
    {
      name: 'nodes-storage',
    }
  )
);
