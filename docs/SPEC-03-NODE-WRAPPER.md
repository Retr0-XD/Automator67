# Specification: Node Wrapper Service

**Component**: Lightweight agent deployed on free-tier providers  
**Language**: Go  
**Binary Size Target**: ~15MB  
**Version**: 1.0  
**Status**: Specification - Ready for Review

---

## 1. Component Purpose

The Node Wrapper is the **distributed execution agent** of Automator67. It is a self-contained binary deployed on each free-tier provider (Render, Railway, Fly.io, etc.) that:
- Manages application lifecycle (start, stop, restart)
- Reports system health and metrics
- Executes applications in isolated containers
- Communicates with the central Controller
- Manages local storage and caching
- Handles inter-provider communication (if needed)
- Provides zero-knowledge credential management

### Key Principle
**Node Wrapper is stateless** - All state stored in Controller. Node can be redeployed without data loss.

---

## 2. Responsibilities & Boundaries

### ✅ Node Wrapper IS Responsible For:
1. **Application Container Management**
   - Receiving deployment manifests
   - Downloading application packages
   - Running applications in containers
   - Managing application lifecycle (start, stop, restart)
   - Enforcing resource limits (CPU, memory)
   - Cleaning up old containers

2. **Health Reporting**
   - Reporting system health (cpu, memory, disk)
   - Reporting application health
   - Sending heartbeats to controller
   - Providing detailed metrics

3. **Credential Storage**
   - Storing encrypted OAuth credentials
   - Never exposing credentials to applications
   - Providing credentials via secure API endpoints
   - Supporting credential rotation

4. **Local Storage Management**
   - Caching application packages
   - Managing upload/download storage
   - Managing local cache (LRU eviction)
   - Cleaning up old files

5. **Request Forwarding**
   - Receiving HTTP requests from users
   - Routing to appropriate running application
   - Load balancing across application replicas
   - Handling connection upgrades (WebSocket)

6. **Network Communication**
   - TLS encrypted communication with controller
   - Self-signed certificate generation
   - Secure credential transmission
   - Heartbeat reporting

### ❌ Node Wrapper IS NOT Responsible For:
- Building application containers (Docker handled by provider)
- Managing user credentials (controller does this)
- Routing between nodes (controller does this)
- Scaling decisions (controller makes decisions)
- Database query execution (applications do this)
- File storage replication (controller coordinates this)

---

## 3. Data Models

### 3.1 Application Instance Model (In-Memory)

```
ApplicationInstance {
  id: UUID (unique on this node)
  deployment_id: UUID (from controller)
  name: string (from deployment)
  status: string enum (pending, starting, running, failing, stopped)
  
  container: {
    id: string (Docker container ID)
    created_at: timestamp
    started_at: timestamp
    stopped_at: timestamp (null if running)
  }
  
  manifest: {
    runtime: string (node, python, go, etc.)
    entrypoint: string (command to run)
    resources: {
      memory_limit_mb: number
      cpu_limit: number (decimal, e.g., 0.5)
      storage_limit_mb: number
    }
    env: Record<string, string>
    health_check: {
      path: string (HTTP endpoint)
      interval: number (seconds)
      timeout: number (seconds)
      retries: number
    }
  }
  
  ports: {
    container_port: number
    exposed_port: number (on host)
  }[]
  
  metrics_current: {
    cpu_percent: number
    memory_mb: number
    disk_used_mb: number
    requests_served: number
    last_health_check: timestamp
    health_status: string enum (healthy, suspect, failing)
  }
  
  logs: {
    stdout: Buffer (circular, last 10MB)
    stderr: Buffer (circular, last 10MB)
  }
  
  error_message: string (null if successful)
}

Storage: In-memory map
  Key: application_id
  Value: ApplicationInstance
Persistence: Not persisted, reconstructed from controller on restart
```

### 3.2 Credential Store Model (Encrypted On-Disk)

```
CredentialStore {
  node_id: UUID
  
  credentials: [
    {
      provider: string (oauth_provider)
      token_encrypted: string (AES-256-GCM)
      expires_at: timestamp
      rotation_timestamp: timestamp
    }
  ]
  
  master_key: Buffer (stored in secure location)
    - Generated during node registration
    - Used to encrypt all stored credentials
    - Never transmitted to controller
}

Storage: Local encrypted file
  Location: /var/automator/credentials.enc
  Format: AES-256-GCM encrypted JSON
  Key rotation: Automatic every 30 days
```

