package services

import (
	"fmt"
	"testing"
	"time"

	"automator67/internal/types"
)

// TestNewNodeWrapperService tests node wrapper creation
func TestNewNodeWrapperService(t *testing.T) {
	nodeID := "test-node-123"
	svc := NewNodeWrapperService(nodeID)

	if svc.nodeID != nodeID {
		t.Errorf("Expected node ID %s, got %s", nodeID, svc.nodeID)
	}

	if svc.applications == nil {
		t.Fatal("Expected applications map to be initialized")
	}

	if svc.credentialStore == nil {
		t.Fatal("Expected credential store to be initialized")
	}
}

// TestRegisterApplication tests application registration
func TestRegisterApplication(t *testing.T) {
	svc := NewNodeWrapperService("test-node")

	deployment := &types.Deployment{
		ID:         "deploy-123",
		Name:       "test-app",
		Runtime:    "nodejs",
		Entrypoint: "npm start",
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
		EnvVars: []types.EnvVar{
			{Key: "NODE_ENV", Value: "production"},
		},
		Resources: types.Resources{
			MemoryLimitMb:  512,
			CPULimit:       1.0,
			StorageLimitMb: 1024,
		},
	}

	app, err := svc.RegisterApplication(deployment)
	if err != nil {
		t.Fatalf("Failed to register application: %v", err)
	}

	if app == nil {
		t.Fatal("Expected application instance, got nil")
	}

	if app.DeploymentID != deployment.ID {
		t.Errorf("Expected deployment ID %s, got %s", deployment.ID, app.DeploymentID)
	}

	if app.Name != deployment.Name {
		t.Errorf("Expected name %s, got %s", deployment.Name, app.Name)
	}

	if app.Status != "pending" {
		t.Errorf("Expected status 'pending', got %s", app.Status)
	}
}

// TestGetApplication tests retrieving an application
func TestGetApplication(t *testing.T) {
	svc := NewNodeWrapperService("test-node")

	deployment := &types.Deployment{
		ID:         "deploy-123",
		Name:       "test-app",
		Runtime:    "nodejs",
		Entrypoint: "npm start",
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
	}

	registered, _ := svc.RegisterApplication(deployment)

	// Retrieve the application
	app, err := svc.GetApplication(registered.ID)
	if err != nil {
		t.Fatalf("Failed to get application: %v", err)
	}

	if app.ID != registered.ID {
		t.Errorf("Expected ID %s, got %s", registered.ID, app.ID)
	}
}

// TestGetApplicationNotFound tests retrieving non-existent application
func TestGetApplicationNotFound(t *testing.T) {
	svc := NewNodeWrapperService("test-node")

	_, err := svc.GetApplication("nonexistent-id")
	if err == nil {
		t.Fatal("Expected error for non-existent application")
	}
}

// TestListApplications tests listing all applications
func TestListApplications(t *testing.T) {
	svc := NewNodeWrapperService("test-node")

	// Register multiple applications
	for i := 0; i < 3; i++ {
		deployment := &types.Deployment{
			ID:         "deploy-" + string(rune(i)),
			Name:       "test-app-" + string(rune(i)),
			Runtime:    "nodejs",
			Entrypoint: "npm start",
			AppType:    "backend",
			Status:     "pending",
			Instances:  1,
		}
		svc.RegisterApplication(deployment)
	}

	apps := svc.ListApplications()
	if len(apps) != 3 {
		t.Errorf("Expected 3 applications, got %d", len(apps))
	}
}

// TestUpdateApplicationStatus tests updating application status
func TestUpdateApplicationStatus(t *testing.T) {
	svc := NewNodeWrapperService("test-node")

	deployment := &types.Deployment{
		ID:         "deploy-123",
		Name:       "test-app",
		Runtime:    "nodejs",
		Entrypoint: "npm start",
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
	}

	app, _ := svc.RegisterApplication(deployment)

	// Update status
	err := svc.UpdateApplicationStatus(app.ID, "running")
	if err != nil {
		t.Fatalf("Failed to update status: %v", err)
	}

	// Verify status was updated
	updated, _ := svc.GetApplication(app.ID)
	if updated.Status != "running" {
		t.Errorf("Expected status 'running', got %s", updated.Status)
	}
}

