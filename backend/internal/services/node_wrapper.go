package services

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"sync"
	"time"

	"automator67/internal/logger"
	"automator67/internal/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
	"github.com/google/uuid"
)

// ApplicationInstance represents a running application on a node
type ApplicationInstance struct {
	ID           string
	DeploymentID string
	Name         string
	Status       string // pending, starting, running, failing, stopped
	Container    ContainerInfo
	Manifest     DeploymentManifest
	Ports        []PortMapping
	Metrics      ApplicationMetrics
	Logs         ApplicationLogs
	ErrorMessage string
	CreatedAt    int64
	UpdatedAt    int64
}

// ContainerInfo holds Docker container information
type ContainerInfo struct {
	ID        string
	CreatedAt int64
	StartedAt int64
	StoppedAt int64
}

// DeploymentManifest contains deployment configuration
type DeploymentManifest struct {
	Runtime    string
	Entrypoint string
	Resources  ResourceLimits
	EnvVars    map[string]string
	HealthCheck HealthCheckConfig
}

// ResourceLimits defines resource constraints
type ResourceLimits struct {
	MemoryLimitMB  int
	CPULimit       float64
	StorageLimitMB int
}

// HealthCheckConfig defines health check parameters
type HealthCheckConfig struct {
	Path     string
	Interval int
	Timeout  int
	Retries  int
}

// PortMapping maps container ports to exposed ports
type PortMapping struct {
	ContainerPort int
	HostPort      int
	Protocol      string // tcp or udp
}

// ApplicationMetrics holds current application metrics
type ApplicationMetrics struct {
	CPUPercent        float64
	MemoryMB          int
	MemoryUsageMB     float64
	MemoryPercent     float64
	DiskUsedMB        int
	NetworkRxMB       float64
	NetworkTxMB       float64
	RequestsServed    int64
	LastHealthCheck   int64
	HealthStatus      string
	AverageLatencyMs  float64
	ErrorRate         float64
	Timestamp         int64
}

// ApplicationLogs holds application logs
type ApplicationLogs struct {
	StdoutSize int64
	StderrSize int64
	LastLines  int
}

// NodeHealthStatus represents the current health of the node
type NodeHealthStatus struct {
	Timestamp         int64
	UptimeSeconds     int64
	SystemHealth      SystemHealthInfo
	ContainerStats    ContainerStats
	NetworkStats      NetworkStats
	Errors            ErrorStats
}

// SystemHealthInfo contains system resource information
type SystemHealthInfo struct {
	CPUPercent     float64
	MemoryPercent  float64
	DiskPercent    float64
	TotalMemoryMB  float64
	UsedMemoryMB   float64
	LoadAverage    [3]float64
}

// ContainerStats tracks container statistics
type ContainerStats struct {
	Total   int
	Running int
	Failed  int
	Stopped int
}

// NetworkStats tracks network statistics
type NetworkStats struct {
	InboundBytes      int64
	OutboundBytes     int64
	ActiveConnections int
}

// ErrorStats tracks error information
type ErrorStats struct {
	LastError     string
	ErrorCount    int
	LastErrorTime int64
}

// NodeWrapperService manages the Node Wrapper functionality
type NodeWrapperService struct {
	nodeID              string
	applications        map[string]*ApplicationInstance
	applicationsMutex   sync.RWMutex
	healthStatus        *NodeHealthStatus
	healthStatusMutex   sync.RWMutex
	startTime           int64
	masterKey           string
	credentialStore     map[string]interface{}
	credentialMutex     sync.RWMutex
	dockerClient        *client.Client
	ctx                 context.Context
	cancel              context.CancelFunc
}

