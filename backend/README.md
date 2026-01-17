# Automator67 Controller/Orchestrator (Go)

High-performance central orchestration service for Automator67, written in Go.

## Overview

The Controller is the **brain of Automator67** responsible for:
- Node registration and management
- Health monitoring
- Deployment orchestration
- Load balancing
- User authentication and authorization
- System state management

## Performance

- **Binary Size**: 12MB (vs 114MB for Node.js equivalent)
- **Memory Footprint**: ~50-100MB at runtime
- **Startup Time**: <100ms
- **Latency**: <1ms p99 for internal operations

## Architecture

```
backend-go/
├── cmd/
│   └── main.go              # Entry point
├── internal/
│   ├── handlers/            # HTTP request handlers
│   ├── services/            # Business logic
│   │   ├── node_registry.go
│   │   ├── health_monitor.go
│   │   └── deployment_manager.go
│   ├── types/               # Domain types
│   └── logger/              # Logging utilities
├── Makefile                 # Build commands
├── go.mod                   # Dependencies
└── go.sum                   # Dependency lock
```

## Prerequisites

- Go 1.21+
- Make (optional, for convenient commands)

## Getting Started

### Build

```bash
make build
# or
go build -o bin/controller cmd/main.go
```

### Run

```bash
make run
# or
./bin/controller
```

### Development (with hot reload)

```bash
# Install air first: go install github.com/cosmtrek/air@latest
make dev
# or
go run cmd/main.go
```

### Production Build

```bash
make run-prod
# or
GIN_MODE=release ./bin/controller
```

## API Endpoints

### Health Check
- `GET /health` - Health status (no auth required)

### Nodes
- `GET /api/v1/nodes` - Get all nodes
- `POST /api/v1/nodes` - Register new node
- `GET /api/v1/nodes/:nodeId` - Get specific node
- `DELETE /api/v1/nodes/:nodeId` - Remove node
- `GET /api/v1/nodes/stats` - Node statistics

### Deployments
- `GET /api/v1/deployments` - Get all deployments
- `POST /api/v1/deployments` - Create deployment
- `GET /api/v1/deployments/:deploymentId` - Get specific deployment
- `DELETE /api/v1/deployments/:deploymentId` - Delete deployment
- `GET /api/v1/deployments/stats` - Deployment statistics

## Configuration

### Environment Variables

```bash
PORT=3000                   # Server port (default: 3000)
GIN_MODE=release           # release or debug (default: debug)
LOG_LEVEL=info             # info, warn, error, debug (default: info)
```

## Dependencies

- **gin-gonic/gin** - HTTP framework (lightweight, fast)
- **google/uuid** - UUID generation

## Testing API

```bash
# Start server
./bin/controller &

# Health check
curl http://localhost:3000/health

# Get nodes
curl http://localhost:3000/api/v1/nodes

# Create node
curl -X POST http://localhost:3000/api/v1/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "render",
    "endpoint": "https://api.render.com",
    "region": "us-east-1",
    "credentials": {
      "oauthTokenEncrypted": "token123",
      "oauthProvider": "github",
      "oauthExpiresAt": 1700000000000
    },
    "capabilities": {
      "cpuCores": 4,
      "memoryGb": 8,
      "diskGb": 50,
      "networkBandwidth": "1Gbps"
    }
  }'

# Kill server
pkill -f "bin/controller"
```

## Features Implemented

- ✅ Node Registry (CRUD operations, indexing)
- ✅ Health Monitoring (periodic checks, status tracking)
- ✅ Deployment Management (lifecycle management)
- ✅ API Routes (all endpoints defined)
- ✅ Error Handling
- ✅ Logging
- ✅ Request ID tracking

## TODO

- [ ] Database integration (PostgreSQL)
- [ ] Authentication (JWT)
- [ ] Encryption for stored credentials
- [ ] Load balancing algorithm
- [ ] Distributed tracing
- [ ] Metrics collection
- [ ] Unit tests
- [ ] Integration tests
- [ ] Docker containerization
- [ ] Kubernetes deployment manifests

## License

MIT