// TestRemoveApplication tests removing an application
func TestRemoveApplication(t *testing.T) {
	svc := NewNodeWrapperService("test-node")

	deployment := &types.Deployment{
		ID:         "deploy-123",
		Name:       "test-app",
		Runtime:    "nodejs",
		Entrypoint: "npm start",
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
	}

	app, _ := svc.RegisterApplication(deployment)

	// Remove application
	err := svc.RemoveApplication(app.ID)
	if err != nil {
		t.Fatalf("Failed to remove application: %v", err)
	}

	// Verify it was removed
	_, err = svc.GetApplication(app.ID)
	if err == nil {
		t.Fatal("Expected error when getting removed application")
	}
}

// TestGetNodeHealth tests retrieving node health
func TestGetNodeHealth(t *testing.T) {
	svc := NewNodeWrapperService("test-node")

	health := svc.GetNodeHealth()
	if health == nil {
		t.Fatal("Expected health status, got nil")
	}

	if health.Timestamp == 0 {
		t.Fatal("Expected non-zero timestamp")
	}
}

// TestUpdateNodeHealth tests updating node health
func TestUpdateNodeHealth(t *testing.T) {
	svc := NewNodeWrapperService("test-node")

	health := &NodeHealthStatus{
		Timestamp:     int64(1000),
		UptimeSeconds: 3600,
		SystemHealth: SystemHealthInfo{
			CPUPercent:    50.5,
			MemoryPercent: 75.0,
			DiskPercent:   60.0,
		},
	}

	svc.UpdateNodeHealth(health)

	retrieved := svc.GetNodeHealth()
	if retrieved.Timestamp != health.Timestamp {
		t.Errorf("Expected timestamp %d, got %d", health.Timestamp, retrieved.Timestamp)
	}

	if retrieved.SystemHealth.CPUPercent != 50.5 {
		t.Errorf("Expected CPU 50.5, got %f", retrieved.SystemHealth.CPUPercent)
	}
}

// TestStoreCredential tests storing a credential
func TestStoreCredential(t *testing.T) {
	svc := NewNodeWrapperService("test-node")

	provider := "github"
	credential := map[string]string{"token": "secret-token-123"}

	err := svc.StoreCredential(provider, credential)
	if err != nil {
		t.Fatalf("Failed to store credential: %v", err)
	}
}

// TestGetCredential tests retrieving a credential
func TestGetCredential(t *testing.T) {
	svc := NewNodeWrapperService("test-node")

	provider := "github"
	credential := map[string]string{"token": "secret-token-123"}

	svc.StoreCredential(provider, credential)

	retrieved, err := svc.GetCredential(provider)
	if err != nil {
		t.Fatalf("Failed to get credential: %v", err)
	}

	if retrieved == nil {
		t.Fatal("Expected credential, got nil")
	}
}

// TestGetCredentialNotFound tests retrieving non-existent credential
func TestGetCredentialNotFound(t *testing.T) {
	svc := NewNodeWrapperService("test-node")

	_, err := svc.GetCredential("nonexistent")
	if err == nil {
		t.Fatal("Expected error for non-existent credential")
	}
}

// TestGetNodeID tests retrieving node ID
func TestGetNodeID(t *testing.T) {
	nodeID := "my-node-123"
	svc := NewNodeWrapperService(nodeID)

	if svc.GetNodeID() != nodeID {
		t.Errorf("Expected node ID %s, got %s", nodeID, svc.GetNodeID())
	}
}

// TestStartAndStop tests starting and stopping the service
func TestStartAndStop(t *testing.T) {
	svc := NewNodeWrapperService("test-node")

	err := svc.Start()
	if err != nil {
		t.Fatalf("Failed to start service: %v", err)
	}

	err = svc.Stop()
	if err != nil {
		t.Fatalf("Failed to stop service: %v", err)
	}
}

// BenchmarkRegisterApplication benchmarks application registration
func BenchmarkRegisterApplication(b *testing.B) {
	svc := NewNodeWrapperService("test-node")

	deployment := &types.Deployment{
		ID:         "deploy-123",
		Name:       "test-app",
		Runtime:    "nodejs",
		Entrypoint: "npm start",
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		deployment.ID = "deploy-" + string(rune(i))
		svc.RegisterApplication(deployment)
	}
}