### 3.3 Health Status Model (In-Memory)

```
NodeHealthStatus {
  timestamp: timestamp
  uptime_seconds: number
  
  system: {
    cpu_percent: number
    memory_percent: number
    disk_percent: number (of allocated storage)
    load_average: [1min, 5min, 15min]
  }
  
  containers: {
    total: number
    running: number
    failed: number
    stopped: number
  }
  
  network: {
    inbound_bytes: number
    outbound_bytes: number
    active_connections: number
  }
  
  errors: {
    last_error: string
    error_count: number
    last_error_time: timestamp
  }
}
```

### 3.4 Request Context Model (Per-Request)

```
RequestContext {
  request_id: UUID (generated on receipt)
  timestamp: timestamp
  method: string (GET, POST, etc.)
  path: string (HTTP path)
  headers: Record<string, string>
  body: Buffer (request body, max 100MB)
  
  routing: {
    application_id: UUID (determined by path)
    container_port: number
  }
  
  response: {
    status_code: number
    headers: Record<string, string>
    body: Buffer
    latency_ms: number
  }
  
  authentication: {
    user_id: UUID (from controller)
    authorized: boolean
  }
}
```

---

## 4. Core Processes & Flows

### 4.1 Node Startup Flow

```
Sequence: OS Starts → Go Binary → Register → Start Monitor → Ready

1. Operating system starts the node wrapper binary:
   - OS executes go binary
   - Go runtime initializes
   - Binary loads configuration

2. Binary initialization:
   - Read configuration from environment variables
   - Set node_id (from env or generate new)
   - Create data directories (/var/automator/*)
   - Load encryption keys (or generate new)

3. Network setup:
   - Generate self-signed TLS certificate (if not exists)
   - Store cert + private key
   - Open port 8080 for HTTP listener
   - Setup gRPC server on port 50051

4. Check connection to controller:
   GET https://controller_endpoint/api/v1/health
   Timeout: 10 seconds
   
   If controller unreachable:
     - Log warning
     - Retry every 30 seconds
     - Continue initialization (will work offline)

5. Register with controller:
   POST https://controller_endpoint/api/v1/nodes/register
   Body: {
     provider: string (from env)
     endpoint: "https://{node_public_url}:8080"
     capabilities: {
       cpu_cores: 2,
       memory_gb: 1,
       disk_gb: 10,
       network_bandwidth_mbps: 100
     }
   }
   
   Response: {
     node_id: UUID (if new),
     controller_endpoint: string
   }

6. Start health reporter:
   - Schedule heartbeat every 30 seconds
   - Collect system metrics
   - Report to controller

7. Start request handler:
   - Listen on port 8080 for HTTP requests
   - Listen on port 50051 for gRPC calls

8. Start cleanup task:
   - Every 1 hour: Remove old containers
   - Every 1 hour: Clear old logs
   - Every 7 days: Rotate credentials

9. Ready state:
   - Accept deployment requests
   - Accept HTTP traffic
   - Node appears in Dashboard
   - Status = 'ready'

Error Scenarios:
- Controller unreachable: Continue with offline mode
- Port 8080 already in use: Exit with error
- Certificate generation fails: Exit with error
- Disk space full: Log error, continue
```

### 4.2 Application Deployment Flow