// NewNodeWrapperService creates a new Node Wrapper service
func NewNodeWrapperService(nodeID string) *NodeWrapperService {
	if nodeID == "" {
		nodeID = uuid.New().String()
	}

	ctx, cancel := context.WithCancel(context.Background())

	// Initialize Docker client
	dockerClient, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		logger.Error("Failed to initialize Docker client", err)
		dockerClient = nil // Continue without Docker client, will error on container operations
	}

	svc := &NodeWrapperService{
		nodeID:          nodeID,
		applications:    make(map[string]*ApplicationInstance),
		credentialStore: make(map[string]interface{}),
		dockerClient:    dockerClient,
		startTime:       time.Now().Unix(),
		ctx:             ctx,
		cancel:          cancel,
		masterKey:       uuid.New().String(),
	}

	logger.Info("Node Wrapper service initialized", nodeID)
	return svc
}

// RegisterApplication registers a new application on this node
func (nws *NodeWrapperService) RegisterApplication(deployment *types.Deployment) (*ApplicationInstance, error) {
	nws.applicationsMutex.Lock()
	defer nws.applicationsMutex.Unlock()

	appID := uuid.New().String()
	now := time.Now().Unix() * 1000

	instance := &ApplicationInstance{
		ID:           appID,
		DeploymentID: deployment.ID,
		Name:         deployment.Name,
		Status:       "pending",
		Manifest: DeploymentManifest{
			Runtime:    deployment.Runtime,
			Entrypoint: deployment.Entrypoint,
			EnvVars:    make(map[string]string),
		},
		Ports:     []PortMapping{},
		CreatedAt: now,
		UpdatedAt: now,
		Metrics: ApplicationMetrics{
			HealthStatus:    "unknown",
			LastHealthCheck: now,
		},
		Logs: ApplicationLogs{},
	}

	// Convert environment variables
	for _, ev := range deployment.EnvVars {
		instance.Manifest.EnvVars[ev.Key] = ev.Value
	}

	// Set resource limits
	instance.Manifest.Resources = ResourceLimits{
		MemoryLimitMB:  deployment.Resources.MemoryLimitMb,
		CPULimit:       deployment.Resources.CPULimit,
		StorageLimitMB: deployment.Resources.StorageLimitMb,
	}

	// Set health check config
	if deployment.HealthCheck != nil {
		instance.Manifest.HealthCheck = HealthCheckConfig{
			Path:     deployment.HealthCheck.Path,
			Interval: deployment.HealthCheck.Interval,
			Timeout:  deployment.HealthCheck.Timeout,
			Retries:  deployment.HealthCheck.Retries,
		}
	}

	// Set port mapping
	if deployment.Port != nil {
		instance.Ports = append(instance.Ports, PortMapping{
			ContainerPort: *deployment.Port,
			HostPort:      *deployment.Port,
			Protocol:      "tcp",
		})
	}

	nws.applications[appID] = instance
	logger.Info("Application registered", appID, deployment.Name)
	return instance, nil
}

// GetApplication retrieves an application instance by ID
func (nws *NodeWrapperService) GetApplication(appID string) (*ApplicationInstance, error) {
	nws.applicationsMutex.RLock()
	defer nws.applicationsMutex.RUnlock()

	app, exists := nws.applications[appID]
	if !exists {
		return nil, logger.ErrorWithMessage("Application not found", appID)
	}

	return app, nil
}

// ListApplications returns all applications on this node
func (nws *NodeWrapperService) ListApplications() []*ApplicationInstance {
	nws.applicationsMutex.RLock()
	defer nws.applicationsMutex.RUnlock()

	apps := make([]*ApplicationInstance, 0, len(nws.applications))
	for _, app := range nws.applications {
		apps = append(apps, app)
	}

	return apps
}

// UpdateApplicationStatus updates the status of an application
func (nws *NodeWrapperService) UpdateApplicationStatus(appID string, status string) error {
	nws.applicationsMutex.Lock()
	defer nws.applicationsMutex.Unlock()

	app, exists := nws.applications[appID]
	if !exists {
		return logger.ErrorWithMessage("Application not found", appID)
	}

	app.Status = status
	app.UpdatedAt = time.Now().Unix() * 1000

	return nil
}

// RemoveApplication removes an application from the node
func (nws *NodeWrapperService) RemoveApplication(appID string) error {
	nws.applicationsMutex.Lock()
	defer nws.applicationsMutex.Unlock()

	_, exists := nws.applications[appID]
	if !exists {
		return logger.ErrorWithMessage("Application not found", appID)
	}

	// TODO: Clean up container, logs, and resources
	delete(nws.applications, appID)
	logger.Info("Application removed", appID)

	return nil
}

