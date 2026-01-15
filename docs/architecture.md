# Automator67 - Architecture Deep Dive

## System Architecture Overview

### Core Philosophy

Automator67 follows a **distributed microservices architecture** with these key principles:

1. **Decentralization**: No single point of failure
2. **Horizontal Scalability**: Add more nodes to increase capacity
3. **Resource Efficiency**: Minimize overhead on free-tier services
4. **Fault Tolerance**: Graceful degradation and automatic recovery
5. **Eventual Consistency**: Accept temporary inconsistencies for performance

---

## Component Architecture

### 1. Frontend Dashboard (React)

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend Dashboard                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │   Auth UI   │  │  Node        │  │  Deployment   │ │
│  │  - Login    │  │  Management  │  │  Manager      │ │
│  │  - Signup   │  │  - List      │  │  - Create     │ │
│  │  - MFA      │  │  - Add       │  │  - Monitor    │ │
│  └─────────────┘  │  - Remove    │  │  - Scale      │ │
│                   │  - Status    │  └───────────────┘ │
│  ┌─────────────┐  └──────────────┘                    │
│  │ Monitoring  │                   ┌───────────────┐  │
│  │ Dashboard   │  ┌──────────────┐ │  Storage      │  │
│  │  - Metrics  │  │  Database    │ │  Manager      │  │
│  │  - Logs     │  │  Interface   │ │  - Upload     │  │
│  │  - Alerts   │  │  - Query     │ │  - Browse     │  │
│  └─────────────┘  │  - Schema    │ │  - Download   │  │
│                   └──────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Tech Stack**:
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui components
- Zustand for state management
- TanStack Query for data fetching
- WebSocket for real-time updates

**Key Features**:
- Responsive design (mobile-first)
- Dark/light theme
- Real-time node status updates
- Interactive deployment wizard
- Resource usage visualizations
- Log streaming interface

---

### 2. Controller/Orchestrator (Core Brain)

The controller is the central nervous system of FreeCloud. It's a modular service with multiple sub-systems:

```
┌───────────────────────────────────────────────────────────────┐
│                       Controller Service                       │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   API Gateway Layer                      │ │
│  │  - Authentication & Authorization                        │ │
│  │  - Rate Limiting                                         │ │
│  │  - Request Validation                                    │ │
│  │  - API Versioning                                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Registry   │  │     Load     │  │  Deployment  │       │
│  │   Service    │  │   Balancer   │  │   Manager    │       │
│  │              │  │              │  │              │       │
│  │ - Node Store │  │ - Routing    │  │ - Packaging  │       │
│  │ - Discovery  │  │ - Algorithms │  │ - Distribution│      │
│  │ - Metadata   │  │ - Health     │  │ - Rollouts   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    Health    │  │   Storage    │  │   Database   │       │
│  │   Monitor    │  │   Manager    │  │Query Router  │       │
│  │              │  │              │  │              │       │
│  │ - Heartbeat  │  │ - File Mgmt  │  │ - Parsing    │       │
│  │ - Metrics    │  │ - Replication│  │ - Routing    │       │
│  │ - Recovery   │  │ - CDN        │  │ - Aggregation│       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   Data Layer                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │ PostgreSQL   │  │    Redis     │  │    Object    │  │ │
│  │  │  (Registry)  │  │   (Cache)    │  │   Storage    │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

#### 2.1 Registry Service

**Responsibilities**:
- Maintain authoritative list of all nodes
- Store node capabilities and metadata
- Handle node registration/deregistration
- Provide service discovery

**Data Model**:
```typescript
interface NodeRecord {
    id: string;
    name: string;
    provider: CloudProvider;
    status: NodeStatus;
    capabilities: {
        compute: {
            cpu: { cores: number; architecture: string };
            memory: { total: number; available: number };
            storage: { total: number; available: number };
        };
        services: ServiceType[];
        region: string;
        tier: 'free' | 'paid';
    };
    endpoint: string;
    authToken: string; // JWT for node authentication
    metadata: {
        version: string;
        uptime: number;
        lastHeartbeat: Date;
        deployedApps: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

enum NodeStatus {
    INITIALIZING = 'initializing',
    READY = 'ready',
    BUSY = 'busy',
    DEGRADED = 'degraded',
    OFFLINE = 'offline',
    MAINTENANCE = 'maintenance'
}

enum ServiceType {
    COMPUTE = 'compute',
    DATABASE = 'database',
    STORAGE = 'storage',
    CACHE = 'cache'
}
```

**API Operations**:
```typescript
class RegistryService {
    // Node Management
    async registerNode(registration: NodeRegistration): Promise<Node>
    async unregisterNode(nodeId: string): Promise<void>
    async updateNodeStatus(nodeId: string, status: NodeStatus): Promise<void>
    
    // Discovery
    async findNodes(criteria: NodeCriteria): Promise<Node[]>
    async getNode(nodeId: string): Promise<Node>
    async getHealthyNodes(): Promise<Node[]>
    
    // Deployment Tracking
    async assignDeployment(nodeId: string, deploymentId: string): Promise<void>
    async removeDeployment(nodeId: string, deploymentId: string): Promise<void>
}
```

#### 2.2 Load Balancer

**Algorithms**:

1. **Round Robin**
```typescript
class RoundRobinStrategy implements LoadBalancerStrategy {
    private currentIndex = 0;
    
    selectNode(nodes: Node[]): Node {
        const node = nodes[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % nodes.length;
        return node;
    }
}
```

2. **Least Connections**
```typescript
class LeastConnectionsStrategy implements LoadBalancerStrategy {
    async selectNode(nodes: Node[]): Promise<Node> {
        const nodesWithConnections = await Promise.all(
            nodes.map(async node => ({
                node,
                connections: await this.getActiveConnections(node.id)
            }))
        );
        
        return nodesWithConnections.sort((a, b) => 
            a.connections - b.connections
        )[0].node;
    }
}
```

3. **Resource-Based**
```typescript
class ResourceBasedStrategy implements LoadBalancerStrategy {
    async selectNode(nodes: Node[], requirements: ResourceRequirements): Promise<Node> {
        const scored = nodes.map(node => ({
            node,
            score: this.calculateScore(node, requirements)
        }));
        
        return scored.sort((a, b) => b.score - a.score)[0].node;
    }
    
    private calculateScore(node: Node, req: ResourceRequirements): number {
        const cpuScore = node.capabilities.compute.cpu.cores / req.cpu;
        const memScore = node.capabilities.compute.memory.available / req.memory;
        const latencyScore = 1 / (node.metadata.avgLatency || 1);
        
        return cpuScore * 0.3 + memScore * 0.3 + latencyScore * 0.4;
    }
}
```

4. **Geographic**
```typescript
class GeographicStrategy implements LoadBalancerStrategy {
    async selectNode(nodes: Node[], clientLocation: GeoLocation): Promise<Node> {
        const distances = nodes.map(node => ({
            node,
            distance: this.calculateDistance(
                clientLocation,
                node.capabilities.region
            )
        }));
        
        return distances.sort((a, b) => a.distance - b.distance)[0].node;
    }
}
```

#### 2.3 Deployment Manager

**Deployment Workflow**:

```
┌──────────────┐
│ User submits │
│  manifest    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Validate Manifest│
│  - Schema check  │
│  - Resource req  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Select Nodes    │
│  - Match criteria│
│  - Check capacity│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Package App      │
│  - Build image   │
│  - Inject config │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Deploy to Nodes  │
│  (Parallel)      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Health Checks    │
│  - Wait for ready│
│  - Verify running│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│Configure Routing │
│  - Add to LB pool│
│  - Update DNS    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Mark as Active   │
│  - Update registry│
│  - Notify user   │
└──────────────────┘
```

**Implementation**:
```typescript
class DeploymentManager {
    async deploy(manifest: AppManifest): Promise<Deployment> {
        // 1. Validate
        this.validateManifest(manifest);
        
        // 2. Select nodes
        const nodes = await this.selectNodes(
            manifest.resources,
            manifest.replicas
        );
        
        // 3. Package
        const packageUrl = await this.packageApp(manifest);
        
        // 4. Deploy in parallel
        const deployments = await Promise.all(
            nodes.map(node => this.deployToNode(node, packageUrl, manifest))
        );
        
        // 5. Health checks
        await this.waitForHealthy(deployments);
        
        // 6. Configure routing
        await this.configureLoadBalancer(deployments);
        
        // 7. Record deployment
        return await this.recordDeployment({
            manifest,
            nodes,
            deployments,
            status: 'active'
        });
    }
    
    async rollback(deploymentId: string): Promise<void> {
        const deployment = await this.getDeployment(deploymentId);
        const previousVersion = await this.getPreviousVersion(deploymentId);
        
        // Deploy previous version
        await this.deploy(previousVersion.manifest);
        
        // Remove current version
        await this.remove(deploymentId);
    }
    
    async scale(deploymentId: string, replicas: number): Promise<void> {
        const deployment = await this.getDeployment(deploymentId);
        const currentReplicas = deployment.nodes.length;
        
        if (replicas > currentReplicas) {
            // Scale up
            const additionalNodes = replicas - currentReplicas;
            await this.scaleUp(deployment, additionalNodes);
        } else if (replicas < currentReplicas) {
            // Scale down
            const nodesToRemove = currentReplicas - replicas;
            await this.scaleDown(deployment, nodesToRemove);
        }
    }
}
```

#### 2.4 Health Monitor

**Monitoring System**:

```typescript
class HealthMonitor {
    private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
    private readonly UNHEALTHY_THRESHOLD = 3; // failures before marking unhealthy
    
    async startMonitoring(): Promise<void> {
        setInterval(async () => {
            const nodes = await this.registry.getAllNodes();
            await Promise.all(nodes.map(node => this.checkNode(node)));
        }, this.HEARTBEAT_INTERVAL);
    }
    
    async checkNode(node: Node): Promise<HealthStatus> {
        try {
            const response = await axios.get(`${node.endpoint}/health`, {
                timeout: 5000
            });
            
            const health: HealthStatus = {
                nodeId: node.id,
                status: 'healthy',
                metrics: response.data.metrics,
                timestamp: new Date()
            };
            
            await this.recordHealth(health);
            await this.resetFailureCount(node.id);
            
            return health;
        } catch (error) {
            return await this.handleFailure(node, error);
        }
    }
    
    private async handleFailure(node: Node, error: Error): Promise<HealthStatus> {
        const failureCount = await this.incrementFailureCount(node.id);
        
        if (failureCount >= this.UNHEALTHY_THRESHOLD) {
            await this.markUnhealthy(node.id);
            await this.triggerRecovery(node);
        }
        
        return {
            nodeId: node.id,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date()
        };
    }
    
    private async triggerRecovery(node: Node): Promise<void> {
        // 1. Remove from load balancer pool
        await this.loadBalancer.removeNode(node.id);
        
        // 2. Migrate deployments to healthy nodes
        const deployments = await this.registry.getNodeDeployments(node.id);
        await this.migrateDeployments(deployments);
        
        // 3. Attempt to restart node
        await this.attemptRestart(node);
        
        // 4. Notify administrators
        await this.sendAlert({
            severity: 'critical',
            message: `Node ${node.id} is unhealthy and has been removed from rotation`,
            node
        });
    }
}
```

---

### 3. Node Wrapper (Lightweight Agent)

The node wrapper is a minimal agent deployed on each free-tier instance:

```
┌─────────────────────────────────────────────────────┐
│              Node Wrapper (Go Binary)                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │            HTTP Server (Gin)                  │  │
│  │  /health     - Health check                   │  │
│  │  /register   - Registration                   │  │
│  │  /deploy     - Deploy application             │  │
│  │  /metrics    - Resource metrics               │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐               │
│  │  Resource    │  │  Application │               │
│  │  Monitor     │  │  Runner      │               │
│  │              │  │              │               │
│  │ - CPU usage  │  │ - Container  │               │
│  │ - Memory     │  │ - Process    │               │
│  │ - Disk I/O   │  │ - Logs       │               │
│  │ - Network    │  │              │               │
│  └──────────────┘  └──────────────┘               │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐               │
│  │  Log         │  │  Security    │               │
│  │  Shipper     │  │  Module      │               │
│  │              │  │              │               │
│  │ - Stream     │  │ - TLS        │               │
│  │ - Buffer     │  │ - JWT verify │               │
│  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────┘
```

**Implementation** (Go):

```go
// main.go
package main

import (
    "github.com/gin-gonic/gin"
    "log"
)

type NodeWrapper struct {
    ID              string
    ControllerURL   string
    Capabilities    Capabilities
    AppRunner       *ApplicationRunner
    ResourceMonitor *ResourceMonitor
    LogShipper      *LogShipper
}

func (n *NodeWrapper) Start() error {
    router := gin.Default()
    
    // Health check endpoint
    router.GET("/health", n.handleHealth)
    
    // Registration endpoint
    router.POST("/register", n.handleRegister)
    
    // Deployment endpoint
    router.POST("/deploy", n.handleDeploy)
    
    // Metrics endpoint
    router.GET("/metrics", n.handleMetrics)
    
    // Start heartbeat goroutine
    go n.sendHeartbeat()
    
    // Start resource monitoring
    go n.ResourceMonitor.Start()
    
    // Start log shipping
    go n.LogShipper.Start()
    
    return router.Run(":8080")
}

func (n *NodeWrapper) handleHealth(c *gin.Context) {
    metrics := n.ResourceMonitor.GetMetrics()
    
    c.JSON(200, gin.H{
        "status": "healthy",
        "metrics": metrics,
        "uptime": n.getUptime(),
    })
}

func (n *NodeWrapper) handleDeploy(c *gin.Context) {
    var manifest AppManifest
    if err := c.BindJSON(&manifest); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // Deploy application
    deployment, err := n.AppRunner.Deploy(manifest)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(200, deployment)
}

// Resource monitoring
type ResourceMonitor struct {
    metrics *Metrics
}

func (rm *ResourceMonitor) Start() {
    ticker := time.NewTicker(5 * time.Second)
    defer ticker.Stop()
    
    for range ticker.C {
        rm.collectMetrics()
    }
}

func (rm *ResourceMonitor) collectMetrics() {
    // Collect CPU usage
    cpuPercent, _ := cpu.Percent(time.Second, false)
    
    // Collect memory usage
    vmStat, _ := mem.VirtualMemory()
    
    // Collect disk usage
    diskStat, _ := disk.Usage("/")
    
    rm.metrics = &Metrics{
        CPU:    cpuPercent[0],
        Memory: vmStat.UsedPercent,
        Disk:   diskStat.UsedPercent,
        Timestamp: time.Now(),
    }
}
```

**Binary Size Optimization**:
- Strip debug symbols: `-ldflags="-s -w"`
- Use UPX compression
- Target size: <10MB
- Target RAM usage: <50MB

---

### 4. Database Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Virtual Database Interface                   │
│  (Single unified schema from user's perspective)             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Query Router                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐│
│  │ Query Parser   │→ │  Query Plan    │→ │  Execution    ││
│  │ - SQL parse    │  │  - Shard lookup│  │  - Parallel   ││
│  │ - Validation   │  │  - Optimization│  │  - Aggregate  ││
│  └────────────────┘  └────────────────┘  └───────────────┘│
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Physical DB 1│  │ Physical DB 2│  │ Physical DB 3│
│  (Supabase)  │  │  (MongoDB)   │  │  (Firebase)  │
│              │  │              │  │              │
│ Shard: 0-33% │  │ Shard: 34-66%│  │ Shard: 67-99%│
└──────────────┘  └──────────────┘  └──────────────┘
```

**Sharding Strategy**:

```typescript
// Consistent hashing for data distribution
class ShardManager {
    private readonly VIRTUAL_NODES = 150; // Virtual nodes per physical node
    private ring: Map<number, PhysicalDB> = new Map();
    
    constructor(physicalDBs: PhysicalDB[]) {
        this.initializeRing(physicalDBs);
    }
    
    private initializeRing(dbs: PhysicalDB[]): void {
        for (const db of dbs) {
            for (let i = 0; i < this.VIRTUAL_NODES; i++) {
                const virtualNodeKey = `${db.id}:${i}`;
                const hash = this.hash(virtualNodeKey);
                this.ring.set(hash, db);
            }
        }
    }
    
    getShardForKey(key: string): PhysicalDB {
        const hash = this.hash(key);
        const sortedHashes = Array.from(this.ring.keys()).sort((a, b) => a - b);
        
        // Find first hash >= our key's hash
        for (const ringHash of sortedHashes) {
            if (ringHash >= hash) {
                return this.ring.get(ringHash)!;
            }
        }
        
        // Wrap around to first node
        return this.ring.get(sortedHashes[0])!;
    }
    
    private hash(key: string): number {
        // MurmurHash3 or similar
        return murmur3(key);
    }
}
```

**Query Execution**:

```typescript
class QueryExecutor {
    async execute(query: ParsedQuery): Promise<QueryResult> {
        if (query.type === 'SELECT') {
            return await this.executeSelect(query);
        } else if (query.type === 'INSERT') {
            return await this.executeInsert(query);
        } else if (query.type === 'UPDATE') {
            return await this.executeUpdate(query);
        } else if (query.type === 'DELETE') {
            return await this.executeDelete(query);
        }
    }
    
    private async executeSelect(query: SelectQuery): Promise<QueryResult> {
        // 1. Determine affected shards
        const shards = await this.determineShards(query);
        
        // 2. Rewrite query for each shard
        const shardQueries = shards.map(shard => 
            this.rewriteQueryForShard(query, shard)
        );
        
        // 3. Execute in parallel
        const results = await Promise.all(
            shardQueries.map(sq => this.executeOnShard(sq.shard, sq.query))
        );
        
        // 4. Aggregate results
        return this.aggregateResults(results, query);
    }
    
    private aggregateResults(
        results: ShardResult[],
        query: SelectQuery
    ): QueryResult {
        let aggregated = results.flatMap(r => r.rows);
        
        // Apply ORDER BY
        if (query.orderBy) {
            aggregated = this.applyOrderBy(aggregated, query.orderBy);
        }
        
        // Apply LIMIT/OFFSET
        if (query.limit) {
            const offset = query.offset || 0;
            aggregated = aggregated.slice(offset, offset + query.limit);
        }
        
        // Apply aggregate functions (SUM, COUNT, AVG, etc.)
        if (query.aggregates) {
            aggregated = this.applyAggregates(aggregated, query.aggregates);
        }
        
        return { rows: aggregated, count: aggregated.length };
    }
}
```

---

### 5. Storage Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Storage Manager (Controller)                │
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │ File Registry │  │  Chunk Manager │  │  Replication   ││
│  │  - Metadata   │  │  - Split/merge │  │  - Strategy    ││
│  │  - Locations  │  │  - Dedup       │  │  - Sync        ││
│  └───────────────┘  └────────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Supabase     │  │  Firebase    │  │ Cloudinary   │
│ Storage      │  │  Storage     │  │              │
│ 1GB free     │  │  5GB free    │  │ 25GB free    │
└──────────────┘  └──────────────┘  └──────────────┘
```

**File Storage**:

```typescript
class StorageManager {
    async uploadFile(
        file: Buffer,
        path: string,
        options: UploadOptions = {}
    ): Promise<FileMetadata> {
        // 1. Calculate checksum
        const checksum = this.calculateChecksum(file);
        
        // 2. Check for duplicates
        const existing = await this.findByChecksum(checksum);
        if (existing) {
            return this.createReference(existing, path);
        }
        
        // 3. Chunk if large
        const chunks = this.chunkFile(file, options.chunkSize || 5MB);
        
        // 4. Select storage nodes
        const nodes = await this.selectStorageNodes(
            chunks.length,
            options.replicas || 3
        );
        
        // 5. Upload chunks in parallel
        const uploads = await Promise.all(
            chunks.map((chunk, index) => 
                this.uploadChunk(chunk, nodes[index % nodes.length])
            )
        );
        
        // 6. Create metadata record
        const metadata: FileMetadata = {
            id: uuidv4(),
            path,
            size: file.length,
            checksum,
            chunks: uploads.map(u => ({
                id: u.chunkId,
                nodeId: u.nodeId,
                index: u.index
            })),
            createdAt: new Date()
        };
        
        await this.fileRegistry.save(metadata);
        
        return metadata;
    }
    
    async downloadFile(path: string): Promise<Buffer> {
        // 1. Lookup metadata
        const metadata = await this.fileRegistry.findByPath(path);
        if (!metadata) {
            throw new Error('File not found');
        }
        
        // 2. Download chunks in parallel
        const chunks = await Promise.all(
            metadata.chunks.map(chunk => 
                this.downloadChunk(chunk.id, chunk.nodeId)
            )
        );
        
        // 3. Sort by index and concatenate
        chunks.sort((a, b) => a.index - b.index);
        const file = Buffer.concat(chunks.map(c => c.data));
        
        // 4. Verify checksum
        if (this.calculateChecksum(file) !== metadata.checksum) {
            throw new Error('Checksum mismatch');
        }
        
        return file;
    }
}
```

---

## Communication Patterns

### 1. Controller ↔ Node

**Protocol**: gRPC for efficiency

```protobuf
// node-wrapper.proto
syntax = "proto3";

service NodeService {
    rpc RegisterNode(RegistrationRequest) returns (RegistrationResponse);
    rpc Heartbeat(HeartbeatRequest) returns (HeartbeatResponse);
    rpc DeployApp(DeploymentRequest) returns (DeploymentResponse);
    rpc GetMetrics(MetricsRequest) returns (MetricsResponse);
}

message RegistrationRequest {
    string node_id = 1;
    Capabilities capabilities = 2;
    string endpoint = 3;
}

message HeartbeatRequest {
    string node_id = 1;
    Metrics metrics = 2;
}
```

### 2. Frontend ↔ Controller

**REST API** for CRUD operations:
```
GET    /api/v1/nodes
POST   /api/v1/nodes
DELETE /api/v1/nodes/:id
POST   /api/v1/deployments
GET    /api/v1/deployments/:id
```

**WebSocket** for real-time updates:
```typescript
// client
const ws = new WebSocket('wss://controller.example.com/ws');

ws.on('message', (data) => {
    const event = JSON.parse(data);
    if (event.type === 'node.status.changed') {
        updateNodeStatus(event.payload);
    }
});
```

---

## Security Architecture

### Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │Controller│
└────┬─────┘                                    └────┬─────┘
     │                                               │
     │  1. POST /auth/login                         │
     │  { email, password }                         │
     ├──────────────────────────────────────────────>
     │                                               │
     │  2. Verify credentials                       │
     │     Generate JWT                             │
     │     Generate refresh token                   │
     │<──────────────────────────────────────────────
     │  { accessToken, refreshToken }               │
     │                                               │
     │  3. Store tokens securely                    │
     │                                               │
     │  4. Use access token for API calls           │
     │  Authorization: Bearer <accessToken>         │
     ├──────────────────────────────────────────────>
     │                                               │
     │  5. Token expired (401)                      │
     │<──────────────────────────────────────────────
     │                                               │
     │  6. POST /auth/refresh                       │
     │  { refreshToken }                            │
     ├──────────────────────────────────────────────>
     │                                               │
     │  7. New access token                         │
     │<──────────────────────────────────────────────
     │  { accessToken }                             │
```

### Credential Encryption

```typescript
// Client-side encryption
class CredentialVault {
    async encrypt(
        credentials: CloudCredentials,
        masterPassword: string
    ): Promise<EncryptedBlob> {
        // Derive key from master password
        const salt = crypto.randomBytes(32);
        const key = await argon2.hash(masterPassword, {
            salt,
            type: argon2.argon2id,
            memoryCost: 65536, // 64 MB
            timeCost: 3,
            parallelism: 4
        });
        
        // Encrypt credentials
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(credentials)),
            cipher.final()
        ]);
        const authTag = cipher.getAuthTag();
        
        return {
            salt: salt.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
            encrypted: encrypted.toString('base64')
        };
    }
}
```

---

## Deployment Patterns

### Blue-Green Deployment

```typescript
async function blueGreenDeploy(
    currentDeployment: Deployment,
    newManifest: AppManifest
): Promise<void> {
    // 1. Deploy new version (green)
    const greenDeployment = await deploymentManager.deploy(newManifest);
    
    // 2. Run smoke tests
    const testsPassed = await runSmokeTests(greenDeployment);
    
    if (testsPassed) {
        // 3. Switch traffic to green
        await loadBalancer.switchTraffic(
            currentDeployment.id,
            greenDeployment.id
        );
        
        // 4. Monitor for issues
        await sleep(5 * 60 * 1000); // 5 minutes
        
        // 5. Tear down blue
        await deploymentManager.remove(currentDeployment.id);
    } else {
        // Rollback: remove green
        await deploymentManager.remove(greenDeployment.id);
        throw new Error('Deployment failed smoke tests');
    }
}
```

### Canary Deployment

```typescript
async function canaryDeploy(
    currentDeployment: Deployment,
    newManifest: AppManifest,
    canaryPercent: number = 10
): Promise<void> {
    // 1. Deploy canary (10% traffic)
    const canaryDeployment = await deploymentManager.deploy({
        ...newManifest,
        replicas: Math.ceil(currentDeployment.replicas * canaryPercent / 100)
    });
    
    // 2. Route 10% traffic to canary
    await loadBalancer.setTrafficSplit({
        [currentDeployment.id]: 90,
        [canaryDeployment.id]: 10
    });
    
    // 3. Monitor metrics
    const metricsOk = await monitorCanary(canaryDeployment, 10 * 60 * 1000);
    
    if (metricsOk) {
        // 4. Gradually increase traffic
        for (const percent of [25, 50, 75, 100]) {
            await loadBalancer.setTrafficSplit({
                [currentDeployment.id]: 100 - percent,
                [canaryDeployment.id]: percent
            });
            await sleep(5 * 60 * 1000);
        }
        
        // 5. Remove old deployment
        await deploymentManager.remove(currentDeployment.id);
    } else {
        // Rollback
        await deploymentManager.remove(canaryDeployment.id);
        throw new Error('Canary deployment metrics degraded');
    }
}
```

---

## Failure Handling

### Node Failure

```typescript
async function handleNodeFailure(nodeId: string): Promise<void> {
    // 1. Mark node as offline
    await registry.updateNodeStatus(nodeId, NodeStatus.OFFLINE);
    
    // 2. Remove from load balancer pool
    await loadBalancer.removeNode(nodeId);
    
    // 3. Get deployments on failed node
    const deployments = await registry.getNodeDeployments(nodeId);
    
    // 4. For each deployment, migrate to healthy node
    for (const deployment of deployments) {
        const healthyNode = await loadBalancer.selectHealthyNode(
            deployment.requirements
        );
        
        await deploymentManager.deployToNode(
            healthyNode.id,
            deployment.manifest
        );
    }
    
    // 5. Notify administrators
    await alerting.send({
        severity: 'critical',
        title: 'Node Failure',
        message: `Node ${nodeId} has failed. Deployments migrated.`
    });
}
```

---

## Advanced Distributed Database Design

### Query Routing Algorithm

```typescript
async function routeAndExecuteQuery(sqlQuery: string): Promise<any[]> {
    // Step 1: Parse Query
    const ast = parseSQL(sqlQuery);
    const tables = ast.getTables();
    const where = ast.getWhereClause();
    
    // Step 2: Identify Affected Shards
    const shards = new Set<ShardID>();
    for (const table of tables) {
        const schema = schemaRegistry.get(table);
        
        if (!where || !this.canDetermineShardFromWhere(schema, where)) {
            // Affects all shards
            shards.add(...getAllShards(table));
        } else {
            // Affects specific shards based on WHERE clause
            const affectedShards = this.determineAffectedShards(
                schema,
                where
            );
            affectedShards.forEach(s => shards.add(s));
        }
    }
    
    // Step 3: Generate Execution Plans
    const plans = [];
    for (const shard of shards) {
        const rewrittenQuery = this.rewriteQueryForShard(sqlQuery, shard);
        const dbNode = await registry.selectBestDBReplica(shard);
        plans.push({
            shard,
            query: rewrittenQuery,
            node: dbNode
        });
    }
    
    // Step 4: Execute in Parallel
    const results = await Promise.allSettled(
        plans.map(plan => 
            this.executeWithRetry(plan.node, plan.query)
        )
    );
    
    // Step 5: Handle Failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
        // Log failures but try to continue
        logger.warn(`Query execution failed on ${failures.length} shards`);
        
        // Implement circuit breaker logic
        await circuitBreaker.recordFailures(failures);
    }
    
    // Step 6: Aggregate Results
    const successResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
        .flat();
    
    // Step 7: Apply Post-Aggregation Operations
    if (ast.hasDistinct()) {
        return deduplicateResults(successResults);
    }
    
    if (ast.hasGroupBy()) {
        return groupResults(successResults, ast.getGroupByColumns());
    }
    
    if (ast.hasOrderBy()) {
        return sortResults(successResults, ast.getOrderByColumns());
    }
    
    return successResults;
}
```

### Database Consistency Levels

```typescript
enum ConsistencyLevel {
    STRONG,        // Wait for primary, blocks until confirmed
    EVENTUAL,      // Return immediately, replicate async
    READ_YOUR_WRITE, // Can read own writes but may read stale others
    MONOTONIC_READ   // Always read same or newer version
}

class ConsistencyManager {
    async writeWithConsistency(
        table: string,
        record: any,
        level: ConsistencyLevel
    ): Promise<void> {
        const shard = getShardForRecord(record);
        const primary = await registry.getPrimary(shard);
        
        switch (level) {
            case ConsistencyLevel.STRONG:
                // 2PC (Two-Phase Commit) for critical operations
                const txnId = await primary.beginTransaction();
                try {
                    await primary.insert(table, record, txnId);
                    await primary.commitTransaction(txnId);
                } catch (e) {
                    await primary.rollbackTransaction(txnId);
                    throw e;
                }
                break;
                
            case ConsistencyLevel.EVENTUAL:
                // Fire and forget
                await primary.insertAsync(table, record);
                // Replication happens in background
                break;
                
            case ConsistencyLevel.READ_YOUR_WRITE:
                // Write to primary, immediately return
                // Track version number for this write
                const result = await primary.insert(table, record);
                sessionStore.setLastWriteVersion(result.version);
                break;
        }
    }
}
```

---

## Multi-Dimensional Load Balancing Deep Dive

### Scoring Algorithm with Time Decay

```typescript
class AdvancedLoadBalancer {
    // Track historical performance
    private metrics = new Map<NodeID, HistoricalMetrics>();
    
    private calculateScore(node: Node, request: Request): number {
        const now = Date.now();
        const metrics = this.metrics.get(node.id);
        
        // 1. Current resource availability (weight: 30%)
        const cpuScore = (100 - node.cpu.percent) / 100;
        const memScore = (100 - node.memory.percent) / 100;
        const resourceScore = (cpuScore + memScore) / 2;
        
        // 2. Network latency (weight: 25%)
        const latencyScore = Math.max(
            0,
            1 - (node.network.latency / 500) // Normalized to 500ms
        );
        
        // 3. Connection count (weight: 20%)
        const connScore = Math.max(
            0,
            1 - (node.connections.active / node.connections.max)
        );
        
        // 4. Historical performance with time decay (weight: 15%)
        let histScore = 0.5;
        if (metrics) {
            const responseTimes = metrics.recentLatencies;
            const avgResponseTime = response Times.reduce((a, b) => a + b, 0) 
                / responseTime.length;
            histScore = Math.max(0, 1 - (avgResponseTime / 2000));
            
            // Apply time decay: older data is less relevant
            const timeSinceUpdate = now - metrics.lastUpdate;
            const decayFactor = Math.exp(-timeSinceUpdate / (60 * 1000)); // 1 min half-life
            histScore *= decayFactor;
        }
        
        // 5. Failure rate (weight: 10%, negative impact)
        let failureScore = 1;
        if (metrics && metrics.totalRequests > 100) {
            const errorRate = metrics.failedRequests / metrics.totalRequests;
            failureScore = Math.max(0, 1 - (errorRate * 10));
        }
        
        // Combine with weights
        const totalScore = 
            (resourceScore * 0.30) +
            (latencyScore * 0.25) +
            (connScore * 0.20) +
            (histScore * 0.15) +
            (failureScore * 0.10);
        
        return totalScore;
    }
    
    async selectNode(nodes: Node[], request: Request): Promise<Node> {
        // Calculate scores for all nodes
        const scores = nodes
            .map(node => ({
                node,
                score: this.calculateScore(node, request)
            }))
            .sort((a, b) => b.score - a.score);
        
        if (scores.length === 0) {
            throw new Error('No healthy nodes available');
        }
        
        // Add randomization to top candidates to prevent thundering herd
        const topCandidates = Math.min(3, Math.ceil(scores.length / 3));
        const selectedIndex = Math.floor(Math.random() * topCandidates);
        
        const selected = scores[selectedIndex].node;
        
        // Record this selection for future weighted decisions
        await this.recordNodeSelection(selected.id);
        
        return selected;
    }
}
```

### Request Queue Management

```typescript
class RequestQueue {
    private queues = new Map<NodeID, Queue<Request>>();
    private maxQueueSize = 1000;
    
    async enqueue(request: Request, nodeId: NodeID): Promise<void> {
        if (!this.queues.has(nodeId)) {
            this.queues.set(nodeId, new Queue());
        }
        
        const queue = this.queues.get(nodeId)!;
        
        if (queue.size() >= this.maxQueueSize) {
            throw new Error(
                `Node ${nodeId} queue full. Consider scaling.`
            );
        }
        
        queue.push(request);
    }
    
    async dequeue(nodeId: NodeID): Promise<Request | null> {
        const queue = this.queues.get(nodeId);
        return queue?.pop() || null;
    }
    
    getQueueSize(nodeId: NodeID): number {
        return this.queues.get(nodeId)?.size() || 0;
    }
}
```

---

## Storage Federation Architecture

### File Distribution Strategy

```typescript
class StorageDistribution {
    async uploadFile(
        file: Buffer,
        path: string,
        options: {
            replicas?: number,
            geoPreference?: string[],
            minLatency?: number
        }
    ): Promise<FileMetadata> {
        // 1. Determine replication factor
        const replicaCount = options.replicas || 3;
        const chunkSize = 5 * 1024 * 1024; // 5MB chunks
        
        // 2. Split into chunks if large
        const chunks = [];
        for (let i = 0; i < file.length; i += chunkSize) {
            chunks.push(file.slice(i, i + chunkSize));
        }
        
        // 3. For each chunk, select storage nodes
        const distribution = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const nodes = await this.selectStorageNodes(
                replicaCount,
                options.geoPreference
            );
            
            // 4. Upload chunk to selected nodes in parallel
            const uploads = nodes.map(node => 
                this.uploadChunkToNode(node, chunk, path, i)
            );
            
            const results = await Promise.allSettled(uploads);
            
            // 5. Track where chunk is stored
            distribution.push({
                chunkIndex: i,
                nodes: nodes.filter((n, idx) => 
                    results[idx].status === 'fulfilled'
                )
            });
        }
        
        // 6. Create file metadata
        const metadata: FileMetadata = {
            id: uuid(),
            path,
            size: file.length,
            chunks: chunks.length,
            distribution,
            created: new Date(),
            replicas: replicaCount
        };
        
        // 7. Store metadata in registry
        await fileRegistry.store(metadata);
        
        return metadata;
    }
    
    private async selectStorageNodes(
        count: number,
        geoPreference?: string[]
    ): Promise<StorageNode[]> {
        // Get available storage nodes
        const allNodes = await registry.getStorageNodes();
        
        // Filter by available space
        const available = allNodes.filter(n => 
            n.availableSpace > 10 * 1024 * 1024 // At least 10MB
        );
        
        // Filter by geo preference
        let filtered = available;
        if (geoPreference) {
            filtered = available.filter(n =>
                geoPreference.includes(n.region)
            );
        }
        
        // Ensure geographic distribution
        const selected = this.distributeGeographically(
            filtered,
            count
        );
        
        return selected;
    }
    
    private distributeGeographically(
        nodes: StorageNode[],
        count: number
    ): StorageNode[] {
        // Group by region
        const byRegion = new Map<string, StorageNode[]>();
        for (const node of nodes) {
            if (!byRegion.has(node.region)) {
                byRegion.set(node.region, []);
            }
            byRegion.get(node.region)!.push(node);
        }
        
        // Select from different regions to minimize correlated failures
        const selected: StorageNode[] = [];
        for (const region of byRegion.keys()) {
            const regionNodes = byRegion.get(region)!;
            const node = regionNodes[0]; // Best node in region
            selected.push(node);
            if (selected.length >= count) break;
        }
        
        // If not enough regions, add duplicates from best regions
        while (selected.length < count) {
            const node = nodes[0]; // Best overall node
            selected.push(node);
        }
        
        return selected;
    }
}
```

---

## Monitoring & Observability Architecture

### Metrics Collection System

```typescript
class MetricsCollector {
    // Time-series database for storing metrics
    private tsdb: InfluxDB;
    
    async collectNodeMetrics(nodeId: NodeID): Promise<void> {
        const node = await registry.getNode(nodeId);
        const client = new NodeClient(node.endpoint);
        
        try {
            const metrics = await client.getMetrics();
            
            // Store in time-series database
            await this.tsdb.write({
                measurement: 'node_metrics',
                tags: {
                    nodeId,
                    region: node.region,
                    provider: node.provider
                },
                fields: {
                    cpu_percent: metrics.cpu.percent,
                    memory_percent: metrics.memory.percent,
                    disk_percent: metrics.disk.percent,
                    network_in: metrics.network.bytesIn,
                    network_out: metrics.network.bytesOut,
                    active_connections: metrics.connections.active,
                    uptime: metrics.uptime
                },
                timestamp: new Date()
            });
            
            // Also update in-memory cache for fast access
            await cache.set(
                `node:metrics:${nodeId}`,
                metrics,
                300 // 5 min TTL
            );
            
        } catch (error) {
            logger.error(`Failed to collect metrics for ${nodeId}`, error);
        }
    }
    
    // Aggregate metrics for dashboards
    async getNodeStats(nodeId: NodeID): Promise<NodeStats> {
        // Query last hour of metrics
        const query = `
            SELECT mean(cpu_percent), mean(memory_percent)
            FROM node_metrics
            WHERE nodeId = '${nodeId}'
            AND time > now() - 1h
            GROUP BY time(5m)
        `;
        
        const results = await this.tsdb.query(query);
        
        // Calculate statistics
        return {
            cpuAvg: results.cpuAvg,
            memoryAvg: results.memoryAvg,
            cpuMax: results.cpuMax,
            memoryMax: results.memoryMax,
            uptime: (await registry.getNode(nodeId)).uptime
        };
    }
}
```

### Distributed Tracing

```typescript
class DistributedTracer {
    private tracer = opentelemetry.trace.getTracer('freecloud');
    
    async traceRequest(request: Request): Promise<Response> {
        const span = this.tracer.startSpan('http.request', {
            attributes: {
                'http.method': request.method,
                'http.url': request.url,
                'http.client_ip': request.ip
            }
        });
        
        const context = trace.setSpan(
            context.active(),
            span
        );
        
        return context.with(async () => {
            try {
                // Phase 1: Routing
                const routeSpan = this.tracer.startSpan('route.selection');
                const selectedNode = await this.selectNode(request);
                routeSpan.end();
                
                // Phase 2: Execute
                const execSpan = this.tracer.startSpan('request.execute', {
                    attributes: {
                        'node.id': selectedNode.id
                    }
                });
                const response = await selectedNode.handle(request);
                execSpan.end();
                
                span.setStatus({ code: SpanStatusCode.OK });
                return response;
                
            } catch (error) {
                span.recordException(error);
                span.setStatus({ 
                    code: SpanStatusCode.ERROR,
                    message: error.message 
                });
                throw error;
            } finally {
                span.end();
            }
        });
    }
}
```

---

This architecture document serves as a comprehensive reference for implementing all advanced features of Automator67. Each component is designed with production-grade reliability, observability, and performance in mind.

