# Specification: Health Monitor & Auto-Recovery

**Component**: System health monitoring and automatic failure recovery  
**Language**: Node.js + TypeScript  
**Version**: 1.0  
**Status**: Specification - Ready for Review

---

## 1. Component Purpose

The Health Monitor is responsible for:
- Continuously monitoring all nodes and services
- Detecting failures (nodes, databases, deployments)
- Triggering automatic recovery
- Maintaining system health metrics
- Alerting administrators on critical issues
- Tracking node status transitions
- Managing circuit breaker state

### Key Principle
**System detects and recovers automatically** - No manual intervention needed for common failures.

---

## 2. Responsibilities & Boundaries

### ✅ Health Monitor IS Responsible For:
1. **Node Health Monitoring**
   - Sending heartbeat requests to nodes
   - Collecting system metrics
   - Tracking response times
   - Detecting unresponsive nodes

2. **Failure Detection**
   - Network timeouts
   - High error rates
   - Resource exhaustion
   - Service crashes

3. **Status Management**
   - Tracking node state transitions
   - Maintaining status history
   - Recording recovery events
   - Logging failures

4. **Automatic Recovery**
   - Restarting failed services
   - Migrating deployments to healthy nodes
   - Replicating data to healthy nodes
   - Circuit breaker management

5. **Metrics Collection**
   - System-wide metrics aggregation
   - Trend analysis
   - Alert threshold evaluation
   - Performance tracking

6. **Alerting**
   - Detecting critical issues
   - Notifying administrators
   - Logging events
   - Creating incident records

### ❌ Health Monitor IS NOT Responsible For:
- Manual deployment (automated only)
- User authentication
- Data storage (uses controller database)
- Network routing
- Application-level monitoring (just infrastructure)

---

## 3. Data Models

### 3.1 Node Health Status Model

```
NodeHealthStatus {
  node_id: UUID
  user_id: UUID
  
  current_status: string enum (
    healthy,        // All good
    suspect,        // 1 failed check
    degraded,       // Performance issues
    failing,        // 3+ failed checks
    unavailable,    // Unreachable
    recovering,     // Auto-recovery in progress
    recovered       // Just came back online
  )
  
  status_changed_at: timestamp
  
  consecutive_failures: number (resets on success)
  consecutive_successes: number
  
  last_successful_heartbeat: timestamp
  last_failed_heartbeat: timestamp
  failure_messages: string[] (last 5 failures)
  
  metrics: {
    cpu_percent: number
    memory_percent: number
    disk_percent: number
    active_requests: number
    error_rate: number (percent)
    avg_response_time_ms: number
    network_in_bytes: number
    network_out_bytes: number
  }
  
  deployments: {
    total: number
    healthy: number
    failing: number
    total_requests_served: number
  }
  
  recovery_attempts: {
    count: number
    last_attempt: timestamp
    last_success: timestamp
  }
}

Storage: Redis
  Key: node:health:{node_id}
  TTL: 5 minutes (auto-expire if updates stop)
  Frequency: Updated every heartbeat (30 seconds)
```

### 3.2 Health Check Configuration Model

```
HealthCheckConfig {
  node_id: UUID
  
  heartbeat: {
    interval_seconds: 30
    timeout_seconds: 5
    endpoint: '/api/v1/health'
  }
  
  failure_threshold: {
    consecutive_failures: 3 (mark as failing after 3)
    failure_window_minutes: 5 (count failures in 5min window)
  }
  
  recovery_strategy: string enum (
    auto_restart,     // Try to restart node
    migrate,          // Migrate deployments to other nodes
    manual_only       // Alert human to investigate
  )
  
  alert_thresholds: {
    cpu_percent: number (85, alert if > this)
    memory_percent: number (85)
    disk_percent: number (90)
    error_rate_percent: number (5)
    response_time_ms: number (500)
  }
  
  circuit_breaker: {
    state: string enum (closed, open, half-open)
    failure_count: number
    failure_threshold: number (open after N failures)
    success_count: number
    success_threshold: number (close after N successes)
    timeout_seconds: number (wait before half-open)
  }
}

Storage: PostgreSQL
  Table: health_check_configs
  Primary Key: node_id
```

### 3.3 Health Event Log Model

```
HealthEvent {
  id: UUID
  node_id: UUID
  user_id: UUID
  
  event_type: string enum (
    heartbeat_success,
    heartbeat_failure,
    status_changed,
    recovery_started,
    recovery_completed,
    alert_triggered,
    deployment_migrated
  )
  
  severity: string enum (info, warning, critical, emergency)
  
  status_before: string (previous status)
  status_after: string (new status)
  
  message: string (human-readable description)
  
  metrics_snapshot: {
    cpu_percent: number
    memory_percent: number
    error_rate: number
    response_time_ms: number
  }
  
  action_taken: string (what automatic action was triggered)
  manual_resolution_needed: boolean
  
  timestamp: timestamp
  resolved_at: timestamp | null
}

Storage: PostgreSQL + TimescaleDB (time-series)
  Table: health_events
  Indices:
    - PRIMARY KEY (id)
    - INDEX (node_id, timestamp DESC)
    - INDEX (severity)
    - INDEX (event_type)
    - HYPERTABLE (timestamp)
```