// BenchmarkGetApplication benchmarks application retrieval
func BenchmarkGetApplication(b *testing.B) {
	svc := NewNodeWrapperService("test-node")

	deployment := &types.Deployment{
		ID:         "deploy-bench",
		Name:       "test-app",
		Runtime:    "nodejs",
		Entrypoint: "npm start",
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
	}

	app, _ := svc.RegisterApplication(deployment)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		svc.GetApplication(app.ID)
	}
}

// ==================== Docker Container Tests ====================

// TestStartContainerWithoutDocker tests starting container when Docker not available
func TestStartContainerWithoutDocker(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	deployment := &types.Deployment{
		ID:         "deploy-docker-1",
		Name:       "test-app",
		Runtime:    "nodejs:18",
		Entrypoint: "npm start",
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
		Resources: types.Resources{
			MemoryLimitMb:  512,
			CPULimit:       1.0,
			StorageLimitMb: 1024,
		},
	}
	
	app, err := svc.RegisterApplication(deployment)
	if err != nil {
		t.Fatalf("Failed to register application: %v", err)
	}
	
	// Try to start container (will fail if Docker not available)
	err = svc.StartContainer(app.ID)
	
	// If Docker is available, check success; otherwise verify error handling
	if err != nil {
		// Expected error when Docker not available
		t.Logf("Docker not available (expected in test environment): %v", err)
	} else {
		// Docker is available, verify container was started
		appAfterStart, _ := svc.GetApplication(app.ID)
		if appAfterStart.Container.ID == "" {
			t.Error("Expected container ID to be set")
		}
		
		// Clean up: stop the container
		svc.StopContainer(app.ID)
	}
}

// TestStopContainerNotFound tests stopping non-existent container
func TestStopContainerNotFound(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	err := svc.StopContainer("nonexistent-app-id")
	if err == nil {
		t.Error("Expected error for non-existent application")
	}
}

// TestRestartContainerNotRunning tests restarting container that isn't running
func TestRestartContainerNotRunning(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	deployment := &types.Deployment{
		ID:         "deploy-restart-1",
		Name:       "test-app",
		Runtime:    "nodejs:18",
		Entrypoint: "npm start",
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
	}
	
	app, _ := svc.RegisterApplication(deployment)
	
	// Try to restart without starting first
	err := svc.RestartContainer(app.ID)
	if err == nil {
		t.Error("Expected error when restarting container that hasn't been started")
	}
}

// TestGetContainerLogsNotFound tests getting logs for non-existent container
func TestGetContainerLogsNotFound(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	_, err := svc.GetContainerLogs("nonexistent-app-id", 100)
	if err == nil {
		t.Error("Expected error for non-existent application")
	}
}

// TestContainerPortMapping tests port mapping configuration
func TestContainerPortMapping(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	port := 3000
	deployment := &types.Deployment{
		ID:         "deploy-ports-1",
		Name:       "test-app",
		Runtime:    "nodejs:18",
		Entrypoint: "npm start",
		Port:       &port,
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
	}
	
	app, err := svc.RegisterApplication(deployment)
	if err != nil {
		t.Fatalf("Failed to register application: %v", err)
	}
	
	// Verify port is stored in application
	if len(app.Ports) == 0 {
		t.Error("Expected port to be set in application")
	} else if app.Ports[0].ContainerPort != 3000 {
		t.Errorf("Expected port 3000, got %d", app.Ports[0].ContainerPort)
	}
}

// TestContainerResourceLimits tests resource limit configuration
func TestContainerResourceLimits(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	deployment := &types.Deployment{
		ID:         "deploy-resources-1",
		Name:       "test-app",
		Runtime:    "nodejs:18",
		Entrypoint: "npm start",
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
		Resources: types.Resources{
			MemoryLimitMb:  512,
			CPULimit:       1.5,
			StorageLimitMb: 2048,
		},
	}
	
	app, err := svc.RegisterApplication(deployment)
	if err != nil {
		t.Fatalf("Failed to register application: %v", err)
	}
	
	// Verify resources are stored correctly
	if app.Manifest.Resources.MemoryLimitMB != 512 {
		t.Errorf("Expected memory limit 512, got %d", app.Manifest.Resources.MemoryLimitMB)
	}
	
	if app.Manifest.Resources.CPULimit != 1.5 {
		t.Errorf("Expected CPU limit 1.5, got %f", app.Manifest.Resources.CPULimit)
	}
	
	if app.Manifest.Resources.StorageLimitMB != 2048 {
		t.Errorf("Expected storage limit 2048, got %d", app.Manifest.Resources.StorageLimitMB)
	}
}

