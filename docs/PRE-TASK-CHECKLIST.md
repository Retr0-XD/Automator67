# Automator67 - Pre-Task Checklist & Remaining Work

**Date**: January 16, 2026  
**Current Status**: Backend Controller (Go) Implemented  
**Branch**: `milestone/M1.3-layout`

---

## ✅ What Has Been Completed

### Frontend (React + TypeScript)
- [x] Vite project initialized with React 19.2, TypeScript 5.9
- [x] ESLint, Prettier, Tailwind CSS v4, shadcn/ui setup
- [x] Authentication system (GitHub OAuth + local mode)
- [x] Token management (localStorage, JWT refresh)
- [x] Dashboard layout with sidebar navigation
- [x] Protected routes (local mode / cloud mode)
- [x] Zustand stores (authStore)
- [x] Components: NodeCard, AddNodeForm, DeploymentWizard
- [x] Pages: Dashboard, Nodes, Deployments, Database, Storage, Monitoring
- [x] 103 unit tests (98.1% pass rate)

### Backend (Go) - Controller/Orchestrator
- [x] Go 1.21 project with Gin framework
- [x] Core types & domain models defined
- [x] NodeRegistry service (CRUD, filtering, stats)
- [x] HealthMonitor service (periodic checks)
- [x] DeploymentManager service (lifecycle management)
- [x] HTTP handlers for all API endpoints
- [x] RESTful API routes (/api/v1/*)
- [x] Error handling middleware
- [x] Request ID tracking middleware
- [x] Graceful shutdown handling
- [x] Binary builds successfully (12MB)
- [x] API endpoints tested & working
- [x] Makefile for build/run commands
- [x] Documentation (README.md)

---

## 🚨 Critical Requirements BEFORE Moving Forward

### 1. Database Integration (HIGHEST PRIORITY)

**Why**: All services currently use in-memory storage. Data is lost on restart.

**What's Needed**:
- [x] PostgreSQL connection setup
- [ ] Database schema creation (tables: users, nodes, deployments)
- [ ] Migration system (for schema versioning)
- [ ] Connection pooling
- [ ] Transaction management

**From SPEC-02**:
```sql
-- User Table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  created_at TIMESTAMP,
  last_login TIMESTAMP,
  mfa_enabled BOOLEAN,
  active BOOLEAN
);

-- Node Table
CREATE TABLE nodes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50),
  endpoint VARCHAR(255),
  region VARCHAR(100),
  status VARCHAR(50),
  capabilities JSONB,
  credentials JSONB,
  health JSONB,
  created_at TIMESTAMP,
  last_heartbeat TIMESTAMP,
  last_metrics_update TIMESTAMP
);

-- Deployment Table
CREATE TABLE deployments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  app_type VARCHAR(50),
  runtime VARCHAR(100),
  status VARCHAR(50),
  source_url VARCHAR(255),
  entrypoint VARCHAR(255),
  port INT,
  instances INT,
  resources JSONB,
  env_vars JSONB,
  health_check JSONB,
  target_node_ids JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Estimated Effort**: 4-6 hours

---

### 2. Authentication Middleware (HIGH PRIORITY)

**Why**: API currently has no authentication. Any user can access any other user's data.

**What's Needed**:
- [ ] JWT token generation (Sign, Verify)
- [ ] Authentication middleware (verify JWT)
- [ ] Password hashing (bcrypt)
- [ ] User registration endpoint
- [ ] User login endpoint
- [ ] Token refresh endpoint
- [ ] Session management

**API Endpoints Needed**:
```
POST   /api/v1/auth/register    - Create account
POST   /api/v1/auth/login       - Login with email/password
POST   /api/v1/auth/refresh     - Refresh expired token
POST   /api/v1/auth/logout      - Revoke token
GET    /api/v1/auth/me          - Get current user info
```

**From SPEC-02**: Users must authenticate before accessing nodes/deployments

**Estimated Effort**: 3-4 hours

---

### 3. Frontend-Backend Integration (MEDIUM PRIORITY)

**Why**: Frontend UI components don't connect to backend API yet.

**What's Needed**:
- [ ] Update AddNodeForm to POST to `/api/v1/nodes`
- [ ] Update NodeCard to use real data from API
- [ ] Update NodesPage to fetch from `/api/v1/nodes` instead of local store
- [ ] Update DeploymentWizard to POST to `/api/v1/deployments`
- [ ] Update DeploymentsPage to fetch from API
- [ ] Add error handling for failed API calls
- [ ] Add loading states while fetching

**Current State**:
- Frontend components use Zustand stores (in-memory)
- Backend API is ready but disconnected
- No API client configuration

**Estimated Effort**: 3-4 hours

---

## 📋 Complete Task Breakdown (What's Next)

### Phase 1: Data Persistence (2-3 days)

**Task 1.1**: Set up PostgreSQL
- [ ] Create PostgreSQL container (docker-compose)
- [ ] Connect from Go backend
- [ ] Configure connection pooling
- [ ] Setup logging for DB queries

**Task 1.2**: Create database schema
- [ ] Create users table
- [ ] Create nodes table
- [ ] Create deployments table
- [ ] Add indices for performance
- [ ] Create migration files

**Task 1.3**: Migrate services to database
- [ ] Update NodeRegistry to use PostgreSQL
- [ ] Update DeploymentManager to use PostgreSQL
- [ ] Handle null values and error cases
- [ ] Add transaction support

**Task 1.4**: Seed initial data
- [ ] Create test user
- [ ] Add validation fixtures
- [ ] Document how to reset database

---

### Phase 2: Authentication (1-2 days)

**Task 2.1**: Implement JWT system
- [ ] Generate JWT tokens on login
- [ ] Verify tokens in middleware
- [ ] Handle token expiration
- [ ] Implement refresh token flow

**Task 2.2**: Create auth endpoints
- [ ] POST /api/v1/auth/register
- [ ] POST /api/v1/auth/login
- [ ] POST /api/v1/auth/refresh
- [ ] POST /api/v1/auth/logout

**Task 2.3**: Add auth middleware
- [ ] Apply to all /api/v1/* routes
- [ ] Extract userId from JWT
- [ ] Validate user ownership of resources

**Task 2.4**: Hash passwords securely
- [ ] Use bcrypt for password hashing
- [ ] Never store plaintext passwords
- [ ] Add password validation

---

### Phase 3: Frontend Integration (2-3 days)

**Task 3.1**: Create API client
- [ ] Setup axios/fetch wrapper
- [ ] Add base URL configuration
- [ ] Handle authentication headers
- [ ] Add error handling

**Task 3.2**: Update Nodes management
- [ ] Wire AddNodeForm to POST endpoint
- [ ] Fetch nodes list on component mount
- [ ] Delete nodes via API
- [ ] Show loading/error states

**Task 3.3**: Update Deployments management
- [ ] Wire DeploymentWizard to API
- [ ] Fetch deployments on page load
- [ ] Delete deployments via API
- [ ] Show loading/error states

**Task 3.4**: Add authentication UI
- [ ] Integrate login form with API
- [ ] Handle token storage
- [ ] Refresh token on expiration
- [ ] Logout functionality

---

### Phase 4: Testing (1-2 days)

**Task 4.1**: Backend tests
- [ ] Unit tests for services
- [ ] Integration tests with database
- [ ] API endpoint tests
- [ ] Authentication tests

**Task 4.2**: Frontend tests
- [ ] Update component tests for API calls
- [ ] Mock API responses
- [ ] Test error handling
- [ ] Test loading states

**Task 4.3**: End-to-end tests
- [ ] Full user flow (register → add node → deploy)
- [ ] Error scenarios
- [ ] Session management

---

## 🔍 Pre-Task Verification Checklist

Before starting next tasks, verify:

- [x] Backend compiles without errors
- [x] Backend starts successfully
- [x] API endpoints respond
- [x] Frontend builds without errors
- [x] Frontend dev server runs
- [x] All components render
- [x] Go binary is small (12MB)
- [ ] PostgreSQL is accessible
- [ ] Database schema is created
- [ ] Frontend has API client
- [ ] Authentication is implemented

---

## 📊 Feature Implementation Status

| Feature | Frontend | Backend | Database | Status |
|---------|----------|---------|----------|--------|
| Nodes Management | ✅ UI | ✅ API | ❌ No DB | Partial |
| Deployments | ✅ UI | ✅ API | ❌ No DB | Partial |
| Authentication | ⚠️ UI only | ❌ Not done | ❌ No DB | Not started |
| User Management | ❌ Not done | ❌ Not done | ❌ No DB | Not started |
| Health Monitoring | ⚠️ Stubbed | ⚠️ Stubbed | ❌ No DB | Partial |
| Storage Manager | ❌ Not done | ❌ Not done | ❌ No DB | Not started |
| Database Router | ❌ Not done | ❌ Not done | ❌ No DB | Not started |
| Node Wrapper | ❌ Not done | ❌ Not done | - | Not started |

---

## ⚠️ Critical Issues to Address

### 1. **Data Persistence**
- Current: In-memory storage (data lost on restart)
- Fix: Implement PostgreSQL layer
- Urgency: CRITICAL

### 2. **Authentication**
- Current: No authentication (anyone can access any data)
- Fix: Implement JWT + password hashing
- Urgency: CRITICAL

### 3. **Frontend-Backend Disconnect**
- Current: Frontend UI works but doesn't call API
- Fix: Wire frontend components to API endpoints
- Urgency: HIGH

### 4. **Error Handling**
- Current: Minimal error handling in API
- Fix: Add validation, proper error responses
- Urgency: MEDIUM

### 5. **Testing**
- Current: Frontend tests exist, no backend tests
- Fix: Add backend unit & integration tests
- Urgency: MEDIUM

---

## 🎯 Recommended Next Steps (Priority Order)

### Week 1 (Immediate)
1. **Set up PostgreSQL** (4 hours)
2. **Create database schema** (3 hours)
3. **Migrate services to DB** (5 hours)

### Week 2
4. **Implement authentication** (4 hours)
5. **Wire frontend to backend** (5 hours)
6. **Add tests** (4 hours)

### Week 3
7. **Health Monitor implementation** (6 hours)
8. **Node Wrapper skeleton** (4 hours)
9. **Storage Manager** (6 hours)

---

## 📝 Notes

- **Backend**: Currently fully functional but in-memory only
- **Frontend**: UI complete but not connected to backend
- **Database**: No schema yet, in-memory only
- **Testing**: Frontend has 103 tests, backend has none
- **Deployment**: Both can be containerized but no Docker files yet

All specifications are complete and available in `docs/` folder.