// GetNodeHealth returns the current node health status
func (nws *NodeWrapperService) GetNodeHealth() *NodeHealthStatus {
	nws.healthStatusMutex.RLock()
	defer nws.healthStatusMutex.RUnlock()

	if nws.healthStatus == nil {
		nws.healthStatus = &NodeHealthStatus{
			Timestamp:     time.Now().Unix(),
			UptimeSeconds: time.Now().Unix() - nws.startTime/1000,
		}
	}

	return nws.healthStatus
}

// UpdateNodeHealth updates the node health status
func (nws *NodeWrapperService) UpdateNodeHealth(health *NodeHealthStatus) {
	nws.healthStatusMutex.Lock()
	defer nws.healthStatusMutex.Unlock()

	nws.healthStatus = health
}

// StoreCredential stores an encrypted credential
func (nws *NodeWrapperService) StoreCredential(provider string, credential interface{}) error {
	nws.credentialMutex.Lock()
	defer nws.credentialMutex.Unlock()

	// Convert credential to JSON for encryption
	credJSON, err := json.Marshal(credential)
	if err != nil {
		return logger.ErrorWithMessage("Failed to marshal credential", err.Error())
	}

	// Encrypt the credential
	encrypted, err := nws.encryptCredential(credJSON)
	if err != nil {
		return logger.ErrorWithMessage("Failed to encrypt credential", err.Error())
	}

	nws.credentialStore[provider] = encrypted
	logger.Info("Credential stored and encrypted", provider)

	return nil
}

// GetCredential retrieves a decrypted credential
func (nws *NodeWrapperService) GetCredential(provider string) (interface{}, error) {
	nws.credentialMutex.RLock()
	defer nws.credentialMutex.RUnlock()

	encrypted, exists := nws.credentialStore[provider]
	if !exists {
		return nil, logger.ErrorWithMessage("Credential not found", provider)
	}

	// Decrypt the credential
	encryptedStr, ok := encrypted.(string)
	if !ok {
		return nil, logger.ErrorWithMessage("Invalid credential format", provider)
	}

	decrypted, err := nws.decryptCredential(encryptedStr)
	if err != nil {
		return nil, logger.ErrorWithMessage("Failed to decrypt credential", err.Error())
	}

	// Parse back to interface{}
	var cred interface{}
	if err := json.Unmarshal(decrypted, &cred); err != nil {
		return nil, logger.ErrorWithMessage("Failed to unmarshal credential", err.Error())
	}

	return cred, nil
}

// encryptCredential encrypts data using AES-256-GCM
func (nws *NodeWrapperService) encryptCredential(plaintext []byte) (string, error) {
	// Derive key from master key using SHA-256
	key := sha256.Sum256([]byte(nws.masterKey))

	// Create cipher block
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", err
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// Generate nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	// Encrypt and append nonce
	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)

	// Encode to base64 for storage
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// decryptCredential decrypts data using AES-256-GCM
func (nws *NodeWrapperService) decryptCredential(encryptedStr string) ([]byte, error) {
	// Decode from base64
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedStr)
	if err != nil {
		return nil, err
	}

	// Derive key from master key using SHA-256
	key := sha256.Sum256([]byte(nws.masterKey))

	// Create cipher block
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return nil, err
	}

	// Create GCM mode
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	// Extract nonce
	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

	// Decrypt
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	return plaintext, nil
}

// GetNodeID returns the node's unique identifier
func (nws *NodeWrapperService) GetNodeID() string {
	return nws.nodeID
}

// Start starts the node wrapper service
func (nws *NodeWrapperService) Start() error {
	logger.Info("Starting Node Wrapper service", nws.nodeID)

	// Start health check and metrics collection loop
	if nws.dockerClient != nil {
		nws.startHealthCheckLoop()
	}

	// TODO: Start heartbeat mechanism
	// TODO: Start credential rotation

	return nil
}

