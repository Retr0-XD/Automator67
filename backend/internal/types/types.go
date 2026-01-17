package types

import "time"

// NodeStatus represents the status of a node
type NodeStatus string

const (
	NodeStatusInitializing NodeStatus = "initializing"
	NodeStatusReady        NodeStatus = "ready"
	NodeStatusBusy         NodeStatus = "busy"
	NodeStatusDegraded     NodeStatus = "degraded"
	NodeStatusFailed       NodeStatus = "failed"
	NodeStatusRemoved      NodeStatus = "removed"
)

// CloudProvider represents supported cloud providers
type CloudProvider string

const (
	ProviderRender   CloudProvider = "render"
	ProviderRailway  CloudProvider = "railway"
	ProviderFlyIO    CloudProvider = "flyio"
	ProviderVercel   CloudProvider = "vercel"
	ProviderNetlify  CloudProvider = "netlify"
)

// NodeMetrics contains performance metrics for a node
type NodeMetrics struct {
	CPUPercent       float64 `json:"cpuPercent"`
	MemoryPercent    float64 `json:"memoryPercent"`
	DiskPercent      float64 `json:"diskPercent"`
	ActiveRequests   int     `json:"activeRequests"`
	ErrorRate        float64 `json:"errorRate"`
	AvgResponseTimeMs int64   `json:"avgResponseTimeMs"`
}

// NodeHealth contains health information for a node
type NodeHealth struct {
	CPUPercent    float64 `json:"cpuPercent"`
	MemoryPercent float64 `json:"memoryPercent"`
	DiskPercent   float64 `json:"diskPercent"`
	Uptime        int64   `json:"uptime"` // seconds
	LastHeartbeat int64   `json:"lastHeartbeat"`
}

// NodeCapabilities defines what a node can handle
type NodeCapabilities struct {
	CPUCores         int    `json:"cpuCores"`
	MemoryGb         int    `json:"memoryGb"`
	DiskGb           int    `json:"diskGb"`
	NetworkBandwidth string `json:"networkBandwidth"`
}

// Node represents a registered node in the system
type Node struct {
	ID               string            `json:"id"`
	UserID           string            `json:"userId"`
	Provider         CloudProvider     `json:"provider"`
	Endpoint         string            `json:"endpoint"`
	Region           string            `json:"region"`
	Status           NodeStatus        `json:"status"`
	Health           NodeHealth        `json:"health"`
	Capabilities     NodeCapabilities  `json:"capabilities"`
	Credentials      NodeCredentials   `json:"credentials"`
	CreatedAt        int64             `json:"createdAt"`
	LastHeartbeat    int64             `json:"lastHeartbeat"`
	LastMetricsUpdate int64            `json:"lastMetricsUpdate"`
}

// NodeCredentials holds encrypted credentials for a node
type NodeCredentials struct {
	OAuthTokenEncrypted string `json:"oauthTokenEncrypted"`
	OAuthProvider       string `json:"oauthProvider"`
	OAuthExpiresAt      int64  `json:"oauthExpiresAt"`
}

// DeploymentStatus represents deployment state
type DeploymentStatus string

const (
	DeploymentStatusPending   DeploymentStatus = "pending"
	DeploymentStatusDeploying DeploymentStatus = "deploying"
	DeploymentStatusRunning   DeploymentStatus = "running"
	DeploymentStatusUpdating  DeploymentStatus = "updating"
	DeploymentStatusFailed    DeploymentStatus = "failed"
	DeploymentStatusStopped   DeploymentStatus = "stopped"
)

// EnvVar represents an environment variable
type EnvVar struct {
	Key    string `json:"key"`
	Value  string `json:"value"`
	Secret bool   `json:"secret,omitempty"`
}

// HealthCheck defines health check configuration
type HealthCheck struct {
	Path     string `json:"path"`
	Interval int    `json:"interval"` // seconds
	Timeout  int    `json:"timeout"`  // seconds
	Retries  int    `json:"retries"`
}

// Resources defines resource limits
type Resources struct {
	MemoryLimitMb  int     `json:"memoryLimitMb"`
	CPULimit       float64 `json:"cpuLimit"`
	StorageLimitMb int     `json:"storageLimitMb"`
}

// Deployment represents an application deployment
type Deployment struct {
	ID            string             `json:"id"`
	UserID        string             `json:"userId"`
	Name          string             `json:"name"`
	AppType       string             `json:"appType"` // backend, worker, cron
	Runtime       string             `json:"runtime"`
	Status        DeploymentStatus   `json:"status"`
	SourceURL     string             `json:"sourceUrl,omitempty"`
	Entrypoint    string             `json:"entrypoint"`
	Port          *int               `json:"port,omitempty"`
	Instances     int                `json:"instances"`
	TargetNodeIDs []string           `json:"targetNodeIds"`
	EnvVars       []EnvVar           `json:"envVars"`
	Resources     Resources          `json:"resources"`
	HealthCheck   *HealthCheck       `json:"healthCheck,omitempty"`
	CreatedAt     int64              `json:"createdAt"`
	UpdatedAt     int64              `json:"updatedAt"`
}

// User represents a user in the system
type User struct {
	ID           string `json:"id"`
	Email        string `json:"email"`
	PasswordHash string `json:"passwordHash,omitempty"`
	CreatedAt    int64  `json:"createdAt"`
	UpdatedAt    int64  `json:"updatedAt"`
	MFAEnabled   bool   `json:"mfaEnabled"`
	Active       bool   `json:"active"`
}

// APIResponse is the standard API response wrapper
type APIResponse struct {
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
	RequestID string      `json:"requestId,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error      string                 `json:"error"`
	Message    string                 `json:"message"`
	StatusCode int                    `json:"statusCode"`
	Timestamp  time.Time              `json:"timestamp"`
	RequestID  string                 `json:"requestId,omitempty"`
	Details    map[string]interface{} `json:"details,omitempty"`
}
