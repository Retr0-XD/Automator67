# Specification: Controller/Orchestrator Service

**Component**: Central orchestration service  
**Language**: Node.js + TypeScript  
**Version**: 1.0  
**Status**: Specification - Ready for Review

---

## 1. Component Purpose

The Controller/Orchestrator is the **brain of Automator67**. It is responsible for:
- Managing the distributed system of nodes
- Orchestrating application deployments
- Routing database queries to correct shards
- Load balancing across nodes
- Monitoring node health and auto-recovery
- Managing user credentials securely
- Coordinating inter-node communication
- Serving as single source of truth for system state

### Key Principle
**Controller is the ONLY component that understands system topology** - Nodes don't communicate with each other, everything flows through Controller.

---

## 2. Responsibilities & Boundaries

### ✅ Controller IS Responsible For:
1. **User Management**
   - User registration
   - User authentication (login/logout)
   - JWT token generation and validation
   - User session management

2. **Node Registry & Discovery**
   - Node registration and deregistration
   - Node status tracking (health, metrics, capabilities)
   - Node capacity management
   - Node location information

3. **Load Balancing**
   - Selecting best nodes for deployments
   - Distributing traffic across replicas
   - Resource-aware node selection
   - Failover and recovery

4. **Deployment Management**
   - Parsing deployment manifests
   - Building application packages
   - Deploying to nodes in parallel
   - Monitoring deployment progress
   - Health checking deployed apps
   - Scaling and rolling updates

5. **Health Monitoring**
   - Receiving heartbeats from nodes
   - Detecting node failures
   - Triggering automatic recovery
   - Collecting and aggregating metrics

6. **Database Federation**
   - Routing queries to correct shards
   - Parsing SQL queries
   - Schema management
   - Transaction coordination

7. **Storage Federation**
   - Managing file distribution
   - Coordinating replication
   - Garbage collection

8. **Credential Management**
   - Storing encrypted OAuth tokens
   - Rotating tokens
   - Providing credentials to nodes securely
   - Never exposing plaintext tokens

9. **API Gateway**
   - Accepting requests from Dashboard
   - Request validation
   - Authentication/Authorization
   - Response formatting
   - Error handling

### ❌ Controller IS NOT Responsible For:
- Running user applications (nodes do this)
- Storing user files (nodes/providers do this)
- Executing database queries directly (nodes do this)
- Creating infrastructure on providers (orchestrators on providers handle this)
- User data storage (use managed DB)

---

## 3. Data Models

### 3.1 User Model

```
User {
  id: UUID (primary key)
  email: string (unique index)
  password_hash: string (salted, hashed with bcrypt)
  created_at: timestamp
  last_login: timestamp
  mfa_enabled: boolean
  active: boolean
}
```

### 3.2 Node Model (Storage)

```
Node {
  id: UUID (unique identifier)
  user_id: UUID (foreign key to User)
  provider: string enum (render, railway, flyio, vercel, netlify)
  endpoint: string (URL to node wrapper API)
  region: string (geographic region)
  status: string enum (initializing, ready, busy, degraded, failed, removed)
  
  capabilities: {
    cpu_cores: number
    memory_gb: number
    disk_gb: number
    network_bandwidth_mbps: number
    max_concurrent_requests: number
  }
  
  metrics_current: {
    cpu_percent: number
    memory_percent: number
    disk_percent: number
    active_requests: number
    error_rate: number (percent)
    avg_response_time_ms: number
  }
  
  credentials: {
    oauth_token_encrypted: string (encrypted with master key)
    oauth_provider: string
    oauth_expires_at: timestamp
  }
  
  created_at: timestamp
  last_heartbeat: timestamp
  last_metrics_update: timestamp
}

Indices:
- UNIQUE (user_id, provider, id)
- INDEX (status)
- INDEX (provider)
- INDEX (last_heartbeat)
```

### 3.3 Deployment Model (Storage)