### 3.4 System Metrics Aggregated Model

```
SystemMetricsAggregated {
  timestamp: timestamp (1-minute granularity)
  
  nodes: {
    total: number (total nodes)
    healthy: number
    degraded: number
    failing: number
    unavailable: number
  }
  
  deployments: {
    total: number
    running: number
    failing: number
    restarting: number
  }
  
  system_wide: {
    cpu_percent: number (average across all nodes)
    memory_percent: number
    disk_percent: number (average)
    
    total_requests_per_second: number
    error_rate_percent: number
    p50_latency_ms: number
    p95_latency_ms: number
    p99_latency_ms: number
  }
  
  storage: {
    total_bytes: number
    used_bytes: number
    replicated_bytes: number
  }
}

Storage: Redis + TimescaleDB
  Redis Key: metrics:current
  TTL: 1 hour
  Database: metrics_aggregated (time-series)
```

---

## 4. Core Processes & Flows

### 4.1 Heartbeat Collection Flow

```
Continuous Process: Every 30 Seconds

1. For each registered node:
   
2. Prepare heartbeat request:
   GET https://{node_endpoint}/api/v1/health
   Timeout: 5 seconds
   Headers: Authorization: Bearer {controller_token}

3. Send and collect response:
   a) Send request
   b) Record timestamp
   c) If response received in time:
      - Parse response
      - Extract metrics
      - Continue to step 4
   
   d) If timeout after 5 seconds:
      - Increment consecutive_failures
      - Continue to failure handling (step 7)
   
   e) If network error:
      - Increment consecutive_failures
      - Continue to failure handling

4. Process successful response:
   {
     status: 'healthy'
     cpu_percent: 45.2
     memory_percent: 62.1
     disk_percent: 38.5
     active_requests: 23
     error_rate: 0.5
     avg_response_time_ms: 125
   }

5. Update health status:
   a) Reset consecutive_failures = 0
   b) Increment consecutive_successes
   c) Update metrics in Redis
   d) Update last_successful_heartbeat
   e) Determine current status:
      - If all metrics normal: status = 'healthy'
      - If any metric elevated: status = 'degraded'
      - If any metric critical: status = 'failing'

6. Store in database (every 5 minutes):
   INSERT INTO health_events
   VALUES (heartbeat_success, metrics, ...)

7. Failure handling:
   a) Increment consecutive_failures
   b) Reset consecutive_successes = 0
   c) Record failure message
   d) Determine new status:
      - If consecutive_failures == 1: status = 'suspect'
      - If consecutive_failures == 3: status = 'failing'
      - If consecutive_failures == 6: status = 'unavailable'
   
   e) If status changed to 'failing':
      - Log critical event
      - Trigger alert
      - Start recovery (if configured)

Error Scenarios:
- Node not responding → Marked as suspect, retry
- Node returns error response → Marked as suspect
- Node metrics invalid → Log error, don't update metrics
- Network timeout → Treat as failure
```

### 4.2 Failure Detection & Escalation Flow

```
Sequence: Failed Heartbeat → Status Escalation → Recovery Trigger

Scenario: Node Becomes Unresponsive

Timeline:
- T+0s: Heartbeat 1 fails (consecutive_failures = 1, status = suspect)
- T+30s: Heartbeat 2 fails (consecutive_failures = 2, status = suspect)
- T+60s: Heartbeat 3 fails (consecutive_failures = 3, status = failing)
         → Log critical event
         → Send alert
         → Start recovery

Actions on Status Change:

1. When status changes to 'suspect' (1 failure):
   - Log informational event
   - No automatic action
   - Continue monitoring

2. When status changes to 'failing' (3 failures):
   - Log critical event
   - Create high-priority alert
   - Check recovery_strategy config
   - If recovery_strategy = 'auto_restart':
     * Try to contact node
     * Send restart command if reachable
     * If unreachable: Mark as unrecoverable
   - If recovery_strategy = 'migrate':
     * Get all deployments on this node
     * For each deployment:
       - Select healthy node
       - Migrate deployment
       - Verify migration successful
   - If recovery_strategy = 'manual_only':
     * Log alert
     * Wait for human intervention

3. When status changes to 'unavailable' (6 failures):
   - Log emergency event
   - Send urgent alert
   - Force deployment migration
   - Alert administrator

Error Scenarios:
- Recovery command fails → Try again
- No healthy nodes to migrate to → Alert admin
- Partial recovery → Some deployments migrated, some still trying
```