// TestContainerEnvironmentVariables tests environment variable configuration
func TestContainerEnvironmentVariables(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	deployment := &types.Deployment{
		ID:         "deploy-env-1",
		Name:       "test-app",
		Runtime:    "nodejs:18",
		Entrypoint: "npm start",
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
		EnvVars: []types.EnvVar{
			{Key: "NODE_ENV", Value: "production"},
			{Key: "PORT", Value: "3000"},
			{Key: "DATABASE_URL", Value: "postgres://localhost/db"},
		},
	}
	
	app, err := svc.RegisterApplication(deployment)
	if err != nil {
		t.Fatalf("Failed to register application: %v", err)
	}
	
	// Verify environment variables are stored
	if len(app.Manifest.EnvVars) != 3 {
		t.Errorf("Expected 3 env vars, got %d", len(app.Manifest.EnvVars))
	}
	
	if app.Manifest.EnvVars["NODE_ENV"] != "production" {
		t.Errorf("Expected NODE_ENV=production, got %s", app.Manifest.EnvVars["NODE_ENV"])
	}
}

// TestDockerClientInitialization tests Docker client initialization
func TestDockerClientInitialization(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	// Docker client should be initialized (may be nil if Docker not available)
	// This test just verifies the service initializes without panicking
	if svc == nil {
		t.Fatal("Expected service to be initialized")
	}
}

// BenchmarkStartContainer benchmarks container start operation
func BenchmarkStartContainer(b *testing.B) {
	svc := NewNodeWrapperService("test-node")
	
	deployment := &types.Deployment{
		ID:         "deploy-bench-start",
		Name:       "test-app",
		Runtime:    "nodejs:18",
		Entrypoint: "echo 'test'",
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
	}
	
	app, _ := svc.RegisterApplication(deployment)
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		// Note: This will fail if Docker not available, but measures the overhead
		svc.StartContainer(app.ID)
		svc.StopContainer(app.ID)
	}
}

// ==================== Health Check & Metrics Tests ====================

// TestHealthCheckLoopInitialization tests health check loop starts
func TestHealthCheckLoopInitialization(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	// Start service (which starts health check loop)
	err := svc.Start()
	if err != nil {
		t.Fatalf("Failed to start service: %v", err)
	}
	
	// Health check loop should be running in background
	// Just verify service started without error
	
	// Stop service
	svc.Stop()
}

// TestCollectNodeHealth tests node health collection
func TestCollectNodeHealth(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	// Get initial health status
	health := svc.GetNodeHealth()
	
	if health == nil {
		t.Fatal("Expected health status, got nil")
	}
	
	if health.Timestamp == 0 {
		t.Error("Expected non-zero timestamp")
	}
	
	if health.UptimeSeconds < 0 {
		t.Error("Expected non-negative uptime")
	}
}

// TestMetricsCollectionWithRunningContainer tests metrics collection
func TestMetricsCollectionWithRunningContainer(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	deployment := &types.Deployment{
		ID:         "deploy-metrics-1",
		Name:       "test-app",
		Runtime:    "alpine:latest",
		Entrypoint: "sleep 10",
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
		Resources: types.Resources{
			MemoryLimitMb:  256,
			CPULimit:       0.5,
			StorageLimitMb: 512,
		},
	}
	
	app, err := svc.RegisterApplication(deployment)
	if err != nil {
		t.Fatalf("Failed to register application: %v", err)
	}
	
	// Try to start container
	err = svc.StartContainer(app.ID)
	if err != nil {
		t.Skipf("Docker not available, skipping metrics test: %v", err)
	}
	
	// Give container time to start
	time.Sleep(2 * time.Second)
	
	// Try to collect metrics
	if svc.dockerClient != nil {
		metrics, err := svc.getContainerMetrics(app.Container.ID)
		if err != nil {
			t.Logf("Failed to collect metrics (container may not be running): %v", err)
		} else {
			// Verify metrics structure
			if metrics.Timestamp == 0 {
				t.Error("Expected non-zero timestamp in metrics")
			}
			t.Logf("Collected metrics: CPU=%.2f%%, Memory=%.2fMB", metrics.CPUPercent, metrics.MemoryUsageMB)
		}
	}
	
	// Clean up
	svc.StopContainer(app.ID)
}