```
Deployment {
  id: UUID (primary key)
  user_id: UUID (foreign key to User)
  name: string
  app_type: string enum (backend, worker, cron)
  status: string enum (pending, deploying, running, failing, failed, scaling, stopped)
  
  manifest: {
    runtime: string
    entrypoint: string
    resources: {
      memory: string (e.g., "512MB")
      cpu: string (e.g., "0.5")
      storage: string
    }
    replicas: number
    env: Record<string, string> (encrypted)
    health_check: {
      path: string
      interval: number (seconds)
      timeout: number (seconds)
      retries: number
    }
  }
  
  node_assignments: [
    {
      node_id: UUID
      replica_index: number
      status: string (pending, running, failed, stopping)
      started_at: timestamp
      error_message: string (null if success)
    }
  ]
  
  current_replicas: number
  desired_replicas: number
  
  endpoints: string[] (URLs to access deployed app)
  
  created_at: timestamp
  updated_at: timestamp
  deployed_at: timestamp
  last_scaled_at: timestamp
}

Indices:
- UNIQUE (user_id, name)
- INDEX (status)
- INDEX (user_id)
```

### 3.4 Database Instance Model (Storage)

```
DatabaseInstance {
  id: UUID (primary key)
  user_id: UUID (foreign key)
  name: string
  provider: string enum (supabase, mongodb, firebase, postgresql)
  provider_specific_id: string (provider's database ID)
  
  connection: {
    endpoint: string
    port: number
    database_name: string
    credentials_encrypted: string
  }
  
  sharding: {
    strategy: string enum (hash, range, directory)
    shard_count: number
    sharding_key: string
  }
  
  replication: {
    primary_node_id: UUID
    replica_node_ids: UUID[]
  }
  
  schema_info: {
    tables: [
      {
        name: string
        columns: [
          {
            name: string
            type: string
            nullable: boolean
          }
        ]
      }
    ]
  }
  
  created_at: timestamp
  last_synced: timestamp
}
```

### 3.5 Storage File Metadata Model

```
StorageFile {
  id: UUID (primary key)
  user_id: UUID (foreign key)
  path: string (e.g., "documents/file.pdf")
  size: number (bytes)
  mime_type: string (e.g., "application/pdf")
  
  distribution: [
    {
      node_id: UUID
      provider: string
      storage_path: string (provider-specific path)
      status: string enum (uploading, ready, failed)
    }
  ]
  
  chunks: [
    {
      index: number
      size: number
      checksum: string (SHA-256)
      locations: {
        node_id: UUID
        storage_path: string
      }[]
    }
  ]
  
  checksum: string (SHA-256 of entire file)
  encryption: {
    algorithm: string
    key_id: UUID (for key rotation)
  }
  
  replicas: number
  replication_status: string enum (replicating, complete, degraded)
  
  created_at: timestamp
  modified_at: timestamp
  last_accessed: timestamp
}
```

### 3.6 Health Status Model (In-Memory/Cache)

```
NodeHealthStatus {
  node_id: UUID
  timestamp: timestamp
  status: string enum (healthy, suspect, failed)
  consecutive_failures: number
  last_successful_heartbeat: timestamp
  
  metrics: {
    cpu_percent: number
    memory_percent: number
    disk_percent: number
    active_requests: number
    error_rate: number
    avg_response_time_ms: number
  }
  
  active_deployments: UUID[]
  available_capacity: {
    cpu: number
    memory: number
    disk: number
  }
}
```

---

## 4. Core Subsystems & Process Flows

### 4.1 Node Registration Flow

```
Sequence: Node Wrapper → Controller API → Database → Registry Cache

1. Node Wrapper (already deployed) starts
2. Node Wrapper generates self-signed TLS certificates
3. Node Wrapper starts HTTP server on port 8080
4. Node Wrapper makes POST request to controller:
   - Endpoint: POST /api/v1/nodes/register
   - Body: {
       node_id: UUID
       provider: string
       endpoint: string (public URL)
       capabilities: {cpu, memory, disk, bandwidth}
     }

5. Controller validates request:
   - Verify TLS certificate validity
   - Verify OAuth token present and valid
   - Verify node_id format

6. Controller stores in database:
   - INSERT INTO nodes (id, user_id, provider, endpoint, ...)
   - VALUES (node_id, user_id, provider, endpoint, ...)
   - Status: 'initializing'

7. Controller starts health monitor:
   - Add node_id to active monitoring list
   - Schedule first heartbeat collection in 30 seconds

8. Controller returns to node:
   - 200 OK with controller endpoint and credentials

9. Controller updates cache:
   - Add node to in-memory registry
   - Set status to 'initializing'

10. Node Wrapper receives response:
    - Stores controller endpoint
    - Starts heartbeat reporter (30s interval)

11. First heartbeat is collected:
    - Node metrics collected
    - Status updated to 'ready'
    - Node appears in Dashboard

Error Scenarios:
- OAuth token invalid → 401 Unauthorized, node must re-authenticate
- Node already registered → 409 Conflict, return existing node_id
- Database error → 500, retry mechanism on node side
- Network error → Node retries with exponential backoff
```