// Stop gracefully shuts down the node wrapper service
func (nws *NodeWrapperService) Stop() error {
	logger.Info("Stopping Node Wrapper service", nws.nodeID)

	nws.cancel()

	// TODO: Stop all running containers
	// TODO: Save state to controller
	// TODO: Close connections

	return nil
}

// ==================== Container Orchestration ====================

// StartContainer creates and starts a Docker container for an application
func (nws *NodeWrapperService) StartContainer(appID string) error {
	if nws.dockerClient == nil {
		return fmt.Errorf("Docker client not initialized")
	}

	app, err := nws.GetApplication(appID)
	if err != nil {
		return err
	}

	// Pull image if needed
	imageName := nws.getImageName(app.Manifest.Runtime)
	logger.Info("Pulling Docker image", imageName)
	
	reader, err := nws.dockerClient.ImagePull(nws.ctx, imageName, image.PullOptions{})
	if err != nil {
		return fmt.Errorf("failed to pull image: %w", err)
	}
	defer reader.Close()
	
	// Wait for pull to complete
	io.Copy(io.Discard, reader)

	// Prepare container config
	exposedPorts, _ := nws.buildExposedPorts(app.Ports)
	containerConfig := &container.Config{
		Image: imageName,
		Env:   nws.buildEnvVars(app.Manifest.EnvVars),
		ExposedPorts: exposedPorts,
	}

	if app.Manifest.Entrypoint != "" {
		containerConfig.Cmd = []string{"/bin/sh", "-c", app.Manifest.Entrypoint}
	}

	// Prepare host config with resource limits
	portBindings, _ := nws.buildPortBindings(app.Ports)
	hostConfig := &container.HostConfig{
		Resources: container.Resources{
			Memory:   int64(app.Manifest.Resources.MemoryLimitMB) * 1024 * 1024,
			NanoCPUs: int64(app.Manifest.Resources.CPULimit * 1e9),
		},
		PortBindings: portBindings,
		RestartPolicy: container.RestartPolicy{
			Name: "unless-stopped",
		},
	}

	// Create container
	resp, err := nws.dockerClient.ContainerCreate(
		nws.ctx,
		containerConfig,
		hostConfig,
		nil,
		nil,
		fmt.Sprintf("automator67-%s", appID),
	)
	if err != nil {
		return fmt.Errorf("failed to create container: %w", err)
	}

	// Start container
	if err := nws.dockerClient.ContainerStart(nws.ctx, resp.ID, container.StartOptions{}); err != nil {
		return fmt.Errorf("failed to start container: %w", err)
	}

	// Update application with container info
	nws.applicationsMutex.Lock()
	app.Container.ID = resp.ID
	app.Container.CreatedAt = time.Now().Unix()
	app.Container.StartedAt = time.Now().Unix()
	app.Status = "running"
	app.UpdatedAt = time.Now().Unix()
	nws.applicationsMutex.Unlock()

	logger.Info("Container started", resp.ID, appID)
	return nil
}

// StopContainer stops a running Docker container
func (nws *NodeWrapperService) StopContainer(appID string) error {
	if nws.dockerClient == nil {
		return fmt.Errorf("Docker client not initialized")
	}

	app, err := nws.GetApplication(appID)
	if err != nil {
		return err
	}

	if app.Container.ID == "" {
		return fmt.Errorf("no container associated with application")
	}

	// Stop container with 10 second timeout
	timeout := 10
	if err := nws.dockerClient.ContainerStop(nws.ctx, app.Container.ID, container.StopOptions{Timeout: &timeout}); err != nil {
		return fmt.Errorf("failed to stop container: %w", err)
	}

	// Update application status
	nws.applicationsMutex.Lock()
	app.Container.StoppedAt = time.Now().Unix()
	app.Status = "stopped"
	app.UpdatedAt = time.Now().Unix()
	nws.applicationsMutex.Unlock()

	logger.Info("Container stopped", app.Container.ID, appID)
	return nil
}