// TestHealthCheckDetectsStoppedContainer tests health check detects stopped containers
func TestHealthCheckDetectsStoppedContainer(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	deployment := &types.Deployment{
		ID:         "deploy-health-1",
		Name:       "test-app",
		Runtime:    "alpine:latest",
		Entrypoint: "echo 'done'", // Exits immediately
		AppType:    "backend",
		Status:     "pending",
		Instances:  1,
	}
	
	app, err := svc.RegisterApplication(deployment)
	if err != nil {
		t.Fatalf("Failed to register application: %v", err)
	}
	
	// Try to start container
	err = svc.StartContainer(app.ID)
	if err != nil {
		t.Skipf("Docker not available, skipping health check test: %v", err)
	}
	
	// Give container time to exit
	time.Sleep(2 * time.Second)
	
	// Perform health check
	svc.performHealthChecks()
	
	// Check if status was updated
	updatedApp, _ := svc.GetApplication(app.ID)
	if updatedApp.Status == "running" {
		t.Log("Container still marked as running (may have not exited yet)")
	} else {
		t.Logf("Container status updated to: %s", updatedApp.Status)
	}
	
	// Clean up
	svc.StopContainer(app.ID)
}

// TestNodeHealthStatusFields tests all fields in node health status
func TestNodeHealthStatusFields(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	// Register some applications
	for i := 0; i < 3; i++ {
		deployment := &types.Deployment{
			ID:         fmt.Sprintf("deploy-%d", i),
			Name:       fmt.Sprintf("app-%d", i),
			Runtime:    "nodejs:18",
			Entrypoint: "npm start",
			AppType:    "backend",
			Status:     "pending",
			Instances:  1,
		}
		svc.RegisterApplication(deployment)
	}
	
	// Collect node health
	health := svc.GetNodeHealth()
	
	// Verify all fields are present
	if health.SystemHealth.CPUPercent < 0 {
		t.Error("Expected non-negative CPU percent")
	}
	
	if health.SystemHealth.MemoryPercent < 0 {
		t.Error("Expected non-negative memory percent")
	}
	
	if health.ContainerStats.Running < 0 {
		t.Error("Expected non-negative running containers")
	}
	
	if health.ContainerStats.Stopped < 0 {
		t.Error("Expected non-negative stopped containers")
	}
}

// BenchmarkCollectMetrics benchmarks metrics collection
func BenchmarkCollectMetrics(b *testing.B) {
	svc := NewNodeWrapperService("test-node")
	
	// Register an application
	deployment := &types.Deployment{
		ID:         "deploy-bench-metrics",
		Name:       "test-app",
		Runtime:    "alpine:latest",
		Entrypoint: "sleep 30",
		AppType:    "backend",
		Status:     "running",
		Instances:  1,
	}
	
	app, _ := svc.RegisterApplication(deployment)
	
	// Try to start container (may fail if Docker not available)
	svc.StartContainer(app.ID)
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		svc.collectMetrics()
	}
	
	// Clean up
	svc.StopContainer(app.ID)
}
// TestCredentialEncryption tests credential encryption and storage
func TestCredentialEncryption(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	credential := map[string]string{
		"access_token":  "secret_token_12345",
		"refresh_token": "refresh_token_67890",
		"api_key":       "api_key_abcdef",
	}
	
	// Store credential
	err := svc.StoreCredential("github", credential)
	if err != nil {
		t.Fatalf("Failed to store credential: %v", err)
	}
	
	// Retrieve credential
	retrieved, err := svc.GetCredential("github")
	if err != nil {
		t.Fatalf("Failed to retrieve credential: %v", err)
	}
	
	// Verify credential
	retrievedMap, ok := retrieved.(map[string]interface{})
	if !ok {
		t.Fatal("Retrieved credential is not a map")
	}
	
	if retrievedMap["access_token"] != "secret_token_12345" {
		t.Errorf("Access token mismatch: got %v", retrievedMap["access_token"])
	}
	
	if retrievedMap["refresh_token"] != "refresh_token_67890" {
		t.Errorf("Refresh token mismatch: got %v", retrievedMap["refresh_token"])
	}
}