### 4.2 Load Balancer Algorithm

```
Process: Evaluate All Healthy Nodes → Calculate Scores → Select Best N → Random Pick

1. Trigger: Deployment requested or traffic routing needed

2. Get list of all healthy nodes for deployment:
   SELECT * FROM nodes 
   WHERE status IN ('ready', 'busy') 
   AND user_id = {user_id}

3. Filter by deployment requirements:
   - Has required CPU cores available
   - Has required memory available
   - Has required disk space available
   - Node type matches (compute, database, storage)

4. For each remaining node, calculate composite score:
   
   cpu_score = (100 - current_cpu_percent) / 100
   memory_score = (100 - current_memory_percent) / 100
   latency_score = max(0, 1 - (latency_ms / 500))
   
   // Penalize nodes at capacity
   if (current_cpu_percent > 80) cpu_score *= 0.5
   if (current_memory_percent > 80) memory_score *= 0.5
   
   // Weight different factors
   total_score = (
     cpu_score * 0.30 +
     memory_score * 0.25 +
     latency_score * 0.20 +
     connection_score * 0.15 +
     historical_reliability * 0.10
   )

5. Sort nodes by score (descending)

6. Select top N nodes:
   - For deployments: N = replicas
   - Ensure geographic diversity if possible

7. If less than N nodes available:
   - Return error "Insufficient capacity"
   - Suggest scaling or waiting

8. Distribute replicas across selected nodes:
   - Prefer different regions (avoid correlated failures)
   - Load balance evenly

9. Update load balancer routes

Error Scenarios:
- No healthy nodes → Error: "All nodes failed"
- Insufficient capacity → Error: "Insufficient capacity for N replicas"
- Network error retrieving metrics → Use cached metrics from last 30s
```

### 4.3 Deployment Flow

```
Sequence: Dashboard → Controller → Load Balancer → Nodes → Registry

1. Dashboard sends deployment request:
   POST /api/v1/deployments
   Body: {manifest}

2. Controller validates manifest:
   - Check all required fields present
   - Validate resource specifications
   - Verify environment variable limits
   - Check app name is unique for user

3. Controller selects nodes:
   - Run load balancer algorithm
   - Select {replicas} number of nodes
   - Calculate node assignments

4. Controller creates deployment record:
   INSERT INTO deployments (id, user_id, name, status, ...)
   VALUES ({deployment_id}, {user_id}, {name}, 'pending', ...)
   Status: 'pending'

5. Controller builds application package:
   - Create tarball with app code + Dockerfile
   - Calculate checksum
   - Compress with gzip

6. Controller deploys to all selected nodes in parallel:
   FOR EACH selected_node in parallel:
     a) POST /node/{node_id}/api/deploy
        Body: {deployment_id, manifest, app_package}
     
     b) Node unpacks and starts application
     
     c) Node runs health check every 30 seconds
     
     d) Node reports status back to controller

7. Controller monitors deployment progress:
   - Timeout: 5 minutes per deployment
   - If node fails to respond: Try next node
   - Update deployment status as each node reports

8. Deployment complete:
   - Update deployment status: 'running'
   - Configure load balancer routes:
     traffic → selected nodes
   - Generate public URLs
   - Update deployment in database

9. Return to dashboard:
   {deployment_id, status: 'running', endpoints: [...]}

Error Scenarios:
- Invalid manifest → 400 Bad Request
- No capacity → 503 Service Unavailable, suggest scaling
- Node deployment fails → Retry on different node
- All nodes fail → Rollback and return error
- Timeout waiting for nodes → Return partial status
```

### 4.4 Health Monitoring Flow