```
Sequence: Controller Sends Manifest → Node Deploys → Starts Container → Reports Success

1. Controller sends deployment request:
   POST /api/v1/deployments
   Headers: Content-Type: application/json
   Body: {
     deployment_id: UUID
     name: string
     manifest: {
       runtime: string
       entrypoint: string
       resources: {memory, cpu, storage}
       env: {...}
       health_check: {...}
     }
     app_package: Buffer (gzipped tarball)
   }
   Timeout: 60 seconds

2. Node receives and validates:
   a) Verify deployment_id format
   b) Verify manifest has required fields
   c) Check available disk space >= manifest.resources.storage
   d) Check available memory >= manifest.resources.memory
   e) Generate application_id UUID

   If validation fails:
     - Return 400 Bad Request with error details
     - Do NOT create application instance

3. Extract application package:
   a) Create directory: /var/automator/apps/{application_id}
   b) Extract tarball to directory
   c) Verify files extracted correctly
   d) Calculate checksum of extracted files

4. Build Docker image (for this application):
   a) Create Dockerfile from manifest (if not included)
   b) docker build -t automator:{application_id} {app_dir}
   c) If build fails:
      - Log error details
      - Return 500 with error message
      - Clean up partial build

5. Create and start container:
   a) docker create --name {application_id} \
      --memory {memory_limit}m \
      --cpus {cpu_limit} \
      -e CONTROLLER_ENDPOINT={controller} \
      -e {other_env_vars} \
      automator:{application_id}
   
   b) docker start {application_id}
   
   c) Record container info in ApplicationInstance model
   
   d) If start fails:
      - Log error
      - Return 500

6. Run health check:
   a) Wait 5 seconds for app to start
   b) Send health check request:
      GET http://localhost:{container_port}{health_path}
      Timeout: 5 seconds
   
   c) If health check passes:
      - status = 'running'
      - Return 200 with success
   
   d) If health check fails:
      - Retry up to 3 times
      - If still failing after retries:
        * status = 'failing'
        * Return 500 with health check details

7. Controller receives response:
   {
     deployment_id: UUID
     application_id: UUID
     status: 'running' or 'failing'
     port: number
     error_message: null or string
   }

8. Update load balancer routes (controller side):
   - Add mapping: path → {node_id, application_id}
   - Application now receives traffic

Error Scenarios:
- Manifest validation fails → 400 Bad Request
- Insufficient disk space → 503 Service Unavailable
- Docker build fails → 500 with build logs
- Container fails to start → 500 with container logs
- Health check fails → 500 with health check details
- Network error sending response → Controller retries
```

### 4.3 Request Forwarding Flow

```
Sequence: HTTP Request → Route → Container → Response

1. Node receives HTTP request:
   GET /app/{deployment_id}/{path}
   Host: example.com
   Headers: {...}
   Body: Buffer

2. Parse request:
   a) Extract deployment_id from path
   b) Lookup application_id for this deployment
   c) If deployment_id not found:
      - Return 404 Not Found

3. Check authorization:
   a) Verify request has valid Authorization header
   b) Verify user owns this deployment
   c) If unauthorized:
      - Return 401 Unauthorized

4. Load balance (if multiple replicas on node):
   a) Get all containers for this deployment on this node
   b) Filter healthy containers
   c) Select container with least active requests (round-robin)
   d) If no healthy containers:
      - Return 503 Service Unavailable

5. Forward request to container:
   a) Create new HTTP request to:
      http://localhost:{container_port}/{path}
   
   b) Copy headers from original request
   c) Copy body
   d) Forward authentication header
   e) Set X-Forwarded-* headers:
      X-Forwarded-For: {client_ip}
      X-Forwarded-Proto: {original_protocol}
      X-Forwarded-Host: {original_host}
   f) Timeout: 30 seconds

6. Receive response from container:
   a) Read status code
   b) Copy response headers
   c) Stream response body

7. Send response to client:
   a) Send status code
   b) Send headers
   c) Stream body

8. Log request:
   a) Record in request_id → outcome map
   b) Update metrics (requests_served, latency)
   c) Archive logs after 7 days

Error Scenarios:
- Deployment not found → 404
- User unauthorized → 401
- All containers unhealthy → 503
- Container timeout → 504 Gateway Timeout
- Container crash → 500 + log error
- Network error → 503 + retry
```

### 4.4 Health Check Flow

```
Continuous Process: Every 30 Seconds

1. For each running application:
   a) Get ApplicationInstance from registry
   b) If status = 'running':
      - Continue to step 2
   c) Else:
      - Skip (not running)

2. Send health check request:
   GET http://localhost:{container_port}{health_path}
   Timeout: 5 seconds
   Retries: None (single attempt)

3. Evaluate response:
   a) If response.status in [200, 299]:
      - Set status = 'healthy'
      - Reset consecutive_failures = 0
   
   b) If response.status in [300, 399, 400, 404, 405]:
      - Set status = 'failing'
      - Log error
      - Notify controller
   
   c) If response.timeout or network error:
      - Increment consecutive_failures
      - If consecutive_failures >= 3:
        * Set status = 'failing'
        * Notify controller
      - Else:
        * Set status = 'suspect'

4. If status changed to 'failing':
   a) Send notification to controller:
      POST /api/v1/health-report
      {deployment_id, application_id, status: 'failing'}
   
   b) Log error details
   c) Keep container running (controller decides what to do)

5. Aggregate health status:
   a) Count healthy applications
   b) Count failing applications
   c) Prepare for next heartbeat report

Error Scenarios:
- Container crashes between checks → Detected at next health check
- Application hangs → Timeout → Consecutive failures
- Temporary network issue → Suspect state, retry next check
```