// RestartContainer restarts a Docker container
func (nws *NodeWrapperService) RestartContainer(appID string) error {
	if nws.dockerClient == nil {
		return fmt.Errorf("Docker client not initialized")
	}

	app, err := nws.GetApplication(appID)
	if err != nil {
		return err
	}

	if app.Container.ID == "" {
		return fmt.Errorf("no container associated with application")
	}

	// Restart container with 10 second timeout
	timeout := 10
	if err := nws.dockerClient.ContainerRestart(nws.ctx, app.Container.ID, container.StopOptions{Timeout: &timeout}); err != nil {
		return fmt.Errorf("failed to restart container: %w", err)
	}

	// Update application status
	nws.applicationsMutex.Lock()
	app.Container.StartedAt = time.Now().Unix()
	app.Status = "running"
	app.UpdatedAt = time.Now().Unix()
	nws.applicationsMutex.Unlock()

	logger.Info("Container restarted", app.Container.ID, appID)
	return nil
}

// GetContainerLogs retrieves logs from a Docker container
func (nws *NodeWrapperService) GetContainerLogs(appID string, tail int) (string, error) {
	if nws.dockerClient == nil {
		return "", fmt.Errorf("Docker client not initialized")
	}

	app, err := nws.GetApplication(appID)
	if err != nil {
		return "", err
	}

	if app.Container.ID == "" {
		return "", fmt.Errorf("no container associated with application")
	}

	// Get container logs
	options := container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Tail:       fmt.Sprintf("%d", tail),
	}

	reader, err := nws.dockerClient.ContainerLogs(nws.ctx, app.Container.ID, options)
	if err != nil {
		return "", fmt.Errorf("failed to get container logs: %w", err)
	}
	defer reader.Close()

	// Read logs
	logBytes, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("failed to read logs: %w", err)
	}

	return string(logBytes), nil
}

// RemoveContainer removes a Docker container
func (nws *NodeWrapperService) RemoveContainer(appID string) error {
	if nws.dockerClient == nil {
		return fmt.Errorf("Docker client not initialized")
	}

	app, err := nws.GetApplication(appID)
	if err != nil {
		return err
	}

	if app.Container.ID == "" {
		return nil // No container to remove
	}

	// Stop container first if running
	if app.Status == "running" {
		if err := nws.StopContainer(appID); err != nil {
			logger.Warn("Failed to stop container before removal", err.Error())
		}
	}

	// Remove container
	if err := nws.dockerClient.ContainerRemove(nws.ctx, app.Container.ID, container.RemoveOptions{Force: true}); err != nil {
		return fmt.Errorf("failed to remove container: %w", err)
	}

	logger.Info("Container removed", app.Container.ID, appID)
	return nil
}

// ==================== Helper Functions ====================

// getImageName returns the Docker image name for a runtime
func (nws *NodeWrapperService) getImageName(runtime string) string {
	imageMap := map[string]string{
		"nodejs":  "node:18-alpine",
		"python":  "python:3.11-slim",
		"go":      "golang:1.21-alpine",
		"ruby":    "ruby:3.2-alpine",
		"php":     "php:8.2-fpm-alpine",
		"java":    "openjdk:17-alpine",
		"rust":    "rust:1.75-alpine",
		"deno":    "denoland/deno:alpine",
	}

	if img, ok := imageMap[runtime]; ok {
		return img
	}
	return "alpine:latest" // Default fallback
}

// buildEnvVars converts map to Docker env var format
func (nws *NodeWrapperService) buildEnvVars(envVars map[string]string) []string {
	result := make([]string, 0, len(envVars))
	for key, value := range envVars {
		result = append(result, fmt.Sprintf("%s=%s", key, value))
	}
	return result
}

// buildExposedPorts creates exposed ports configuration
func (nws *NodeWrapperService) buildExposedPorts(ports []PortMapping) (nat.PortSet, error) {
	exposed := make(nat.PortSet)
	for _, port := range ports {
		protocol := port.Protocol
		if protocol == "" {
			protocol = "tcp"
		}
		natPort, err := nat.NewPort(protocol, fmt.Sprintf("%d", port.ContainerPort))
		if err != nil {
			return nil, err
		}
		exposed[natPort] = struct{}{}
	}
	return exposed, nil
}