```
Continuous Process: Run Every 30 Seconds for Each Node

1. For each monitored node:
   
2. Send heartbeat request:
   GET /node/{node_id}/api/health
   Timeout: 5 seconds

3. Receive response (if successful):
   {
     status: 'healthy',
     cpu_percent: 45.2,
     memory_percent: 62.1,
     disk_percent: 38.5,
     active_requests: 23,
     uptime_seconds: 86400,
     deployed_apps: [{app_id, status}]
   }

4. Update node metrics in cache:
   HealthStatus[node_id].metrics = response

5. Check for status changes:
   If metrics show concerning values:
   - CPU > 90%: status = 'busy'
   - Memory > 90%: status = 'busy'
   - Error rate > 5%: status = 'degraded'
   - If all good: status = 'ready'

6. Track consecutive failures:
   If heartbeat fails:
   - Increment consecutive_failures
   - If consecutive_failures == 1: status = 'suspect'
   - If consecutive_failures == 3: status = 'failed'

7. On failure detection:
   IF status changed to 'failed':
     a) Update database
     b) Alert system
     c) Trigger recovery:
        - Find all deployments on this node
        - Migrate to healthy nodes
        - Update load balancer routes
        - Notify dashboard

8. Aggregate metrics:
   - Collect from all nodes
   - Calculate system-wide metrics:
     * Total CPU usage
     * Total memory usage
     * System error rate
     * System latency

9. Push metrics to dashboard:
   - Via WebSocket if connected
   - Via polling endpoint if not

Error Scenarios:
- Node not responding: Mark as 'suspect', retry
- Invalid response: Mark as 'degraded'
- Network partition: Continue health check retries
- Node recovers: Auto-transition back to 'ready'
```

### 4.5 Database Query Routing Flow

```
Sequence: Dashboard → Controller → Query Router → Database Shards → Aggregator

1. Dashboard sends query:
   POST /api/v1/databases/{db_id}/query
   Body: {sql_query}

2. Controller authenticates user:
   - Verify user owns this database

3. Query Router parses SQL:
   - Parse SQL into AST (Abstract Syntax Tree)
   - Extract table names
   - Extract WHERE clause conditions
   - Extract JOINs

4. Identify affected shards:
   FOR EACH table in query:
     a) Lookup table schema in database registry
     b) Get sharding strategy (hash/range/directory)
     c) Get sharding key (usually 'user_id' or 'id')
     d) If WHERE clause contains sharding key:
          Determine which shards match predicate
        ELSE:
          Include ALL shards
     e) Add to affected_shards set

5. Generate execution plan:
   FOR EACH affected_shard:
     a) Rewrite query for that shard:
        - Add shard filter to WHERE clause
        - Replace table names with shard-specific names
     b) Select best database node for shard:
        - Try primary first
        - Fall back to replicas if primary unavailable
     c) Create execution task

6. Execute queries in parallel:
   Execute all rewritten queries to their database nodes
   
   Try/Catch block:
   - Timeout: 30 seconds per query
   - If fails: Try fallback replica
   - If all fail: Return error for that shard

7. Aggregate results:
   a) Collect results from all shards
   b) If query has DISTINCT: deduplicate
   c) If query has GROUP BY: aggregate
   d) If query has ORDER BY: sort
   e) If query has LIMIT: trim to limit

8. Format and return results:
   {
     query: {original_query},
     execution_time_ms: 234,
     rows_returned: 1532,
     shards_queried: 4,
     columns: [{name, type}],
     data: [[...], [...], ...]
   }

Error Scenarios:
- SQL syntax error → 400 Bad Request with error position
- Table not found → 404 with helpful message
- Query timeout → 504 with partial results if available
- Shard unavailable → Use replicas, mark shard as degraded
- All shards fail → 503 Service Unavailable
- Unauthorized access → 403 Forbidden
```

---

## 5. API Contract Specifications

### 5.1 Authentication Endpoints

**POST /api/v1/auth/register**
- **Purpose**: Register new user account
- **Request Body**:
  ```
  {
    email: string (valid email format)
    password_hash: string (from client-side salted hash)
  }
  ```
- **Response (201)**:
  ```
  {
    user_id: UUID
    access_token: JWT (1 hour expiry)
    refresh_token: JWT (7 day expiry)
  }
  ```
- **Error Responses**:
  - 400: Invalid email format or password too short
  - 409: Email already registered
  - 500: Server error

