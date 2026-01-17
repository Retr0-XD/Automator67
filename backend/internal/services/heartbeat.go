package services

import (
	"context"
	"time"

	"automator67/internal/logger"
)

// HeartbeatConfig configures heartbeat behavior
type HeartbeatConfig struct {
	Interval       time.Duration // How often to send heartbeats
	Timeout        time.Duration // How long before considering a node dead
	RetryAttempts  int           // Number of retry attempts on failure
	RetryDelay     time.Duration // Delay between retry attempts
}

// DefaultHeartbeatConfig returns default heartbeat configuration
func DefaultHeartbeatConfig() HeartbeatConfig {
	return HeartbeatConfig{
		Interval:      30 * time.Second,
		Timeout:       90 * time.Second,
		RetryAttempts: 3,
		RetryDelay:    5 * time.Second,
	}
}

// HeartbeatService manages heartbeat communication between nodes and controller
type HeartbeatService struct {
	nodeID   string
	registry *NodeRegistry
	config   HeartbeatConfig
	ctx      context.Context
	cancel   context.CancelFunc
	running  bool
}

// NewHeartbeatService creates a new heartbeat service
func NewHeartbeatService(nodeID string, registry *NodeRegistry, config HeartbeatConfig) *HeartbeatService {
	ctx, cancel := context.WithCancel(context.Background())

	return &HeartbeatService{
		nodeID:   nodeID,
		registry: registry,
		config:   config,
		ctx:      ctx,
		cancel:   cancel,
		running:  false,
	}
}

// Start begins sending periodic heartbeats
func (hs *HeartbeatService) Start() error {
	if hs.running {
		return logger.ErrorWithMessage("Heartbeat service already running", hs.nodeID)
	}

	hs.running = true
	logger.Info("Starting heartbeat service", hs.nodeID, hs.config.Interval.String())

	go hs.heartbeatLoop()

	return nil
}

// Stop stops the heartbeat service
func (hs *HeartbeatService) Stop() error {
	if !hs.running {
		return nil
	}

	logger.Info("Stopping heartbeat service", hs.nodeID)
	hs.cancel()
	hs.running = false

	return nil
}

// heartbeatLoop sends periodic heartbeats to controller
func (hs *HeartbeatService) heartbeatLoop() {
	ticker := time.NewTicker(hs.config.Interval)
	defer ticker.Stop()

	// Send initial heartbeat immediately
	hs.sendHeartbeat()

	for {
		select {
		case <-ticker.C:
			hs.sendHeartbeat()
		case <-hs.ctx.Done():
			logger.Info("Heartbeat loop stopped", hs.nodeID)
			return
		}
	}
}

// sendHeartbeat sends a single heartbeat with retry logic
func (hs *HeartbeatService) sendHeartbeat() {
	var err error

	for attempt := 0; attempt <= hs.config.RetryAttempts; attempt++ {
		err = hs.sendHeartbeatAttempt()
		if err == nil {
			logger.Debug("Heartbeat sent successfully", hs.nodeID)
			return
		}

		if attempt < hs.config.RetryAttempts {
			logger.Warn("Heartbeat failed, retrying", hs.nodeID, err.Error(), attempt+1, hs.config.RetryAttempts)
			time.Sleep(hs.config.RetryDelay)
		}
	}

	logger.Error("Heartbeat failed after all retries", err)
}

// sendHeartbeatAttempt makes a single attempt to send heartbeat
func (hs *HeartbeatService) sendHeartbeatAttempt() error {
	// Update node's last heartbeat timestamp in registry
	_, err := hs.registry.UpdateNodeStatus(hs.nodeID, "online")
	if err != nil {
		return err
	}

	return nil
}

// IsRunning returns whether the heartbeat service is active
func (hs *HeartbeatService) IsRunning() bool {
	return hs.running
}

// GetNodeID returns the node ID
func (hs *HeartbeatService) GetNodeID() string {
	return hs.nodeID
}
