import { describe, it, expect, beforeEach } from 'vitest';
import { useNodesStore, CloudProviderValues, NodeStatusValues } from './nodesStore';
import type { Node, CloudProvider, NodeStatus } from './nodesStore';

describe('useNodesStore', () => {
  beforeEach(() => {
    useNodesStore.setState({
      nodes: [],
      selectedNodeId: null,
      isLoading: false,
      error: null,
    });
  });

  const mockNode: Node = {
    id: '1',
    name: 'Test Node',
    provider: CloudProviderValues.RENDER,
    endpoint: 'https://node.example.com',
    region: 'us-east',
    status: NodeStatusValues.READY,
    health: {
      cpuPercent: 20,
      memoryPercent: 30,
      diskPercent: 40,
      uptime: 3600,
      lastHeartbeat: Date.now(),
    },
    capabilities: {
      cpuCores: 2,
      memoryGb: 4,
      diskGb: 20,
      networkBandwidth: '100 Mbps',
    },
    createdAt: Date.now(),
    activeDeployments: 2,
  };

  describe('addNode', () => {
    it('should add a node to the store', () => {
      const { addNode } = useNodesStore.getState();
      addNode(mockNode);

      const { nodes } = useNodesStore.getState();
      expect(nodes).toHaveLength(1);
      expect(nodes[0]).toEqual(mockNode);
    });

    it('should add multiple nodes', () => {
      const { addNode } = useNodesStore.getState();
      const node2 = { ...mockNode, id: '2', name: 'Node 2' };

      addNode(mockNode);
      addNode(node2);

      const { nodes } = useNodesStore.getState();
      expect(nodes).toHaveLength(2);
    });
  });

  describe('removeNode', () => {
    it('should remove a node from the store', () => {
      const { addNode, removeNode } = useNodesStore.getState();
      addNode(mockNode);

      removeNode('1');

      const { nodes } = useNodesStore.getState();
      expect(nodes).toHaveLength(0);
    });

    it('should clear selection if removed node was selected', () => {
      const { addNode, selectNode, removeNode } = useNodesStore.getState();
      addNode(mockNode);
      selectNode('1');

      removeNode('1');

      const { selectedNodeId } = useNodesStore.getState();
      expect(selectedNodeId).toBeNull();
    });
  });

  describe('updateNode', () => {
    it('should update a node', () => {
      const { addNode, updateNode } = useNodesStore.getState();
      addNode(mockNode);

      updateNode('1', { status: NodeStatusValues.DEGRADED });

      const { nodes } = useNodesStore.getState();
      expect(nodes[0].status).toBe(NodeStatusValues.DEGRADED);
    });

    it('should preserve other node properties', () => {
      const { addNode, updateNode } = useNodesStore.getState();
      addNode(mockNode);

      updateNode('1', { status: NodeStatusValues.BUSY });

      const { nodes } = useNodesStore.getState();
      expect(nodes[0].name).toBe('Test Node');
      expect(nodes[0].provider).toBe(CloudProviderValues.RENDER);
    });
  });

  describe('getNode', () => {
    it('should return a node by id', () => {
      const { addNode, getNode } = useNodesStore.getState();
      addNode(mockNode);

      const node = getNode('1');
      expect(node).toEqual(mockNode);
    });

    it('should return undefined if node not found', () => {
      const { getNode } = useNodesStore.getState();
      const node = getNode('nonexistent');
      expect(node).toBeUndefined();
    });
  });

  describe('selectNode', () => {
    it('should select a node', () => {
      const { selectNode } = useNodesStore.getState();
      selectNode('1');

      const { selectedNodeId } = useNodesStore.getState();
      expect(selectedNodeId).toBe('1');
    });

    it('should clear selection with null', () => {
      const { selectNode } = useNodesStore.getState();
      selectNode('1');
      selectNode(null);

      const { selectedNodeId } = useNodesStore.getState();
      expect(selectedNodeId).toBeNull();
    });
  });

  describe('getAllNodes', () => {
    it('should return all nodes', () => {
      const { addNode, getAllNodes } = useNodesStore.getState();
      const node2 = { ...mockNode, id: '2' };

      addNode(mockNode);
      addNode(node2);

      const nodes = getAllNodes();
      expect(nodes).toHaveLength(2);
    });

    it('should return empty array when no nodes', () => {
      const { getAllNodes } = useNodesStore.getState();
      const nodes = getAllNodes();
      expect(nodes).toHaveLength(0);
    });
  });

  describe('getNodesByProvider', () => {
    it('should return nodes by provider', () => {
      const { addNode, getNodesByProvider } = useNodesStore.getState();
      const railwayNode = {
        ...mockNode,
        id: '2',
        provider: CloudProviderValues.RAILWAY,
      };

      addNode(mockNode);
      addNode(railwayNode);

      const renderNodes = getNodesByProvider(CloudProviderValues.RENDER);
      expect(renderNodes).toHaveLength(1);
      expect(renderNodes[0].provider).toBe(CloudProviderValues.RENDER);
    });
  });

  describe('getNodesByStatus', () => {
    it('should return nodes by status', () => {
      const { addNode, getNodesByStatus } = useNodesStore.getState();
      const failedNode = {
        ...mockNode,
        id: '2',
        status: NodeStatusValues.FAILED,
      };

      addNode(mockNode);
      addNode(failedNode);

      const readyNodes = getNodesByStatus(NodeStatusValues.READY);
      expect(readyNodes).toHaveLength(1);
      expect(readyNodes[0].status).toBe(NodeStatusValues.READY);
    });
  });

  describe('setNodes', () => {
    it('should set all nodes', () => {
      const { setNodes } = useNodesStore.getState();
      const nodes = [
        mockNode,
        { ...mockNode, id: '2', name: 'Node 2' },
      ];

      setNodes(nodes);

      const { nodes: storeNodes } = useNodesStore.getState();
      expect(storeNodes).toHaveLength(2);
    });
  });

  describe('clearNodes', () => {
    it('should clear all nodes', () => {
      const { addNode, selectNode, clearNodes } = useNodesStore.getState();
      addNode(mockNode);
      selectNode('1');

      clearNodes();

      const { nodes, selectedNodeId } = useNodesStore.getState();
      expect(nodes).toHaveLength(0);
      expect(selectedNodeId).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { setError } = useNodesStore.getState();
      setError('Test error');

      const { error } = useNodesStore.getState();
      expect(error).toBe('Test error');
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      const { setError, clearError } = useNodesStore.getState();
      setError('Test error');
      clearError();

      const { error } = useNodesStore.getState();
      expect(error).toBeNull();
    });
  });
});