### 4.3 Auto-Recovery Flow (Migration Strategy)

```
Sequence: Node Failed → Find Deployments → Select New Nodes → Migrate → Verify

1. Trigger: Node status changed to 'failing'

2. Get all deployments on failed node:
   SELECT * FROM deployments
   WHERE node_assignments contains failed_node_id

3. For each deployment:
   a) Current state: Running on failed_node
   b) Target state: Running on healthy_node
   c) Recovery steps:
      
      i) Select replacement node:
         - Get all healthy nodes
         - Run load balancer algorithm
         - Select node with most capacity
      
      ii) Prepare deployment on new node:
          - Create deployment record for new node
          - Set status = 'migrating'
          - Copy manifest from original deployment
      
      iii) Stop deployment on failed node:
           - Try to send stop command
           - If node unreachable: Mark as stopped anyway
      
      iv) Start deployment on new node:
          - Send deployment manifest
          - Wait for startup (timeout 2 minutes)
          - If successful: status = 'running'
          - If failed: Try next node
      
      v) Verify traffic routing:
          - Update load balancer
          - Redirect traffic from failed_node to new_node
          - Send verification requests
      
      vi) Update database:
          - Update deployment.node_assignments
          - Remove failed node
          - Add new node
          - Record migration event

4. Verification:
   a) Health check new deployment
   b) If healthy: Migration complete
   c) If failing: Retry on another node

5. Cleanup:
   - Remove failed node from rotation
   - Archive deployment assignment history
   - Log completed recovery

Error Scenarios:
- No healthy nodes available → Error: "Cannot migrate, no healthy nodes"
- New node deployment fails → Try next node
- All nodes fail → Return error, alert admin
- Partial migration → Some deployments migrated, some on old node
```

### 4.4 Circuit Breaker Pattern

```
State Machine: Closed → Open → Half-Open → Closed

Circuit Breaker States:

CLOSED (Normal Operation):
- Requests passing through normally
- Failed requests counted
- After N failures in M-minute window: Open

OPEN (Failing Service):
- Block all requests immediately
- Return error to caller
- After timeout: Transition to Half-Open

HALF-OPEN (Testing Recovery):
- Allow one request through
- If succeeds: Transition to Closed
- If fails: Back to Open

Implementation per Node:

Node {
  circuit_breaker: {
    state: 'closed' | 'open' | 'half-open'
    failure_count: 0
    failure_threshold: 5
    success_count: 0
    success_threshold: 2
    timeout_seconds: 60
  }
}

Logic:

1. On successful request:
   - If state = 'half-open':
     * Increment success_count
     * If success_count >= success_threshold:
       - Reset failure_count = 0
       - Transition to 'closed'
   - If state = 'closed':
     * Keep normal operation

2. On failed request:
   - If state = 'half-open':
     * Reset success_count = 0
     * Increment failure_count
     * Transition to 'open'
   - If state = 'closed':
     * Increment failure_count
     * If failure_count >= failure_threshold:
       - Transition to 'open'
       - Record open_at timestamp

3. Timeout handling:
   - If state = 'open' AND time_since_open >= timeout:
     * Reset failure_count = 0
     * Transition to 'half-open'
     * Allow probe request

Example Timeline:

T+0s: Request fails (failure_count = 1, state = closed)
T+30s: Request fails (failure_count = 2, state = closed)
T+60s: Request fails (failure_count = 3, state = closed)
T+90s: Request fails (failure_count = 4, state = closed)
T+120s: Request fails (failure_count = 5, state = open)
        → Block all further requests
T+180s: Timeout reached, transition to half-open
T+181s: Probe request sent
        → If succeeds: transition to closed, resume normal operation
        → If fails: back to open
```

### 4.5 Alerting Flow

```
Sequence: Critical Event → Evaluate → Alert → Track

1. Trigger: Node status changed to 'failing'

2. Create health event:
   INSERT INTO health_events VALUES {
     event_type: 'status_changed',
     severity: 'critical',
     status_before: 'suspect',
     status_after: 'failing',
     message: 'Node node-123 has failed 3+ health checks',
     timestamp: now
   }

3. Evaluate alert rules:
   a) Check if alert already sent for this node (deduplicate)
   b) Check if user has alerts enabled
   c) Get alert notification channels (email, webhook, Slack)
   d) Get alert severity threshold (should we alert for this?)

4. Send alerts:
   FOR EACH notification_channel:
     a) Email:
        - Subject: "[AUTOMATOR67] Node node-123 is failing"
        - Body: Status change, metrics, recovery action taken
     b) Webhook:
        - POST to user's webhook URL
        - Body: {event_type, node_id, status, metrics, action}
     c) Slack:
        - Send message to configured channel
        - Format with thread for recovery updates

5. Track alert status:
   health_events.alert_sent = true
   health_events.alert_sent_at = now

6. Monitor recovery:
   - If deployment migrated: Update alert with success
   - If still failing: Send reminder alert after 1 hour
   - If recovered: Send recovery notification

7. Escalation:
   - If issue persists > 1 hour: Escalate severity
   - If issue persists > 6 hours: Page on-call engineer
   - If issue persists > 24 hours: Manual review required

Error Scenarios:
- Alert service down → Log and retry
- User webhook unreachable → Log and skip
- Duplicate alert sent → Add deduplication logic
```

