package services

import (
	"testing"
	"time"

	"automator67/internal/types"
)

// TestNewHeartbeatService tests heartbeat service creation
func TestNewHeartbeatService(t *testing.T) {
	registry := NewNodeRegistry()
	config := DefaultHeartbeatConfig()

	service := NewHeartbeatService("test-node", registry, config)

	if service == nil {
		t.Fatal("Expected non-nil heartbeat service")
	}

	if service.nodeID != "test-node" {
		t.Errorf("Expected nodeID 'test-node', got %s", service.nodeID)
	}

	if service.running {
		t.Error("Expected service to not be running initially")
	}
}

// TestDefaultHeartbeatConfig tests default configuration
func TestDefaultHeartbeatConfig(t *testing.T) {
	config := DefaultHeartbeatConfig()

	if config.Interval != 30*time.Second {
		t.Errorf("Expected 30s interval, got %v", config.Interval)
	}

	if config.Timeout != 90*time.Second {
		t.Errorf("Expected 90s timeout, got %v", config.Timeout)
	}

	if config.RetryAttempts != 3 {
		t.Errorf("Expected 3 retry attempts, got %d", config.RetryAttempts)
	}

	if config.RetryDelay != 5*time.Second {
		t.Errorf("Expected 5s retry delay, got %v", config.RetryDelay)
	}
}

// TestHeartbeatServiceStartStop tests starting and stopping
func TestHeartbeatServiceStartStop(t *testing.T) {
	setupTestDB(t)

	// Create test user first
	authSvc := NewAuthService("test-secret")
	testUser, err := authSvc.CreateUser("heartbeat-test@example.com", "testpass123")
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	registry := NewNodeRegistry()
	config := DefaultHeartbeatConfig()
	config.Interval = 100 * time.Millisecond // Faster for testing

	// Register node first and get the generated node ID
	node, err := registry.RegisterNode(
		testUser.ID,
		"render",
		"https://test-node-heartbeat.onrender.com",
		"us-west",
		types.NodeCapabilities{},
		types.NodeCredentials{},
	)
	if err != nil {
		t.Fatalf("Failed to register node: %v", err)
	}

	// Create heartbeat service with the actual node ID
	service := NewHeartbeatService(node.ID, registry, config)

	// Start service
	err = service.Start()
	if err != nil {
		t.Fatalf("Failed to start heartbeat service: %v", err)
	}

	if !service.IsRunning() {
		t.Error("Expected service to be running")
	}

	// Wait for at least one heartbeat
	time.Sleep(150 * time.Millisecond)

	// Verify node status was updated
	nodeUpdated, err := registry.GetNode(node.ID)
	if err != nil {
		t.Fatalf("Failed to get node: %v", err)
	}

	if nodeUpdated.Status != "online" {
		t.Errorf("Expected node status 'online', got '%s'", nodeUpdated.Status)
	}

	// Stop service
	err = service.Stop()
	if err != nil {
		t.Fatalf("Failed to stop heartbeat service: %v", err)
	}

	if service.IsRunning() {
		t.Error("Expected service to not be running after stop")
	}
}

// TestHeartbeatServiceDoubleStart tests that double start returns error
func TestHeartbeatServiceDoubleStart(t *testing.T) {
	registry := NewNodeRegistry()
	config := DefaultHeartbeatConfig()

	service := NewHeartbeatService("test-node", registry, config)

	err := service.Start()
	if err != nil {
		t.Fatalf("First start failed: %v", err)
	}

	err = service.Start()
	if err == nil {
		t.Error("Expected error on double start")
	}

	service.Stop()
}

// TestHeartbeatServicePeriodicUpdates tests that heartbeats continue periodically
func TestHeartbeatServicePeriodicUpdates(t *testing.T) {
	setupTestDB(t)

	// Create test user first
	authSvc := NewAuthService("test-secret")
	testUser, err := authSvc.CreateUser("periodic-test@example.com", "testpass123")
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	registry := NewNodeRegistry()
	config := DefaultHeartbeatConfig()
	config.Interval = 50 * time.Millisecond // Very fast for testing

	// Register node and get the actual node ID
	node, err := registry.RegisterNode(
		testUser.ID,
		"render",
		"https://test-node-periodic.onrender.com",
		"us-west",
		types.NodeCapabilities{},
		types.NodeCredentials{},
	)
	if err != nil {
		t.Fatalf("Failed to register node: %v", err)
	}

	// Create service with the actual node ID
	service := NewHeartbeatService(node.ID, registry, config)

	// Start service
	service.Start()
	defer service.Stop()

	// Get initial heartbeat time
	time.Sleep(60 * time.Millisecond)
	node1, _ := registry.GetNode(node.ID)
	firstHeartbeat := node1.LastHeartbeat

	// Wait for another heartbeat
	time.Sleep(100 * time.Millisecond)
	node2, _ := registry.GetNode(node.ID)
	secondHeartbeat := node2.LastHeartbeat

	// Second heartbeat should be after first
	if secondHeartbeat <= firstHeartbeat {
		t.Error("Expected heartbeat timestamp to be updated")
	}
}

// TestHeartbeatServiceGetters tests getter methods
func TestHeartbeatServiceGetters(t *testing.T) {
	registry := NewNodeRegistry()
	config := DefaultHeartbeatConfig()

	service := NewHeartbeatService("test-node-123", registry, config)

	if service.GetNodeID() != "test-node-123" {
		t.Errorf("Expected nodeID 'test-node-123', got %s", service.GetNodeID())
	}

	if service.IsRunning() {
		t.Error("Expected IsRunning to be false initially")
	}

	service.Start()
	if !service.IsRunning() {
		t.Error("Expected IsRunning to be true after start")
	}

	service.Stop()
	if service.IsRunning() {
		t.Error("Expected IsRunning to be false after stop")
	}
}

// TestHeartbeatServiceCustomConfig tests with custom configuration
func TestHeartbeatServiceCustomConfig(t *testing.T) {
	registry := NewNodeRegistry()
	config := HeartbeatConfig{
		Interval:      200 * time.Millisecond,
		Timeout:       600 * time.Millisecond,
		RetryAttempts: 5,
		RetryDelay:    10 * time.Millisecond,
	}

	service := NewHeartbeatService("test-node", registry, config)

	if service.config.Interval != 200*time.Millisecond {
		t.Errorf("Expected 200ms interval, got %v", service.config.Interval)
	}

	if service.config.RetryAttempts != 5 {
		t.Errorf("Expected 5 retry attempts, got %d", service.config.RetryAttempts)
	}
}

// BenchmarkHeartbeatSend benchmarks single heartbeat send
func BenchmarkHeartbeatSend(b *testing.B) {
	setupTestDB(&testing.T{})

	registry := NewNodeRegistry()
	config := DefaultHeartbeatConfig()
	service := NewHeartbeatService("bench-node", registry, config)

	registry.RegisterNode(
		"00000000-0000-0000-0000-000000000001",
		"render",
		"https://bench-node.onrender.com",
		"us-west",
		types.NodeCapabilities{},
		types.NodeCredentials{},
	)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		service.sendHeartbeatAttempt()
	}
}