**POST /api/v1/auth/login**
- **Purpose**: Authenticate user
- **Request Body**:
  ```
  {
    email: string
    password_hash: string
  }
  ```
- **Response (200)**:
  ```
  {
    access_token: JWT
    refresh_token: JWT
    expires_in: number (seconds)
  }
  ```
- **Error Responses**:
  - 400: Missing fields
  - 401: Invalid credentials
  - 500: Server error

**POST /api/v1/auth/refresh**
- **Purpose**: Refresh access token using refresh token
- **Headers**: Authorization: Bearer {refresh_token}
- **Response (200)**:
  ```
  {
    access_token: JWT (new, 1 hour)
    expires_in: number
  }
  ```
- **Error Responses**:
  - 401: Invalid or expired refresh token

### 5.2 Node Endpoints

**POST /api/v1/nodes/register**
- **Purpose**: Register new node (called by node wrapper)
- **Authentication**: TLS certificate verification
- **Request Body**:
  ```
  {
    provider: string (render, railway, etc.)
    endpoint: string (URL to node API)
    capabilities: {
      cpu_cores: number
      memory_gb: number
      disk_gb: number
      network_bandwidth_mbps: number
    }
  }
  ```
- **Response (201)**:
  ```
  {
    node_id: UUID (assigned)
    controller_endpoint: string
  }
  ```

**GET /api/v1/nodes**
- **Purpose**: List all nodes for authenticated user
- **Response (200)**:
  ```
  [
    {
      id: UUID
      provider: string
      status: string
      metrics: {...}
      deployments: number
    }
  ]
  ```

**POST /api/v1/deployments**
- **Purpose**: Create and deploy new application
- **Request Body**:
  ```
  {
    name: string
    app_type: string (backend|worker|cron)
    runtime: string
    resources: {memory, cpu, storage}
    replicas: number
    env: {...}
    health_check: {...}
  }
  ```
- **Response (202)**:
  ```
  {
    deployment_id: UUID
    status: string (pending)
  }
  ```

### 5.3 Database Endpoints

**POST /api/v1/databases/{db_id}/query**
- **Purpose**: Execute database query
- **Request Body**:
  ```
  {
    query: string (SQL)
  }
  ```
- **Response (200)**:
  ```
  {
    query: string
    execution_time_ms: number
    rows_returned: number
    columns: [{name, type}]
    data: any[][]
  }
  ```
- **Error Responses**:
  - 400: SQL syntax error
  - 403: User doesn't own database
  - 504: Query timeout

---

## 6. Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  active BOOLEAN DEFAULT true
);

-- Nodes table
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  provider VARCHAR(50) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  region VARCHAR(100),
  status VARCHAR(50) DEFAULT 'initializing',
  capabilities JSONB NOT NULL,
  metrics_current JSONB,
  credentials JSONB NOT NULL, -- encrypted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_heartbeat TIMESTAMP,
  UNIQUE(user_id, provider, id),
  INDEX idx_status (status),
  INDEX idx_last_heartbeat (last_heartbeat)
);

-- Deployments table
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  app_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  manifest JSONB NOT NULL,
  node_assignments JSONB NOT NULL,
  current_replicas INTEGER DEFAULT 0,
  desired_replicas INTEGER NOT NULL,
  endpoints TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name),
  INDEX idx_status (status),
  INDEX idx_user_id (user_id)
);

-- Database instances table
CREATE TABLE database_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  connection JSONB NOT NULL, -- encrypted
  sharding JSONB,
  replication JSONB,
  schema_info JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);
```

---

## 7. Caching Strategy

```
Redis Cache Structure:

1. Node Health Status (TTL: 1 minute)
   Key: node:health:{node_id}
   Value: {status, metrics, last_update}

2. Node Metrics History (TTL: 7 days)
   Key: node:metrics:history:{node_id}:{hour}
   Value: [metric, metric, metric, ...]

3. Deployment Status (TTL: 1 hour)
   Key: deployment:{deployment_id}
   Value: {status, replicas, nodes, endpoints}

4. Database Schema Cache (TTL: 24 hours)
   Key: db:schema:{db_id}
   Value: {tables, columns, indices}

