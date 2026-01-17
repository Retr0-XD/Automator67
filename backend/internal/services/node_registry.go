package services

import (
	"database/sql"
	"encoding/json"
	"time"

	"automator67/internal/db"
	"automator67/internal/logger"
	"automator67/internal/types"
	"github.com/google/uuid"
)

// NodeRegistry manages node registration and status tracking with PostgreSQL persistence
type NodeRegistry struct {
	dbConn *sql.DB
}

// NewNodeRegistry creates a new node registry
func NewNodeRegistry() *NodeRegistry {
	return &NodeRegistry{
		dbConn: db.GetDB(),
	}
}

// RegisterNode registers a new node
func (nr *NodeRegistry) RegisterNode(
	userID string,
	provider types.CloudProvider,
	endpoint string,
	region string,
	capabilities types.NodeCapabilities,
	credentials types.NodeCredentials,
) (*types.Node, error) {
	nodeID := uuid.New().String()
	now := time.Now() // Use time.Time for PostgreSQL TIMESTAMP

	capJSON, _ := json.Marshal(capabilities)
	credJSON, _ := json.Marshal(credentials)
	healthJSON, _ := json.Marshal(types.NodeHealth{
		CPUPercent:    0,
		MemoryPercent: 0,
		DiskPercent:   0,
		Uptime:        0,
		LastHeartbeat: now.Unix(), // Store as seconds in JSON
	})

	query := `
		INSERT INTO nodes 
		(id, user_id, provider, endpoint, region, status, capabilities, credentials, health, created_at, last_heartbeat, last_metrics_update)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, user_id, provider, endpoint, region, status, capabilities, health, credentials, created_at, last_heartbeat, last_metrics_update
	`

	node := &types.Node{}
	err := nr.dbConn.QueryRow(
		query,
		nodeID, userID, string(provider), endpoint, region, string(types.NodeStatusInitializing),
		capJSON, credJSON, healthJSON, now, now, now,
	).Scan(
		&node.ID, &node.UserID, &node.Provider, &node.Endpoint, &node.Region, &node.Status,
		&capJSON, &healthJSON, &credJSON, &node.CreatedAt, &node.LastHeartbeat, &node.LastMetricsUpdate,
	)

	if err != nil {
		logger.Error("Failed to register node", err)
		return nil, err
	}

	json.Unmarshal(capJSON, &node.Capabilities)
	json.Unmarshal(healthJSON, &node.Health)
	json.Unmarshal(credJSON, &node.Credentials)

	logger.Info("Node registered", nodeID, userID, string(provider))
	return node, nil
}

// GetNode retrieves a node by ID
func (nr *NodeRegistry) GetNode(nodeID string) (*types.Node, error) {
	query := `
		SELECT id, user_id, provider, endpoint, region, status, capabilities, health, credentials, created_at, last_heartbeat, last_metrics_update
		FROM nodes WHERE id = $1
	`

	node := &types.Node{}
	var capJSON, healthJSON, credJSON []byte

	err := nr.dbConn.QueryRow(query, nodeID).Scan(
		&node.ID, &node.UserID, &node.Provider, &node.Endpoint, &node.Region, &node.Status,
		&capJSON, &healthJSON, &credJSON, &node.CreatedAt, &node.LastHeartbeat, &node.LastMetricsUpdate,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		logger.Error("Failed to get node", err)
		return nil, err
	}

	json.Unmarshal(capJSON, &node.Capabilities)
	json.Unmarshal(healthJSON, &node.Health)
	json.Unmarshal(credJSON, &node.Credentials)

	return node, nil
}

// GetUserNodes retrieves all nodes for a user
func (nr *NodeRegistry) GetUserNodes(userID string) ([]*types.Node, error) {
	query := `
		SELECT id, user_id, provider, endpoint, region, status, capabilities, health, credentials, created_at, last_heartbeat, last_metrics_update
		FROM nodes WHERE user_id = $1 ORDER BY created_at DESC
	`

	rows, err := nr.dbConn.Query(query, userID)
	if err != nil {
		logger.Error("Failed to get user nodes", err)
		return nil, err
	}
	defer rows.Close()

	var nodes []*types.Node
	for rows.Next() {
		node := &types.Node{}
		var capJSON, healthJSON, credJSON []byte

		if err := rows.Scan(
			&node.ID, &node.UserID, &node.Provider, &node.Endpoint, &node.Region, &node.Status,
			&capJSON, &healthJSON, &credJSON, &node.CreatedAt, &node.LastHeartbeat, &node.LastMetricsUpdate,
		); err != nil {
			logger.Error("Failed to scan node row", err)
			continue
		}

		json.Unmarshal(capJSON, &node.Capabilities)
		json.Unmarshal(healthJSON, &node.Health)
		json.Unmarshal(credJSON, &node.Credentials)

		nodes = append(nodes, node)
	}

	return nodes, nil
}