---

## 5. API Contract Specifications

### 5.1 Health Status Endpoints

**GET /api/v1/health/nodes**
- **Purpose**: Get all nodes' health status
- **Response (200)**:
  ```
  [
    {
      node_id: UUID
      status: 'healthy' | 'suspect' | 'failing'
      last_heartbeat: timestamp
      metrics: {cpu, memory, disk, requests, errors}
      deployments_count: number
    }
  ]
  ```

**GET /api/v1/health/nodes/{node_id}**
- **Purpose**: Get specific node health
- **Response (200)**:
  ```
  {
    node_id: UUID
    status: string
    consecutive_failures: number
    metrics: {...}
    events: [{timestamp, event_type, message}]
  }
  ```

### 5.2 System Metrics Endpoints

**GET /api/v1/metrics/system**
- **Purpose**: Get system-wide metrics
- **Response (200)**:
  ```
  {
    nodes: {total, healthy, failing}
    deployments: {total, running, failing}
    system_wide: {
      cpu_percent, memory_percent,
      requests_per_second, error_rate,
      p50_latency_ms, p95_latency_ms, p99_latency_ms
    }
  }
  ```

### 5.3 Alerts Endpoints

**GET /api/v1/alerts**
- **Purpose**: Get recent alerts
- **Query Parameters**: `limit`, `severity`
- **Response (200)**:
  ```
  [
    {
      id: UUID
      severity: 'warning' | 'critical' | 'emergency'
      message: string
      created_at: timestamp
      resolved: boolean
    }
  ]
  ```

---

## 6. Monitoring Thresholds

```
Default Alert Thresholds:

CPU Usage:
  - Degraded: > 75%
  - Critical: > 90%

Memory Usage:
  - Degraded: > 75%
  - Critical: > 90%

Disk Usage:
  - Degraded: > 80%
  - Critical: > 95%

Error Rate:
  - Degraded: > 2%
  - Critical: > 5%

Response Time:
  - Degraded: > 300ms
  - Critical: > 1000ms

Heartbeat Failures:
  - Suspect: 1 failure
  - Failing: 3+ failures
  - Unavailable: 6+ failures
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

```
Test Files:

1. monitor/heartbeatCollector.test.ts
   - Test successful heartbeat
   - Test failed heartbeat
   - Test consecutive failure tracking
   - Test status transitions

2. recovery/autoRecovery.test.ts
   - Test deployment migration
   - Test node selection
   - Test migration verification

3. alerts/alertManager.test.ts
   - Test alert creation
   - Test alert deduplication
   - Test alert escalation

4. circuitBreaker/circuitBreaker.test.ts
   - Test closed → open transition
   - Test open → half-open transition
   - Test half-open → closed transition
   - Test probe request logic

Coverage: 80%
```

### 7.2 Integration Tests

```
Scenarios:

1. Simulate node failure, verify migration
2. Multiple node failures, verify recovery
3. Transient failure, verify recovery
4. Degraded performance, verify alerts
5. Node recovery, verify status change
6. Circuit breaker state transitions

Coverage: 60%
```

---

## 8. Performance Targets

- **Heartbeat collection**: < 100ms per node
- **Failure detection**: < 2 minutes (3 failures × 30s + processing)
- **Recovery start**: < 30 seconds after detection
- **Deployment migration**: < 5 minutes
- **Alert delivery**: < 1 minute

---

## 9. Key Open Questions

1. **Q**: Should circuit breaker be per-node or per-endpoint?
   - Current assumption: Per-node
   - **Answer needed**: _______________

2. **Q**: What recovery strategy is default (auto-restart, migrate, manual)?
   - Current assumption: migrate (safer than restart)
   - **Answer needed**: _______________

3. **Q**: How many consecutive failures before marking node unavailable?
   - Current assumption: 6 (3 minutes)
   - **Answer needed**: _______________

4. **Q**: Should we support alerting to external services (PagerDuty, Datadog)?
   - Current assumption: Not in MVP (email + webhook only)
   - **Answer needed**: _______________

5. **Q**: What's the maximum alert frequency to avoid spam?
   - Current assumption: One alert per hour per issue
   - **Answer needed**: _______________

---

**Document Version**: 1.0  
**Created**: January 14, 2026  
**Status**: Ready for Review & Question Resolution