// buildPortBindings creates port bindings configuration
func (nws *NodeWrapperService) buildPortBindings(ports []PortMapping) (nat.PortMap, error) {
	bindings := make(nat.PortMap)
	for _, port := range ports {
		protocol := port.Protocol
		if protocol == "" {
			protocol = "tcp"
		}
		natPort, err := nat.NewPort(protocol, fmt.Sprintf("%d", port.ContainerPort))
		if err != nil {
			return nil, err
		}
		bindings[natPort] = []nat.PortBinding{
			{
				HostIP:   "0.0.0.0",
				HostPort: fmt.Sprintf("%d", port.HostPort),
			},
		}
	}
	return bindings, nil
}

// ==================== Health Check & Metrics Collection ====================

// startHealthCheckLoop starts periodic health checks and metrics collection
func (nws *NodeWrapperService) startHealthCheckLoop() {
	ticker := time.NewTicker(30 * time.Second) // Check every 30 seconds
	
	go func() {
		defer ticker.Stop()
		
		for {
			select {
			case <-ticker.C:
				nws.collectMetrics()
				nws.performHealthChecks()
			case <-nws.ctx.Done():
				logger.Info("Health check loop stopped", nws.nodeID)
				return
			}
		}
	}()
	
	logger.Info("Health check loop started", nws.nodeID)
}

// collectMetrics collects system and container metrics
func (nws *NodeWrapperService) collectMetrics() {
	nws.applicationsMutex.RLock()
	defer nws.applicationsMutex.RUnlock()
	
	// Collect metrics for each running application
	for appID, app := range nws.applications {
		if app.Status == "running" && app.Container.ID != "" {
			metrics, err := nws.getContainerMetrics(app.Container.ID)
			if err != nil {
				logger.Error("Failed to collect metrics", appID, err)
				continue
			}
			
			// Update application metrics
			app.Metrics = metrics
			app.UpdatedAt = time.Now().Unix()
		}
	}
	
	// Update node health status
	nodeHealth := nws.collectNodeHealth()
	nws.UpdateNodeHealth(nodeHealth)
}

