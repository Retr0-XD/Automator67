# Specification: Frontend Dashboard

**Component**: Web-based User Interface  
**Language**: React 18 + TypeScript  
**Version**: 1.0  
**Status**: Specification - Ready for Review

---

## 1. Component Purpose

The Frontend Dashboard is the **single point of user interaction** with the Automator67 system. It provides a user-friendly interface for:
- Account creation and authentication
- OAuth provider credential management
- Node registration and monitoring
- Application deployment and scaling
- Database query execution
- File storage management
- Real-time system metrics visualization
- Deployment logs and debugging

### Key Principle
**Users should never directly interact with the Controller API** - all interactions go through the Dashboard.

---

## 2. Responsibilities & Boundaries

### ✅ Dashboard IS Responsible For:
1. **User Authentication** (Optional - Cloud Mode Only)
   - Mode selection: Local vs Cloud
   - GitHub OAuth integration (user's own OAuth app)
   - Session management (JWT token storage)
   - Note: Local mode requires no authentication

2. **Credential Management**
   - Display encrypted OAuth token input forms
   - Client-side encryption of credentials
   - Never transmit plaintext credentials to server
   - Display credential status and expiration

3. **Node Management**
   - List all registered nodes with status
   - Display node metrics (CPU, RAM, Disk)
   - Show node provider (Render, Railway, etc.)
   - Trigger node removal/reboot
   - Display node health history

4. **Deployment Management**
   - Create deployment manifest UI
   - Select nodes for deployment
   - Monitor deployment status
   - View deployment logs
   - Scale deployments
   - Rollback deployments

5. **Database Interface**
   - Query builder or SQL editor
   - Display query results in table format
   - Show schema information
   - Display query execution time

6. **Storage Interface**
   - File upload UI
   - File browser/listing
   - File download links
   - File deletion UI
   - Storage usage visualization

7. **Monitoring Dashboard**
   - Real-time metrics charts
   - System health indicators
   - Alert notifications
   - Performance graphs

### ❌ Dashboard IS NOT Responsible For:
- User data storage (all stored on backend)
- Business logic (all on controller)
- Infrastructure provisioning
- Database operations directly
- File serving (proxied through controller)
- Cryptographic operations (use crypto libraries)

---

## 3. Data Models & Interfaces

### 3.1 Authentication Data Model

```
User {
  id: UUID (server-assigned)
  email: string (unique)
  created_at: timestamp
  last_login: timestamp
  master_password_hash: hash (server-side only)
  mfa_enabled: boolean
}

Session {
  access_token: JWT (expires in 1 hour)
  refresh_token: JWT (expires in 7 days)
  user_id: UUID
  created_at: timestamp
  expires_at: timestamp
}

MasterPassword {
  Note: Never transmitted to server
  Used for: Local client-side encryption/decryption
  Length: Minimum 12 characters
}
```

### 3.2 Node Data Model (Display)

```
NodeDisplay {
  id: UUID
  name: string
  provider: string (enum: render, railway, flyio, vercel)
  endpoint: string (URL)
  region: string (us-east, eu-west, etc.)
  status: enum (initializing, ready, busy, degraded, failed)
  health: {
    cpu_percent: number (0-100)
    memory_percent: number (0-100)
    disk_percent: number (0-100)
    uptime_seconds: number
    last_heartbeat: timestamp
  }
  capabilities: {
    cpu_cores: number
    memory_gb: number
    disk_gb: number
    network_bandwidth: string
  }
  created_at: timestamp
  active_deployments: number
}
```

### 3.3 Deployment Data Model (Display)

```
DeploymentDisplay {
  id: UUID
  name: string
  app_type: enum (backend, worker, cron)
  runtime: string (nodejs, python, go, etc.)
  status: enum (pending, deploying, running, failed, scaling)
  replicas: {
    desired: number
    running: number
    failed: number
  }
  nodes: NodeDisplay[] (list of nodes running this app)
  resource_usage: {
    total_cpu: string (sum of all replicas)
    total_memory: string (sum of all replicas)
    total_storage: string (sum of all replicas)
  }
  metrics: {
    requests_per_second: number
    error_rate: number (percent)
    avg_response_time: number (ms)
    p99_response_time: number (ms)
  }
  created_at: timestamp
  last_updated: timestamp
  endpoints: string[] (URLs to access app)
}
```

### 3.4 Credential Encryption Data Model (Local)

```
EncryptedCredential {
  provider: string
  encrypted_token: string (hex)
  salt: string (hex)
  iv: string (hex)
  auth_tag: string (hex)
  algorithm: string ("aes-256-gcm")
  created_at: timestamp
  expires_at: timestamp (optional)
}

Note: EncryptedCredential stored in:
  - localStorage (for session)
  - sessionStorage (for current session only)
  - Never in cookies (prevent CSRF)
```

### 3.5 Query Result Data Model

```
QueryResult {
  query: string
  execution_time_ms: number
  rows_returned: number
  columns: {
    name: string
    type: string (int, string, date, etc.)
  }[]
  data: any[][] (2D array of results)
  error: string (null if success)
}
```

---

## 4. User Workflows & Process Flows

### 4.1 Signup Workflow

```
User Flow:
1. User accesses dashboard
2. User clicks "Sign Up"
3. Dashboard shows signup form:
   - Email input
   - Password input (minimum 12 chars)
   - Master Password input (for encryption)
   - Confirm password
   - Terms acceptance
4. User submits form
5. Dashboard validates:
   - Email format valid
   - Password strength (uppercase, lowercase, numbers, symbols)
   - Passwords match
6. Dashboard sends to backend:
   - POST /api/v1/auth/register
   - Body: {email, password_hash (salted)}
7. Backend validates email uniqueness
8. Backend creates user account
9. Backend returns auth tokens
10. Dashboard stores tokens in secure storage
11. Dashboard redirects to setup wizard

Error Handling:
- Email already exists → Display error message
- Password too weak → Show password strength indicator
- Network error → Retry button + offline indicator
- Backend error → Retry with exponential backoff
```

### 4.2 Add Node Workflow

```
User Flow:
1. User on Dashboard clicks "Add Node"
2. Dashboard shows provider selection:
   - Render
   - Railway
   - Fly.io
   - Vercel
   - Netlify
3. User selects provider
4. Dashboard redirects to provider OAuth:
   - GET {provider_oauth_url}
   - Redirect URI: dashboard.example.com/auth/callback/{provider}
5. User authorizes Automator67 on provider site
6. Provider redirects back with authorization code
7. Dashboard captures code
8. Dashboard sends to backend:
   - POST /api/v1/auth/providers/{provider}/callback
   - Body: {code, state_token}
9. Backend exchanges code for token
10. Backend:
    - Verifies token validity with provider
    - Builds node wrapper Docker image
    - Deploys wrapper to user's account on provider
    - Waits for node to register
    - Stores encrypted token in database
11. Backend returns node_id to dashboard
12. Dashboard shows success message
13. Dashboard refreshes nodes list
14. New node appears in list with "initializing" status

Error Handling:
- User denies authorization → Show error, offer retry
- Token exchange fails → Retry authorization
- Wrapper deployment fails → Show provider error message
- Node doesn't register → Timeout after 5 minutes, show logs
- Network error → Implement retry with backoff
```

### 4.3 Deploy Application Workflow

```
User Flow:
1. User clicks "Deploy New App" button
2. Dashboard shows deployment wizard (multi-step form)

Step 1: Basic Info
- App name (alphanumeric, lowercase, hyphens)
- App type (backend/worker/cron)
- Runtime (nodejs 18/20, python 3.11/3.12, go 1.21, etc.)
- Entrypoint command

Step 2: Resources
- Memory (256MB to 2GB, in increments)
- CPU (0.25 to 2, in increments)
- Storage (1GB to 10GB)
- Number of replicas (1-10)

Step 3: Configuration
- Environment variables (key-value pairs)
- Health check endpoint
- Health check interval (seconds)

Step 4: Review & Deploy
- Show summary of all settings
- Show estimated nodes (auto-selected by LB)
- User clicks "Deploy"

3. Dashboard validates all inputs
4. Dashboard creates manifest object
5. Dashboard sends to backend:
   - POST /api/v1/deployments
   - Body: {manifest}
6. Backend:
   - Validates manifest
   - Selects nodes based on load balancer
   - Packages application
   - Deploys to all selected nodes in parallel
   - Configures health checks
   - Updates load balancer routes
7. Backend returns deployment_id
8. Dashboard:
   - Shows "Deployment in progress" status
   - Polls backend for status every 5 seconds
   - Shows percentage complete
   - When complete, shows success with deployment endpoints

Error Handling:
- Validation error → Show which field is invalid
- No healthy nodes → Show "Insufficient capacity" + suggest scaling
- Deployment fails on one node → Retry on another node
- All nodes fail → Rollback and show error

Polling:
- Poll /api/v1/deployments/{id}/status every 5 seconds
- Stop polling when status == "running" or error occurs
- Timeout after 5 minutes, suggest checking logs
```

### 4.4 Database Query Workflow

```
User Flow:
1. User clicks "Database" tab
2. Dashboard shows:
   - Database selector dropdown
   - SQL editor (textarea with syntax highlighting)
   - Results table (empty)
3. User enters SQL query
4. User clicks "Execute" or presses Ctrl+Enter
5. Dashboard validates:
   - Query not empty
   - Query length < 10MB
6. Dashboard sends to backend:
   - POST /api/v1/databases/{db_id}/query
   - Body: {query}
7. Backend:
   - Parses query
   - Identifies shards
   - Routes to appropriate nodes
   - Executes in parallel
   - Aggregates results
   - Returns results with metadata
8. Dashboard:
   - Shows execution time
   - Shows row count
   - Displays results in table format with pagination
   - Allows export to CSV/JSON

Error Handling:
- SQL syntax error → Show error with line number
- Query timeout (>30s) → Cancel and show "Query took too long"
- Connection failed → Show "Database unavailable"
- No permission → Show "Access denied"
- Empty result → Show "No rows returned"
```

### 4.5 Real-Time Metrics Workflow

```
User Flow:
1. User on Dashboard main page
2. Dashboard shows metrics cards:
   - Total nodes (healthy/degraded/failed)
   - Total deployments (running/pending/failed)
   - System CPU usage (%)
   - System memory usage (%)
3. Charts below showing trends:
   - CPU usage over last hour (updated every 30s)
   - Memory usage over last hour (updated every 30s)
   - Request latency (p50, p95, p99) (updated every 30s)
   - Error rate (%) (updated every 30s)

Connection Method:
- Use WebSocket for real-time updates
- Fallback to polling if WebSocket unavailable
- WebSocket endpoint: wss://controller/ws/metrics
- Poll endpoint: GET /api/v1/metrics every 30 seconds

Data Structure:
```
MetricsUpdate {
  timestamp: timestamp
  nodes: {
    total: number
    healthy: number
    degraded: number
    failed: number
  }
  deployments: {
    total: number
    running: number
    pending: number
    failed: number
  }
  system: {
    cpu_percent: number
    memory_percent: number
    disk_percent: number
  }
  performance: {
    requests_per_second: number
    error_rate: number
    p50_latency_ms: number
    p95_latency_ms: number
    p99_latency_ms: number
  }
}
```

Error Handling:
- WebSocket disconnects → Switch to polling with 5s interval
- Polling fails → Show offline indicator
- Data not updated for 2 minutes → Show "Metrics unavailable"
```

---

## 5. Technical Requirements

### 5.1 Performance Requirements

| Requirement | Target | Measurement |
|------------|--------|-------------|
| Page load time | < 2 seconds | First contentful paint |
| Dashboard render | < 500ms | Time to interactive |
| Form submission | < 3 seconds | Button click to success message |
| Node list refresh | < 1 second | API response received |
| Metrics update | < 2 seconds | Latest data displayed |
| Query execution | Varies | Depends on backend |

### 5.2 Security Requirements

| Requirement | Implementation |
|------------|------------------|
| HTTPS only | All requests over TLS 1.3 |
| XSS protection | Sanitize all user inputs |
| CSRF protection | CSRF tokens in state management |
| Authentication | JWT tokens with 1-hour expiry |
| Token storage | SessionStorage (not localStorage for sensitive) |
| Credential encryption | Client-side AES-256-GCM before transmission |
| Master password | Never stored, used only for crypto ops |
| API key handling | Never displayed in UI, use tokens instead |

### 5.3 Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

### 5.4 Responsive Design

| Breakpoint | Target | Notes |
|-----------|--------|-------|
| Mobile | < 768px | Touch-friendly, single column |
| Tablet | 768px - 1024px | Two columns |
| Desktop | > 1024px | Multi-column layout |

---

## 6. API Contracts (Dashboard → Backend)

### 6.1 Authentication Endpoints

**POST /api/v1/auth/register**
- **Purpose**: Create new user account
- **Request**: {email, password_hash, mfa_enabled}
- **Response**: {user_id, access_token, refresh_token}
- **Errors**: 400 (invalid input), 409 (email exists), 500 (server error)

**POST /api/v1/auth/login**
- **Purpose**: User login
- **Request**: {email, password_hash}
- **Response**: {access_token, refresh_token, expires_in}
- **Errors**: 400 (invalid), 401 (unauthorized), 500

**POST /api/v1/auth/refresh**
- **Purpose**: Refresh expired access token
- **Request**: {refresh_token}
- **Response**: {access_token, expires_in}
- **Errors**: 401 (invalid token), 500

### 6.2 Node Endpoints

**GET /api/v1/nodes**
- **Purpose**: List all nodes
- **Response**: NodeDisplay[]
- **Errors**: 401 (unauthorized), 500

**POST /api/v1/auth/providers/{provider}/callback**
- **Purpose**: OAuth callback from provider
- **Request**: {code, state}
- **Response**: {node_id, endpoint}
- **Errors**: 400 (invalid code), 500

**GET /api/v1/nodes/{id}**
- **Purpose**: Get detailed node info
- **Response**: NodeDisplay (with extended health history)
- **Errors**: 404 (not found), 500

### 6.3 Deployment Endpoints

**POST /api/v1/deployments**
- **Purpose**: Create new deployment
- **Request**: {manifest}
- **Response**: {deployment_id, status}
- **Errors**: 400 (invalid manifest), 503 (no capacity), 500

**GET /api/v1/deployments**
- **Purpose**: List all deployments
- **Response**: DeploymentDisplay[]
- **Errors**: 401, 500

**GET /api/v1/deployments/{id}**
- **Purpose**: Get deployment status
- **Response**: DeploymentDisplay
- **Errors**: 404, 500

**POST /api/v1/deployments/{id}/scale**
- **Purpose**: Scale deployment replicas
- **Request**: {replicas: number}
- **Response**: {deployment_id, new_replica_count}
- **Errors**: 400 (invalid), 404, 500

### 6.4 Database Endpoints

**POST /api/v1/databases/{db_id}/query**
- **Purpose**: Execute database query
- **Request**: {query: string}
- **Response**: QueryResult
- **Errors**: 400 (syntax error), 503 (unavailable), 500

**GET /api/v1/databases**
- **Purpose**: List all databases
- **Response**: {id, name, provider, status}[]
- **Errors**: 401, 500

---

## 7. Component Architecture

### 7.1 Directory Structure

```
packages/frontend/
├── src/
│   ├── index.tsx                 # Entry point
│   ├── App.tsx                   # Root component
│   ├── types/                    # TypeScript definitions
│   │   ├── auth.ts
│   │   ├── node.ts
│   │   ├── deployment.ts
│   │   └── database.ts
│   ├── api/                      # API communication layer
│   │   ├── client.ts            # HTTP client setup
│   │   ├── auth.ts              # Auth API calls
│   │   ├── nodes.ts             # Node API calls
│   │   ├── deployments.ts       # Deployment API calls
│   │   └── database.ts          # Database API calls
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts           # Auth state
│   │   ├── useNodes.ts          # Nodes state
│   │   ├── useDeployments.ts    # Deployments state
│   │   ├── useMetrics.ts        # Metrics state
│   │   └── useWebSocket.ts      # WebSocket handling
│   ├── components/               # React components
│   │   ├── Auth/                # Auth-related components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── LogoutButton.tsx
│   │   ├── Nodes/               # Node management
│   │   │   ├── NodeList.tsx
│   │   │   ├── NodeCard.tsx
│   │   │   ├── AddNodeForm.tsx
│   │   │   └── NodeMetrics.tsx
│   │   ├── Deployments/         # Deployment management
│   │   │   ├── DeploymentList.tsx
│   │   │   ├── DeploymentCard.tsx
│   │   │   ├── DeploymentWizard.tsx
│   │   │   └── DeploymentLogs.tsx
│   │   ├── Database/            # Database interface
│   │   │   ├── QueryEditor.tsx
│   │   │   ├── ResultsTable.tsx
│   │   │   └── SchemaViewer.tsx
│   │   ├── Storage/             # Storage management
│   │   │   ├── FileBrowser.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── FilePreview.tsx
│   │   ├── Dashboard/           # Dashboard components
│   │   │   ├── MetricsChart.tsx
│   │   │   ├── HealthIndicator.tsx
│   │   │   └── QuickStats.tsx
│   │   ├── Common/              # Reusable components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   └── Layout/              # Layout wrappers
│   │       ├── AuthLayout.tsx
│   │       └── DashboardLayout.tsx
│   ├── pages/                    # Page components
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Nodes.tsx
│   │   ├── Deployments.tsx
│   │   ├── Database.tsx
│   │   ├── Storage.tsx
│   │   └── NotFound.tsx
│   ├── store/                    # State management
│   │   ├── auth.ts              # Auth store
│   │   ├── ui.ts                # UI state
│   │   └── index.ts             # Store setup
│   ├── utils/                    # Utility functions
│   │   ├── crypto.ts            # Encryption utilities
│   │   ├── validation.ts        # Input validation
│   │   ├── formatting.ts        # Data formatting
│   │   └── constants.ts         # Constants
│   ├── styles/                   # CSS/styling
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── components.css
│   └── config.ts                # Configuration
├── public/                       # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── index.html
├── tests/                        # Test files
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
├── .env.example                 # Environment variables template
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite config
└── package.json                 # Dependencies
```

### 7.2 Key Libraries (To Be Selected)

| Category | Selection | Alternative |
|----------|-----------|-------------|
| HTTP Client | axios or fetch API | - |
| State Management | Zustand | Redux, Jotai |
| Form Handling | react-hook-form | Formik |
| Validation | Zod or Yup | joi |
| UI Components | shadcn/ui | Material-UI, Ant Design |
| Styling | Tailwind CSS | Styled-components |
| Charts | Recharts | Chart.js, Victory |
| WebSocket | native WebSocket or socket.io | ws library |
| Testing | Vitest + React Testing Library | Jest + Enzyme |
| Encryption | crypto-js or TweetNaCl.js | libsodium.js |

---

## 8. Error Handling Strategy

### 8.1 Network Error Handling

```
Error Category: Network Failed

Scenario 1: Request Timeout (>30s)
- Action: Show "Request timed out" message
- Recovery: Provide "Retry" button
- Logging: Log to error tracking service

Scenario 2: Connection Lost
- Action: Show offline banner at top
- Recovery: Auto-retry every 10s until reconnected
- Logging: Log connection event

Scenario 3: 4xx Client Error
- Action: Show specific error message to user
- Recovery: Highlight which field needs correction
- Logging: Log for debugging

Scenario 4: 5xx Server Error
- Action: Show "Server error, try again later" message
- Recovery: Implement exponential backoff retry
- Logging: Log error with full details
```

### 8.2 Validation Error Handling

```
Error Category: User Input Validation

Scenario 1: Invalid Email Format
- Action: Show "Invalid email format" message
- Location: Below email input field
- Recovery: User corrects and resubmits

Scenario 2: Password Too Weak
- Action: Show password strength indicator with feedback
- Recovery: User enters stronger password

Scenario 3: Required Field Missing
- Action: Show "*Required" message below field
- Recovery: User fills in field

Scenario 4: Passwords Don't Match
- Action: Show error message in confirm password field
- Recovery: User corrects password
```

### 8.3 Authentication Error Handling

```
Error Category: Authentication

Scenario 1: Invalid Credentials (Login)
- Action: Show "Invalid email or password" message
- Recovery: Show "Forgot password?" link

Scenario 2: Session Expired
- Action: Show modal "Your session has expired"
- Recovery: Provide "Login Again" button

Scenario 3: Unauthorized Access (401)
- Action: Redirect to login page
- Recovery: User logs in again

Scenario 4: Token Refresh Failed
- Action: Clear all stored tokens
- Recovery: Force user to login again
```

---

## 9. State Management Strategy

### 9.1 Global State (Zustand Store)

```
AuthStore {
  // State
  user: User | null
  isAuthenticated: boolean
  access_token: string | null
  refresh_token: string | null
  loading: boolean
  error: string | null

  // Actions
  login(email, password)
  signup(email, password, masterPassword)
  logout()
  refreshToken()
  setUser(user)
  clearError()
}

UIStore {
  // State
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  selectedNode: UUID | null
  notifications: Notification[]

  // Actions
  toggleSidebar()
  setTheme(theme)
  selectNode(nodeId)
  addNotification(notification)
  removeNotification(id)
}

NodesStore {
  // State
  nodes: NodeDisplay[]
  selectedNode: NodeDisplay | null
  loading: boolean
  error: string | null
  lastUpdated: timestamp

  // Actions
  fetchNodes()
  selectNode(nodeId)
  refreshNode(nodeId)
  removeNode(nodeId)
  setLoading(loading)
  setError(error)
}

DeploymentsStore {
  // State
  deployments: DeploymentDisplay[]
  selectedDeployment: DeploymentDisplay | null
  loading: boolean
  error: string | null

  // Actions
  fetchDeployments()
  selectDeployment(deploymentId)
  createDeployment(manifest)
  deleteDeployment(deploymentId)
  scaleDeployment(deploymentId, replicas)
}

MetricsStore {
  // State
  metrics: MetricsUpdate
  historicalMetrics: MetricsUpdate[]
  loading: boolean
  connected: boolean (WebSocket status)

  // Actions
  startMetricsStream()
  stopMetricsStream()
  updateMetrics(data)
  addHistoricalMetrics(data)
}
```

### 9.2 Local Component State

Use React hooks (useState, useContext) for:
- Form input values
- Modal open/closed state
- Dropdown selections
- Temporary UI state

---

## 10. Testing Strategy for Dashboard

### 10.1 Unit Tests

```
Test Files Required:

1. api/auth.test.ts
   - Test login API call
   - Test signup API call
   - Test token refresh
   - Test error handling

2. api/nodes.test.ts
   - Test nodes list retrieval
   - Test node details retrieval
   - Test API error handling

3. components/Auth/LoginForm.test.tsx
   - Test form validation
   - Test form submission
   - Test error message display
   - Test loading state

4. hooks/useAuth.test.ts
   - Test login function
   - Test logout function
   - Test token refresh
   - Test authenticated state

5. utils/crypto.test.ts
   - Test credential encryption
   - Test credential decryption
   - Test invalid decryption handling

6. utils/validation.test.ts
   - Test email validation
   - Test password strength validation
   - Test required field validation

Coverage Target: 80% of utility functions
```

### 10.2 Integration Tests

```
Test Scenarios:

1. Authentication Flow
   - User signup complete flow
   - User login complete flow
   - User logout complete flow
   - Session expiration and refresh

2. Node Management Flow
   - Add new node (OAuth flow)
   - View node details
   - Remove node
   - Refresh node metrics

3. Deployment Flow
   - Create deployment
   - Monitor deployment progress
   - Scale deployment
   - View deployment logs

4. Database Flow
   - Execute query
   - View results
   - Error handling

5. Metrics Flow
   - WebSocket connection
   - Metrics updates
   - Fallback to polling
   - Disconnect handling

Coverage Target: 60% of user workflows
```

### 10.3 End-to-End Tests (Cypress/Playwright)

```
Critical User Journeys:

1. New User Journey
   - Visit dashboard
   - Sign up
   - Complete onboarding
   - Add first node
   - Deploy first app

2. Experienced User Journey
   - Login
   - View metrics
   - Deploy new app
   - Monitor deployment
   - Scale application

3. Error Scenario
   - Network error handling
   - Invalid input handling
   - Session expiration handling
   - Provider OAuth failure

4. Real-time Updates
   - Metrics update in real-time
   - Node status updates
   - Deployment status updates

Coverage Target: 40% of critical paths
```

### 10.4 Testing Tools

| Category | Tool |
|----------|------|
| Unit Testing | Vitest |
| Component Testing | React Testing Library |
| E2E Testing | Cypress or Playwright |
| Visual Regression | Percy or Chromatic |
| Performance Testing | Lighthouse CI |
| Accessibility Testing | axe-core |

---

## 11. Key Open Questions / Doubts

Please clarify the following before development starts:

### 11.1 Authentication & Security
1. **Q**: Should dashboard support OAuth login (Google, GitHub) or only email/password?
   - Current assumption: Email/password only, with optional 2FA
   - **Answer needed**: _______________

2. **Q**: How should we handle refresh token rotation? 
   - Current assumption: Backend issues new refresh token on refresh
   - **Answer needed**: _______________

3. **Q**: Should master password be stored anywhere (even hashed)?
   - Current assumption: Never stored, only used during session
   - **Answer needed**: _______________

### 11.2 Deployment & Scaling
4. **Q**: Should users be able to deploy from Git repositories directly?
   - Current assumption: No, only manifest-based deployment initially
   - **Answer needed**: _______________

5. **Q**: Should deployment history/versioning be supported?
   - Current assumption: Not in MVP, add in Phase 2
   - **Answer needed**: _______________

6. **Q**: Should rollback be automatic (on health check failure) or manual?
   - Current assumption: Manual rollback, with option for automatic in Phase 2
   - **Answer needed**: _______________

### 11.3 Metrics & Monitoring
7. **Q**: Should metrics only update via WebSocket or also support polling fallback?
   - Current assumption: WebSocket primary, polling fallback
   - **Answer needed**: _______________

8. **Q**: How far back should historical metrics be retained?
   - Current assumption: Last 7 days
   - **Answer needed**: _______________

9. **Q**: Should dashboard support setting up alerts/notifications?
   - Current assumption: Not in MVP, Phase 3 feature
   - **Answer needed**: _______________

### 11.4 Database Interface
10. **Q**: Should dashboard support saved queries/templates?
    - Current assumption: Not in MVP
    - **Answer needed**: _______________

11. **Q**: Should query results be paginated or show all at once?
    - Current assumption: Paginated (10/25/50/100 rows per page)
    - **Answer needed**: _______________

12. **Q**: Should dashboard support data export (CSV, JSON)?
    - Current assumption: Yes, from day 1
    - **Answer needed**: _______________

### 11.5 UI/UX
13. **Q**: Should dashboard support dark mode?
    - Current assumption: Yes, with theme toggle
    - **Answer needed**: _______________

14. **Q**: Should dashboard be mobile-responsive or desktop-only?
    - Current assumption: Responsive (mobile-friendly)
    - **Answer needed**: _______________

15. **Q**: Should we use existing UI component library (shadcn/ui)?
    - Current assumption: Yes, for consistency and speed
    - **Answer needed**: _______________

---

## 12. Definition of Done (Acceptance Criteria)

Dashboard is considered "Done" when:

### 12.1 Functional Requirements
- ✅ User can sign up and login
- ✅ User can add nodes via OAuth (at least 1 provider)
- ✅ User can view nodes with real-time status
- ✅ User can create and deploy applications
- ✅ User can execute database queries
- ✅ User can upload and browse files
- ✅ User can view real-time metrics
- ✅ All API contracts working correctly

### 12.2 Non-Functional Requirements
- ✅ Page load time < 2 seconds (first contentful paint)
- ✅ Dashboard render < 500ms (time to interactive)
- ✅ Form submission < 3 seconds (including API call)
- ✅ All forms validate user input
- ✅ All errors handled gracefully with user-friendly messages
- ✅ HTTPS enforced for all requests
- ✅ Credentials encrypted before transmission

### 12.3 Testing Requirements
- ✅ Unit test coverage: 80% of utility functions
- ✅ Integration test coverage: 60% of workflows
- ✅ E2E test coverage: 40% of critical paths
- ✅ All critical workflows have end-to-end tests
- ✅ No console errors or warnings
- ✅ Accessibility score: 90+

### 12.4 Code Quality
- ✅ TypeScript strict mode enabled
- ✅ ESLint passes (zero errors)
- ✅ Prettier formatting applied
- ✅ No console.log statements in production code
- ✅ Code review approved by 1 senior developer

### 12.5 Documentation
- ✅ All components have JSDoc comments
- ✅ Complex logic has inline comments
- ✅ README updated with setup instructions
- ✅ Environment variables documented
- ✅ API integration documented

---

## 13. Development Milestones & Tasks

### Phase 1: MVP (Weeks 1-3)

**Milestone 1.1: Project Setup** (Days 1-3)
- [ ] Task 1.1.1: Initialize React project with Vite
- [ ] Task 1.1.2: Set up TypeScript strict mode
- [ ] Task 1.1.3: Configure ESLint + Prettier
- [ ] Task 1.1.4: Set up Tailwind CSS + shadcn/ui
- [ ] Task 1.1.5: Configure Vitest for unit testing
- [ ] Testing: Verify all tools working correctly

**Milestone 1.2: Authentication** (Days 3-6)
- [ ] Task 1.2.1: Create auth types and interfaces
- [ ] Task 1.2.2: Build signup form component
- [ ] Task 1.2.3: Build login form component
- [ ] Task 1.2.4: Implement auth API client
- [ ] Task 1.2.5: Create auth store (Zustand)
- [ ] Task 1.2.6: Implement token storage and refresh
- [ ] Testing: Unit tests for auth API, integration tests for signup/login flow

**Milestone 1.3: Layout & Navigation** (Days 6-8)
- [ ] Task 1.3.1: Create main dashboard layout
- [ ] Task 1.3.2: Build sidebar navigation
- [ ] Task 1.3.3: Create page routing
- [ ] Task 1.3.4: Implement protected routes
- [ ] Testing: Verify navigation between pages

**Milestone 1.4: Nodes Management** (Days 8-12)
- [ ] Task 1.4.1: Create node display types
- [ ] Task 1.4.2: Build nodes list component
- [ ] Task 1.4.3: Build node card component
- [ ] Task 1.4.4: Create add node form
- [ ] Task 1.4.5: Implement OAuth flow
- [ ] Task 1.4.6: Create nodes store
- [ ] Testing: Unit tests for node components, integration tests for add node flow

**Milestone 1.5: Basic Dashboard** (Days 12-15)
- [ ] Task 1.5.1: Create metrics display cards
- [ ] Task 1.5.2: Build basic charts (Recharts)
- [ ] Task 1.5.3: Implement polling for metrics
- [ ] Task 1.5.4: Create dashboard page
- [ ] Testing: Verify metrics update and display correctly

**Milestone 1.6: Testing & Polish** (Days 15-21)
- [ ] Task 1.6.1: Write comprehensive unit tests
- [ ] Task 1.6.2: Write integration tests
- [ ] Task 1.6.3: E2E tests for critical flows
- [ ] Task 1.6.4: Performance optimization
- [ ] Task 1.6.5: Accessibility audit and fixes
- [ ] Task 1.6.6: Documentation and code cleanup
- [ ] Testing: All tests passing, 80%+ coverage

---

## 14. Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Build time | < 30 seconds | `npm run build` |
| Page load | < 2s | Lighthouse score |
| Unit test coverage | 80% | Coverage report |
| Integration test coverage | 60% | Coverage report |
| Critical path E2E coverage | 40% | Test results |
| Zero console errors | 100% | Browser console |
| Accessibility score | 90+ | axe-core report |
| TypeScript errors | 0 | `tsc --noEmit` |
| ESLint errors | 0 | ESLint report |

---

## 15. Assumptions Made (To Be Validated)

1. **Backend API is available** during dashboard development
2. **OAuth providers (Render, Railway)** have usable APIs
3. **Users have modern browsers** (Chrome 90+, Firefox 88+)
4. **WebSocket is available** for real-time metrics (with polling fallback)
5. **Master password will be handled by user** (no backend storage)
6. **Dashboard is single-user application** (not multi-tenant initially)
7. **Responsive design priority** over specialized mobile app

---

**Document Version**: 1.0  
**Created**: January 14, 2026  
**Status**: Ready for Review & Question Resolution