5. OAuth Token Cache (TTL: until expiry)
   Key: oauth:token:{node_id}
   Value: {token, expiry}

6. System Metrics (TTL: 1 minute)
   Key: system:metrics:latest
   Value: {cpu, memory, error_rate, latency}
```

---

## 8. Testing Strategy for Controller

### 8.1 Unit Tests

```
Test Files Required:

1. services/loadBalancer.test.ts
   - Test node scoring algorithm
   - Test geographic distribution
   - Test capacity constraints
   - Test fallback to degraded nodes

2. services/queryRouter.test.ts
   - Test SQL parsing
   - Test shard identification
   - Test query rewriting
   - Test result aggregation

3. services/nodeRegistry.test.ts
   - Test node registration
   - Test node status updates
   - Test capacity tracking

4. services/deploymentManager.test.ts
   - Test deployment creation
   - Test manifest validation
   - Test node selection

5. api/auth.test.ts
   - Test signup validation
   - Test login validation
   - Test token generation
   - Test token refresh

Coverage Target: 80% of services
```

### 8.2 Integration Tests

```
Test Scenarios:

1. Node Registration → Health Monitoring → Auto-Recovery
   - Register node
   - Verify appears in system
   - Simulate node failure
   - Verify auto-recovery triggered
   - Verify status updated

2. Deployment Flow
   - Create deployment
   - Verify nodes selected correctly
   - Simulate deployment failure
   - Verify retry mechanism
   - Verify success notification

3. Database Query Routing
   - Create multi-shard database
   - Execute various queries
   - Verify routing correct
   - Verify results aggregated correctly
   - Test with shard failures

4. Load Balancer Under Load
   - Create many nodes
   - Run deployment requests concurrently
   - Verify even distribution
   - Verify geographic diversity

5. Credential Management
   - Store encrypted tokens
   - Retrieve and decrypt
   - Rotate tokens
   - Verify rotation works

Coverage Target: 60% of workflows
```

---

## 9. Key Open Questions

1. **Q**: Should we use PostgreSQL for primary registry or key-value store?
   - Current assumption: PostgreSQL for ACID compliance
   - **Answer needed**: _______________

2. **Q**: How long should nodes retry failed API calls?
   - Current assumption: Exponential backoff up to 5 minutes
   - **Answer needed**: _______________

3. **Q**: Should deployment be atomic (all-or-nothing) or best-effort?
   - Current assumption: Best-effort (partial deployments allowed)
   - **Answer needed**: _______________

4. **Q**: How many times should we retry a failed query before failing?
   - Current assumption: 2 retries per shard
   - **Answer needed**: _______________

5. **Q**: Should we support transaction support across shards?
   - Current assumption: Not in MVP (eventually consistent only)
   - **Answer needed**: _______________

---

## 10. Development Milestones

### Phase 1: MVP (Weeks 1-3)

**Milestone 1.1: Project Setup** (Days 1-2)
- [ ] Initialize Node.js project
- [ ] Set up TypeScript strict mode
- [ ] Configure Express server
- [ ] Set up database (PostgreSQL)
- [ ] Set up Redis cache
- [ ] Testing infrastructure

**Milestone 1.2: Authentication** (Days 2-5)
- [ ] User registration API
- [ ] User login API
- [ ] JWT token generation
- [ ] Token refresh mechanism
- [ ] Integration tests

**Milestone 1.3: Node Registry** (Days 5-9)
- [ ] Node registration API
- [ ] Node status tracking
- [ ] Health monitor implementation
- [ ] Metrics collection
- [ ] Integration tests

**Milestone 1.4: Load Balancer** (Days 9-12)
- [ ] Scoring algorithm
- [ ] Node selection logic
- [ ] Capacity tracking
- [ ] Failover logic
- [ ] Unit tests

**Milestone 1.5: Basic Deployment** (Days 12-15)
- [ ] Deployment creation API
- [ ] Node selection for deployment
- [ ] Basic deployment success
- [ ] Integration tests

**Milestone 1.6: Testing & Polish** (Days 15-21)
- [ ] Comprehensive unit tests
- [ ] Integration tests
- [ ] Performance testing
- [ ] Code review
- [ ] Documentation

---

**Document Version**: 1.0  
**Created**: January 14, 2026  
**Status**: Ready for Review & Question Resolution