// getContainerMetrics retrieves metrics for a specific container
func (nws *NodeWrapperService) getContainerMetrics(containerID string) (ApplicationMetrics, error) {
	if nws.dockerClient == nil {
		return ApplicationMetrics{}, fmt.Errorf("docker client not available")
	}
	
	// Get container stats
	stats, err := nws.dockerClient.ContainerStats(nws.ctx, containerID, false)
	if err != nil {
		return ApplicationMetrics{}, fmt.Errorf("failed to get container stats: %w", err)
	}
	defer stats.Body.Close()
	
	// Parse stats
	var containerStats container.StatsResponse
	if err := json.NewDecoder(stats.Body).Decode(&containerStats); err != nil {
		return ApplicationMetrics{}, fmt.Errorf("failed to parse stats: %w", err)
	}
	
	// Calculate CPU usage percentage
	cpuDelta := float64(containerStats.CPUStats.CPUUsage.TotalUsage - containerStats.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(containerStats.CPUStats.SystemUsage - containerStats.PreCPUStats.SystemUsage)
	cpuPercent := 0.0
	if systemDelta > 0 && cpuDelta > 0 {
		cpuPercent = (cpuDelta / systemDelta) * float64(len(containerStats.CPUStats.CPUUsage.PercpuUsage)) * 100.0
	}
	
	// Calculate memory usage
	memoryUsageMB := float64(containerStats.MemoryStats.Usage) / 1024 / 1024
	memoryLimitMB := float64(containerStats.MemoryStats.Limit) / 1024 / 1024
	memoryPercent := 0.0
	if memoryLimitMB > 0 {
		memoryPercent = (memoryUsageMB / memoryLimitMB) * 100.0
	}
	
	// Network stats
	var networkRxBytes, networkTxBytes uint64
	for _, network := range containerStats.Networks {
		networkRxBytes += network.RxBytes
		networkTxBytes += network.TxBytes
	}
	
	return ApplicationMetrics{
		CPUPercent:    cpuPercent,
		MemoryUsageMB: memoryUsageMB,
		MemoryPercent: memoryPercent,
		NetworkRxMB:   float64(networkRxBytes) / 1024 / 1024,
		NetworkTxMB:   float64(networkTxBytes) / 1024 / 1024,
		Timestamp:     time.Now().Unix(),
	}, nil
}

// collectNodeHealth collects overall node health metrics
func (nws *NodeWrapperService) collectNodeHealth() *NodeHealthStatus {
	// Get system info
	info, err := nws.dockerClient.Info(nws.ctx)
	if err != nil {
		logger.Error("Failed to get Docker info", err)
		return &NodeHealthStatus{
			Timestamp:     time.Now().Unix(),
			UptimeSeconds: time.Now().Unix() - nws.startTime,
		}
	}
	
	// Calculate system metrics
	totalMemoryMB := float64(info.MemTotal) / 1024 / 1024
	// Use a simple estimation for available memory
	usedMemoryMB := totalMemoryMB * 0.5 // TODO: Implement accurate memory monitoring
	memoryPercent := (usedMemoryMB / totalMemoryMB) * 100.0
	
	// Count running containers
	runningContainers := 0
	nws.applicationsMutex.RLock()
	for _, app := range nws.applications {
		if app.Status == "running" {
			runningContainers++
		}
	}
	nws.applicationsMutex.RUnlock()
	
	return &NodeHealthStatus{
		Timestamp:     time.Now().Unix(),
		UptimeSeconds: time.Now().Unix() - nws.startTime,
		SystemHealth: SystemHealthInfo{
			CPUPercent:    0.0, // TODO: Implement system CPU monitoring
			MemoryPercent: memoryPercent,
			DiskPercent:   0.0, // TODO: Implement disk monitoring
			TotalMemoryMB: totalMemoryMB,
			UsedMemoryMB:  usedMemoryMB,
		},
		ContainerStats: ContainerStats{
			Running: runningContainers,
			Stopped: len(nws.applications) - runningContainers,
			Failed:  0, // TODO: Track failed containers
		},
		NetworkStats: NetworkStats{
			InboundBytes:      0,
			OutboundBytes:     0,
			ActiveConnections: 0,
		},
		Errors: ErrorStats{
			ErrorCount:    0, // TODO: Track errors
			LastError:     "",
			LastErrorTime: 0,
		},
	}
}

// performHealthChecks performs health checks on running applications
func (nws *NodeWrapperService) performHealthChecks() {
	nws.applicationsMutex.Lock()
	defer nws.applicationsMutex.Unlock()
	
	for appID, app := range nws.applications {
		if app.Status == "running" && app.Container.ID != "" {
			// Check if container is still running
			inspect, err := nws.dockerClient.ContainerInspect(nws.ctx, app.Container.ID)
			if err != nil {
				logger.Error("Failed to inspect container", appID, err)
				app.Status = "failing"
				app.ErrorMessage = fmt.Sprintf("Failed to inspect container: %v", err)
				continue
			}
			
			// Update status based on container state
			if !inspect.State.Running {
				if inspect.State.ExitCode != 0 {
					app.Status = "failed"
					app.ErrorMessage = fmt.Sprintf("Container exited with code %d", inspect.State.ExitCode)
					logger.Warn("Container failed", appID, app.ErrorMessage)
				} else {
					app.Status = "stopped"
					logger.Info("Container stopped", appID)
				}
			}
		}
	}
}

// Global node wrapper instance
var nodeWrapperSvc *NodeWrapperService

// InitNodeWrapperService initializes the node wrapper service
func InitNodeWrapperService(nodeID string) {
	nodeWrapperSvc = NewNodeWrapperService(nodeID)
}

// GetNodeWrapperService returns the node wrapper service instance
func GetNodeWrapperService() *NodeWrapperService {
	if nodeWrapperSvc == nil {
		nodeWrapperSvc = NewNodeWrapperService("")
	}
	return nodeWrapperSvc
}