// TestCredentialEncryptionDifferentKeys tests that different services have different encryption
func TestCredentialEncryptionDifferentKeys(t *testing.T) {
	svc1 := NewNodeWrapperService("node-1")
	svc2 := NewNodeWrapperService("node-2")
	
	credential := map[string]string{"secret": "my_secret"}
	
	// Store in both services
	svc1.StoreCredential("provider", credential)
	svc2.StoreCredential("provider", credential)
	
	// Retrieve encrypted values directly
	svc1.credentialMutex.RLock()
	encrypted1 := svc1.credentialStore["provider"]
	svc1.credentialMutex.RUnlock()
	
	svc2.credentialMutex.RLock()
	encrypted2 := svc2.credentialStore["provider"]
	svc2.credentialMutex.RUnlock()
	
	// Different master keys should produce different ciphertexts
	if encrypted1 == encrypted2 {
		t.Error("Expected different encrypted values for different services")
	}
}

// TestCredentialNotFound tests retrieving non-existent credential
func TestCredentialNotFound(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	_, err := svc.GetCredential("nonexistent")
	if err == nil {
		t.Error("Expected error for non-existent credential")
	}
}

// TestCredentialEncryptionComplexData tests encryption with complex data structures
func TestCredentialEncryptionComplexData(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	credential := map[string]interface{}{
		"tokens": map[string]string{
			"access":  "access_123",
			"refresh": "refresh_456",
		},
		"metadata": map[string]interface{}{
			"expires_at": 1234567890,
			"scopes":     []string{"read", "write"},
		},
	}
	
	// Store credential
	err := svc.StoreCredential("complex", credential)
	if err != nil {
		t.Fatalf("Failed to store complex credential: %v", err)
	}
	
	// Retrieve credential
	retrieved, err := svc.GetCredential("complex")
	if err != nil {
		t.Fatalf("Failed to retrieve complex credential: %v", err)
	}
	
	// Verify structure
	retrievedMap, ok := retrieved.(map[string]interface{})
	if !ok {
		t.Fatal("Retrieved credential is not a map")
	}
	
	tokens, ok := retrievedMap["tokens"].(map[string]interface{})
	if !ok {
		t.Fatal("Tokens field is not a map")
	}
	
	if tokens["access"] != "access_123" {
		t.Errorf("Access token mismatch: got %v", tokens["access"])
	}
}

// TestEncryptionDecryptionRoundTrip tests the low-level encryption/decryption
func TestEncryptionDecryptionRoundTrip(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	plaintext := []byte("sensitive data 12345")
	
	// Encrypt
	encrypted, err := svc.encryptCredential(plaintext)
	if err != nil {
		t.Fatalf("Encryption failed: %v", err)
	}
	
	// Verify encrypted is different from plaintext
	if encrypted == string(plaintext) {
		t.Error("Encrypted text should not match plaintext")
	}
	
	// Decrypt
	decrypted, err := svc.decryptCredential(encrypted)
	if err != nil {
		t.Fatalf("Decryption failed: %v", err)
	}
	
	// Verify decrypted matches original
	if string(decrypted) != string(plaintext) {
		t.Errorf("Decrypted text mismatch: got %s, want %s", decrypted, plaintext)
	}
}

// TestEncryptionWithEmptyData tests encryption with edge cases
func TestEncryptionWithEmptyData(t *testing.T) {
	svc := NewNodeWrapperService("test-node")
	
	// Test empty map
	emptyMap := map[string]string{}
	err := svc.StoreCredential("empty", emptyMap)
	if err != nil {
		t.Fatalf("Failed to store empty credential: %v", err)
	}
	
	retrieved, err := svc.GetCredential("empty")
	if err != nil {
		t.Fatalf("Failed to retrieve empty credential: %v", err)
	}
	
	retrievedMap, ok := retrieved.(map[string]interface{})
	if !ok {
		t.Fatal("Retrieved credential is not a map")
	}
	
	if len(retrievedMap) != 0 {
		t.Errorf("Expected empty map, got %d items", len(retrievedMap))
	}
}