### 4.5 Credential Retrieval Flow

```
Sequence: Application Requests Creds → Node Validates → Return Encrypted

1. Running application makes request:
   GET /api/v1/credentials/{provider}
   Header: Authorization: Bearer {app_token}

2. Node validates request:
   a) Verify Authorization header present
   b) Verify token matches application's token
   c) Verify application is deployed on this node
   d) Verify provider is valid enum

   If validation fails:
     - Return 401 Unauthorized

3. Retrieve from credential store:
   a) Load encrypted credential file
   b) Decrypt using master_key
   c) Find credential for requested provider
   d) If not found:
      - Return 404 Not Found

4. Check expiration:
   a) If expires_at < now:
      - Notify controller to refresh
      - Return 410 Gone (expired)
   b) Else:
      - Continue

5. Return credential:
   {
     token: string
     expires_at: timestamp
   }

6. Log access:
   a) Record credential_id, application_id, timestamp
   b) Monitor for suspicious patterns
   c) Alert if same credential accessed >100x in 1 minute

Error Scenarios:
- Application unauthorized → 401
- Provider not found → 404
- Credential expired → 410 + request refresh
- Too many requests → 429 Too Many Requests + log alert
```

---

## 5. API Contract Specifications

### 5.1 Health Endpoint

**GET /api/v1/health**
- **Purpose**: Health check from controller
- **Authentication**: None required
- **Response (200)**:
  ```
  {
    status: 'healthy' | 'degraded' | 'failing'
    uptime_seconds: number
    cpu_percent: number
    memory_percent: number
    disk_percent: number
    containers_running: number
    timestamp: ISO8601
  }
  ```

### 5.2 Deployment Endpoint

**POST /api/v1/deployments**
- **Purpose**: Deploy application to this node
- **Authentication**: TLS certificate verification
- **Request Body**:
  ```
  {
    deployment_id: UUID
    name: string
    manifest: {
      runtime: string
      entrypoint: string
      resources: {memory_mb, cpu, storage_mb}
      env: Record<string, string>
      health_check: {path, interval, timeout, retries}
    }
    app_package: Buffer (gzipped tarball)
  }
  ```
- **Response (201)**:
  ```
  {
    application_id: UUID
    status: 'running' | 'failing'
    port: number (if running)
    error_message: string | null
  }
  ```

### 5.3 Logs Endpoint

**GET /api/v1/deployments/{application_id}/logs**
- **Purpose**: Stream application logs
- **Query Parameters**:
  - `lines`: number (default 100)
  - `follow`: boolean (stream mode)
- **Response (200)**: Text stream

### 5.4 Application Status Endpoint

**GET /api/v1/deployments/{application_id}/status**
- **Purpose**: Get application status
- **Response (200)**:
  ```
  {
    deployment_id: UUID
    status: 'running' | 'failing' | 'stopped'
    memory_used_mb: number
    cpu_percent: number
    requests_served: number
    health_status: 'healthy' | 'suspect' | 'failing'
  }
  ```

---

## 6. Local File Structure

```
/var/automator/
├── config.json              (configuration)
├── tls/
│   ├── cert.pem            (self-signed certificate)
│   └── key.pem             (private key)
├── credentials.enc         (encrypted OAuth tokens)
├── apps/
│   └── {application_id}/
│       ├── app.tar.gz      (extracted app files)
│       ├── Dockerfile      (generated)
│       ├── logs/
│       │   ├── stdout      (circular buffer)
│       │   └── stderr      (circular buffer)
│       └── metrics.json    (application-specific metrics)
├── cache/
│   └── {cache_key}        (LRU eviction, 1GB limit)
└── temp/
    └── {temp_files}       (cleaned up after deployment)
```

---

## 7. Caching & Storage Strategy

```
Local Storage Limits:

1. Application Packages Cache:
   - Max size: 5GB per node
   - Strategy: LRU (least recently used)
   - TTL: 30 days
   - Eviction: When over 5GB, delete oldest unused

2. Logs:
   - Max size per app: 100MB (circular buffer)
   - Retention: 7 days
   - Format: JSON lines (one entry per line)

3. Request Cache (for quick repeat requests):
   - Max size: 1GB
   - TTL: 1 hour
   - Cache key: sha256(path + query_params)

4. Metrics Data:
   - Retention: 24 hours (local)
   - Sync with controller: Every 30 seconds
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```
Test Files Required:

1. container/deployment.test.go
   - Test manifest validation
   - Test resource limit checking
   - Test docker image building
   - Test container creation

2. container/health.test.go
   - Test health check logic
   - Test status transitions
   - Test consecutive failure tracking

3. network/request_handler.test.go
   - Test request routing
   - Test path parsing
   - Test header forwarding
   - Test timeout handling

4. security/credentials.test.go
   - Test credential encryption/decryption
   - Test master key management
   - Test token expiration checking

5. registration/register.test.go
   - Test node registration flow
   - Test certificate generation
   - Test environment setup

Coverage Target: 80% of core functions
```

### 8.2 Integration Tests

```
Test Scenarios:

1. Full Deployment Lifecycle:
   - Node starts
   - Controller deploys app
   - Health check succeeds
   - App serves requests
   - Logs are collected

2. Failure Handling:
   - App crashes
   - Health check detects failure
   - Controller is notified
   - App is restarted

3. Multiple Applications:
   - Deploy 3 apps to same node
   - Each receives traffic correctly
   - Resource limits enforced
   - Requests routed correctly

4. Credential Management:
   - Store encrypted credential
   - Retrieve and verify
   - Rotate credential
   - Token expiration handled

5. Load Testing:
   - Send 1000 requests/second
   - Verify no request loss
   - Measure latency
   - Verify metrics collected

Coverage Target: 60% of workflows
```

---

## 9. Performance Targets

- **Deployment time**: < 30 seconds from receipt to running
- **Request latency**: < 50ms (node processing only)
- **Health check frequency**: 30 seconds
- **Heartbeat frequency**: 30 seconds
- **Memory overhead**: < 100MB per node
- **Disk overhead**: < 500MB per node
- **Concurrent deployments**: Support at least 3 simultaneous
- **Max containers per node**: 10 (configurable)

---

## 10. Key Open Questions

1. **Q**: Should node support deploying from Docker image registries or always from tarball?
   - Current assumption: Always from tarball (simpler)
   - **Answer needed**: _______________

2. **Q**: How should logs be persisted if disk fills up?
   - Current assumption: Circular buffer with FIFO eviction
   - **Answer needed**: _______________

3. **Q**: Should node support live code updates or always require restart?
   - Current assumption: Always requires restart (safer)
   - **Answer needed**: _______________

4. **Q**: How many concurrent applications per node before we reject deployments?
   - Current assumption: 10 applications max
   - **Answer needed**: _______________

5. **Q**: Should credential rotation be automatic or manual?
   - Current assumption: Automatic every 30 days
   - **Answer needed**: _______________

6. **Q**: How long should we keep historical logs/metrics?
   - Current assumption: 7 days local, unlimited in controller
   - **Answer needed**: _______________

---

## 11. Development Milestones

### Phase 1: MVP (Weeks 4-6)

**Milestone 1.1: Go Project Setup** (Days 1-2)
- [ ] Initialize Go project
- [ ] Set up modules and dependencies
- [ ] Configure build system
- [ ] Set up testing framework

**Milestone 1.2: Basic HTTP Server** (Days 2-4)
- [ ] Create HTTP listener
- [ ] Implement health endpoint
- [ ] Add basic logging
- [ ] TLS certificate generation

**Milestone 1.3: Docker Integration** (Days 4-7)
- [ ] Docker API integration
- [ ] Container creation/starting
- [ ] Container status monitoring
- [ ] Resource limit enforcement

**Milestone 1.4: Deployment API** (Days 7-10)
- [ ] Implement /deployments endpoint
- [ ] Application package extraction
- [ ] Health checking
- [ ] Error handling

**Milestone 1.5: Request Forwarding** (Days 10-13)
- [ ] Implement request router
- [ ] Forward to containers
- [ ] Load balancing across replicas
- [ ] Error handling

**Milestone 1.6: Node Registration** (Days 13-15)
- [ ] Implement registration flow
- [ ] Controller communication
- [ ] Heartbeat reporting
- [ ] Testing

---

**Document Version**: 1.0  
**Created**: January 14, 2026  
**Status**: Ready for Review & Question Resolution