// GetNodesByProvider retrieves nodes by provider for a user
func (nr *NodeRegistry) GetNodesByProvider(userID string, provider types.CloudProvider) ([]*types.Node, error) {
	query := `
		SELECT id, user_id, provider, endpoint, region, status, capabilities, health, credentials, created_at, last_heartbeat, last_metrics_update
		FROM nodes WHERE user_id = $1 AND provider = $2 ORDER BY created_at DESC
	`

	rows, err := nr.dbConn.Query(query, userID, string(provider))
	if err != nil {
		logger.Error("Failed to get nodes by provider", err)
		return nil, err
	}
	defer rows.Close()

	var nodes []*types.Node
	for rows.Next() {
		node := &types.Node{}
		var capJSON, healthJSON, credJSON []byte

		if err := rows.Scan(
			&node.ID, &node.UserID, &node.Provider, &node.Endpoint, &node.Region, &node.Status,
			&capJSON, &healthJSON, &credJSON, &node.CreatedAt, &node.LastHeartbeat, &node.LastMetricsUpdate,
		); err != nil {
			logger.Error("Failed to scan node row", err)
			continue
		}

		json.Unmarshal(capJSON, &node.Capabilities)
		json.Unmarshal(healthJSON, &node.Health)
		json.Unmarshal(credJSON, &node.Credentials)

		nodes = append(nodes, node)
	}

	return nodes, nil
}

// GetNodesByStatus retrieves nodes by status for a user
func (nr *NodeRegistry) GetNodesByStatus(userID string, status types.NodeStatus) ([]*types.Node, error) {
	query := `
		SELECT id, user_id, provider, endpoint, region, status, capabilities, health, credentials, created_at, last_heartbeat, last_metrics_update
		FROM nodes WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC
	`

	rows, err := nr.dbConn.Query(query, userID, string(status))
	if err != nil {
		logger.Error("Failed to get nodes by status", err)
		return nil, err
	}
	defer rows.Close()

	var nodes []*types.Node
	for rows.Next() {
		node := &types.Node{}
		var capJSON, healthJSON, credJSON []byte

		if err := rows.Scan(
			&node.ID, &node.UserID, &node.Provider, &node.Endpoint, &node.Region, &node.Status,
			&capJSON, &healthJSON, &credJSON, &node.CreatedAt, &node.LastHeartbeat, &node.LastMetricsUpdate,
		); err != nil {
			logger.Error("Failed to scan node row", err)
			continue
		}

		json.Unmarshal(capJSON, &node.Capabilities)
		json.Unmarshal(healthJSON, &node.Health)
		json.Unmarshal(credJSON, &node.Credentials)

		nodes = append(nodes, node)
	}

	return nodes, nil
}

// UpdateNodeStatus updates a node's status
func (nr *NodeRegistry) UpdateNodeStatus(nodeID string, status types.NodeStatus) (*types.Node, error) {
	query := `UPDATE nodes SET status = $1, last_heartbeat = $2 WHERE id = $3`
	now := time.Now()

	_, err := nr.dbConn.Exec(query, string(status), now, nodeID)
	if err != nil {
		logger.Error("Failed to update node status", err)
		return nil, err
	}

	logger.Info("Node status updated", nodeID, string(status))
	return nr.GetNode(nodeID)
}

// UpdateNodeHealth updates a node's health metrics
func (nr *NodeRegistry) UpdateNodeHealth(nodeID string, health types.NodeHealth) (*types.Node, error) {
	healthJSON, _ := json.Marshal(health)
	query := `UPDATE nodes SET health = $1, last_metrics_update = $2 WHERE id = $3`
	now := time.Now()

	_, err := nr.dbConn.Exec(query, healthJSON, now, nodeID)
	if err != nil {
		logger.Error("Failed to update node health", err)
		return nil, err
	}

	return nr.GetNode(nodeID)
}

// RemoveNode removes a node from the registry
func (nr *NodeRegistry) RemoveNode(nodeID string) (bool, error) {
	query := `DELETE FROM nodes WHERE id = $1`

	result, err := nr.dbConn.Exec(query, nodeID)
	if err != nil {
		logger.Error("Failed to remove node", err)
		return false, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	if rowsAffected == 0 {
		logger.Warn("Node not found", nodeID)
		return false, nil
	}

	logger.Info("Node removed", nodeID)
	return true, nil
}

// GetNodeStats returns statistics about user's nodes
func (nr *NodeRegistry) GetNodeStats(userID string) (map[string]interface{}, error) {
	nodes, err := nr.GetUserNodes(userID)
	if err != nil {
		return nil, err
	}

	byProvider := make(map[string]int)
	byStatus := make(map[string]int)
	totalCPU := 0.0
	totalMemory := 0.0
	totalDisk := 0.0

	for _, node := range nodes {
		byProvider[string(node.Provider)]++
		byStatus[string(node.Status)]++
		totalCPU += node.Health.CPUPercent
		totalMemory += node.Health.MemoryPercent
		totalDisk += node.Health.DiskPercent
	}

	avgHealth := map[string]float64{
		"cpu":    0,
		"memory": 0,
		"disk":   0,
	}

	if len(nodes) > 0 {
		avgHealth["cpu"] = totalCPU / float64(len(nodes))
		avgHealth["memory"] = totalMemory / float64(len(nodes))
		avgHealth["disk"] = totalDisk / float64(len(nodes))
	}

	return map[string]interface{}{
		"total":      len(nodes),
		"byProvider": byProvider,
		"byStatus":   byStatus,
		"avgHealth":  avgHealth,
	}, nil
}

// Global registry instance
var nodeReg = NewNodeRegistry()

func GetNodeRegistry() *NodeRegistry {
	return nodeReg
}
