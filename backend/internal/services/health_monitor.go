package services

import (
	"sync"
	"time"

	"automator67/internal/logger"
	"automator67/internal/types"
)

// HealthCheckResult represents the result of a health check
type HealthCheckResult struct {
	NodeID          string  `json:"nodeId"`
	Status          types.NodeStatus `json:"status"`
	CPUPercent      float64 `json:"cpuPercent"`
	MemoryPercent   float64 `json:"memoryPercent"`
	DiskPercent     float64 `json:"diskPercent"`
	Uptime          int64   `json:"uptime"`
	ResponseTime    int64   `json:"responseTime"` // milliseconds
}

// HealthMonitor performs periodic health checks on nodes
type HealthMonitor struct {
	mu              sync.RWMutex
	checkInterval   time.Duration
	timeout         time.Duration
	isRunning       bool
	stopCh          chan struct{}
	lastChecks      map[string]*HealthCheckResult
	nodeRegistry    *NodeRegistry
}

// NewHealthMonitor creates a new health monitor
func NewHealthMonitor(registry *NodeRegistry) *HealthMonitor {
	return &HealthMonitor{
		checkInterval: 30 * time.Second,
		timeout:       5 * time.Second,
		stopCh:        make(chan struct{}),
		lastChecks:    make(map[string]*HealthCheckResult),
		nodeRegistry:  registry,
	}
}

// Start begins health monitoring
func (hm *HealthMonitor) Start() error {
	hm.mu.Lock()
	if hm.isRunning {
		hm.mu.Unlock()
		return nil
	}
	hm.isRunning = true
	hm.mu.Unlock()

	logger.Info("Health monitor starting")

	go hm.monitorLoop()
	return nil
}

// Stop stops health monitoring
func (hm *HealthMonitor) Stop() error {
	hm.mu.Lock()
	if !hm.isRunning {
		hm.mu.Unlock()
		return nil
	}
	hm.isRunning = false
	hm.mu.Unlock()

	logger.Info("Health monitor stopping")
	close(hm.stopCh)
	return nil
}

// monitorLoop runs the periodic health check loop
func (hm *HealthMonitor) monitorLoop() {
	ticker := time.NewTicker(hm.checkInterval)
	defer ticker.Stop()

	// Initial check
	hm.performHealthCheck()

	for {
		select {
		case <-ticker.C:
			hm.performHealthCheck()
		case <-hm.stopCh:
			return
		}
	}
}

// performHealthCheck runs health checks on all nodes
func (hm *HealthMonitor) performHealthCheck() {
	logger.Debug("Performing health checks")
	// In production, this would iterate through all nodes and call their health endpoints
	// For now, we have a placeholder
}

// GetNodeHealthHistory returns the last health check for a node
func (hm *HealthMonitor) GetNodeHealthHistory(nodeID string) *HealthCheckResult {
	hm.mu.RLock()
	defer hm.mu.RUnlock()

	return hm.lastChecks[nodeID]
}

// CheckNode manually triggers a health check for a node
func (hm *HealthMonitor) CheckNode(nodeID string) (*HealthCheckResult, error) {
	node, err := hm.nodeRegistry.GetNode(nodeID)
	if err != nil {
		return nil, err
	}
	if node == nil {
		logger.Warn("Node not found", nodeID)
		return nil, nil
	}

	// TODO: Make actual HTTP request to node wrapper
	result := &HealthCheckResult{
		NodeID:        nodeID,
		Status:        types.NodeStatusReady,
		CPUPercent:    0,
		MemoryPercent: 0,
		DiskPercent:   0,
		Uptime:        0,
		ResponseTime:  0,
	}

	hm.mu.Lock()
	hm.lastChecks[nodeID] = result
	hm.mu.Unlock()

	return result, nil
}

// GetHealthStats returns health monitoring statistics
func (hm *HealthMonitor) GetHealthStats() map[string]interface{} {
	hm.mu.RLock()
	defer hm.mu.RUnlock()

	totalChecks := len(hm.lastChecks)
	avgResponseTime := int64(0)

	if totalChecks > 0 {
		totalTime := int64(0)
		for _, check := range hm.lastChecks {
			totalTime += check.ResponseTime
		}
		avgResponseTime = totalTime / int64(totalChecks)
	}

	return map[string]interface{}{
		"totalChecks":      totalChecks,
		"avgResponseTime":  avgResponseTime,
		"successRate":      1.0,
	}
}

// Global health monitor instance
var healthMonitor *HealthMonitor

// InitHealthMonitor initializes the global health monitor
func InitHealthMonitor(registry *NodeRegistry) {
	healthMonitor = NewHealthMonitor(registry)
}

// GetHealthMonitor returns the global health monitor
func GetHealthMonitor() *HealthMonitor {
	return healthMonitor
}
