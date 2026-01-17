import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/apiClient';

/**
 * Deployment status union type
 */
export type DeploymentStatus = 'pending' | 'deploying' | 'running' | 'updating' | 'failed' | 'stopped';

/**
 * Application runtime union type
 */
export type AppRuntime = 'nodejs' | 'python' | 'go' | 'ruby' | 'rust' | 'java' | 'docker';

/**
 * Deployment status const for values
 */
export const DeploymentStatusValues = {
  PENDING: 'pending' as const,
  DEPLOYING: 'deploying' as const,
  RUNNING: 'running' as const,
  UPDATING: 'updating' as const,
  FAILED: 'failed' as const,
  STOPPED: 'stopped' as const,
};

/**
 * Application runtime const for values
 */
export const AppRuntimeValues = {
  NODEJS: 'nodejs' as const,
  PYTHON: 'python' as const,
  GO: 'go' as const,
  RUBY: 'ruby' as const,
  RUST: 'rust' as const,
  JAVA: 'java' as const,
  DOCKER: 'docker' as const,
};

/**
 * Deployment environment variable interface
 */
export interface EnvVar {
  key: string;
  value: string;
  secret?: boolean;
}

/**
 * Deployment health check configuration
 */
export interface HealthCheck {
  path: string;
  interval: number; // seconds
  timeout: number; // seconds
  retries: number;
}

/**
 * Deployment resource limits
 */
export interface Resources {
  memoryLimitMb: number;
  cpuLimit: number; // decimal, e.g., 0.5
  storageLimitMb: number;
}

/**
 * Deployment interface
 */
export interface Deployment {
  id: string;
  name: string;
  appType: 'backend' | 'worker' | 'cron';
  runtime: AppRuntime;
  status: DeploymentStatus;
  sourceUrl?: string; // Git repo or Docker image
  entrypoint: string; // command to run
  port?: number; // exposed port
  instances: number; // number of replicas
  targetNodeIds: string[]; // which nodes to deploy to
  envVars: EnvVar[];
  resources: Resources;
  healthCheck?: HealthCheck;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  replicas: DeploymentReplica[];
  logs?: string;
}

/**
 * Deployment replica status
 */
export interface DeploymentReplica {
  id: string;
  nodeId: string;
  status: DeploymentStatus;
  cpuPercent: number;
  memoryPercent: number;
  uptime: number; // seconds
  lastHealthCheck: number; // timestamp
}

/**
 * Deployments store state interface
 */
interface DeploymentsState {
  deployments: Deployment[];
  selectedDeploymentId: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Deployments store actions interface
 */
interface DeploymentsActions {
  // Deployment management
  addDeployment: (deployment: Deployment) => void;
  removeDeployment: (deploymentId: string) => void;
  updateDeployment: (deploymentId: string, updates: Partial<Deployment>) => void;
  getDeployment: (deploymentId: string) => Deployment | undefined;

  // Deployment selection
  selectDeployment: (deploymentId: string | null) => void;

  // Deployments list
  getAllDeployments: () => Deployment[];
  getDeploymentsByStatus: (status: DeploymentStatus) => Deployment[];
  getDeploymentsByNode: (nodeId: string) => Deployment[];

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Batch operations
  setDeployments: (deployments: Deployment[]) => void;
  clearDeployments: () => void;

  // API operations
  fetchDeployments: () => Promise<void>;
  createDeployment: (data: {
    name: string;
    appType: 'backend' | 'worker' | 'cron';
    runtime: AppRuntime;
    sourceUrl: string;
    entrypoint: string;
    instances: number;
    targetNodeIds: string[];
    resources: Resources;
    envVars?: EnvVar[];
    healthCheck?: HealthCheck;
    port?: number;
  }) => Promise<void>;
  deleteDeployment: (deploymentId: string) => Promise<void>;
}

/**
 * Zustand store for deployments management
 *
 * Features:
 * - Persistent deployments state (localStorage)
 * - CRUD operations for deployments
 * - Deployment selection
 * - Filtering by status/node
 * - Loading and error states
 *
 * @example
 * ```tsx
 * const { deployments, addDeployment, removeDeployment } = useDeploymentsStore();
 *
 * // Add a deployment
 * addDeployment(newDeployment);
 *
 * // Get deployments by status
 * const runningDeploys = getDeploymentsByStatus(DeploymentStatus.RUNNING);
 * ```
 */
export const useDeploymentsStore = create<DeploymentsState & DeploymentsActions>()(
  persist(
    (set, get) => ({
      // Initial state
      deployments: [],
      selectedDeploymentId: null,
      isLoading: false,
      error: null,

      // Add deployment
      addDeployment: (deployment: Deployment) => {
        set((state) => ({
          deployments: [...state.deployments, deployment],
        }));
      },

      // Remove deployment
      removeDeployment: (deploymentId: string) => {
        set((state) => ({
          deployments: state.deployments.filter((d) => d.id !== deploymentId),
          selectedDeploymentId:
            state.selectedDeploymentId === deploymentId ? null : state.selectedDeploymentId,
        }));
      },

      // Update deployment
      updateDeployment: (deploymentId: string, updates: Partial<Deployment>) => {
        set((state) => ({
          deployments: state.deployments.map((d) =>
            d.id === deploymentId ? { ...d, ...updates, updatedAt: Date.now() } : d
          ),
        }));
      },

      // Get single deployment
      getDeployment: (deploymentId: string) => {
        return get().deployments.find((d) => d.id === deploymentId);
      },

      // Select deployment
      selectDeployment: (deploymentId: string | null) => {
        set({ selectedDeploymentId: deploymentId });
      },

      // Get all deployments
      getAllDeployments: () => {
        return get().deployments;
      },

      // Get deployments by status
      getDeploymentsByStatus: (status: DeploymentStatus) => {
        return get().deployments.filter((d) => d.status === status);
      },

      // Get deployments by node
      getDeploymentsByNode: (nodeId: string) => {
        return get().deployments.filter((d) => d.targetNodeIds.includes(nodeId));
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

      // Set deployments (for bulk loading)
      setDeployments: (deployments: Deployment[]) => {
        set({ deployments });
      },

      // Clear deployments
      clearDeployments: () => {
        set({ deployments: [], selectedDeploymentId: null });
      },

      // Fetch deployments from API
      fetchDeployments: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get<{
            data: Deployment[];
            timestamp: string;
            requestId: string;
          }>('/deployments');
          set({ deployments: response.data, isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to fetch deployments';
          set({ error: message, isLoading: false });
        }
      },

      // Create deployment via API
      createDeployment: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post<{
            data: Deployment;
            timestamp: string;
            requestId: string;
          }>('/deployments', data);
          set((state) => ({
            deployments: [...state.deployments, response.data],
            isLoading: false,
          }));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to create deployment';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      // Delete deployment via API
      deleteDeployment: async (deploymentId: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.delete(`/deployments/${deploymentId}`);
          set((state) => ({
            deployments: state.deployments.filter((d) => d.id !== deploymentId),
            selectedDeploymentId:
              state.selectedDeploymentId === deploymentId ? null : state.selectedDeploymentId,
            isLoading: false,
          }));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to delete deployment';
          set({ error: message, isLoading: false });
          throw err;
        }
      },
    }),
    {
      name: 'deployments-storage',
    }
  )
);
