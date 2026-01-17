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

// DeploymentManager manages application deployments with PostgreSQL persistence
type DeploymentManager struct {
	dbConn *sql.DB
}

// NewDeploymentManager creates a new deployment manager
func NewDeploymentManager() *DeploymentManager {
	return &DeploymentManager{
		dbConn: db.GetDB(),
	}
}

// CreateDeployment creates a new deployment
func (dm *DeploymentManager) CreateDeployment(
	userID string,
	name string,
	appType string,
	runtime string,
	sourceURL string,
	entrypoint string,
	instances int,
	targetNodeIDs []string,
	resources types.Resources,
	envVars []types.EnvVar,
	healthCheck *types.HealthCheck,
	port *int,
) (*types.Deployment, error) {
	deploymentID := uuid.New().String()
	now := time.Now().Unix() * 1000 // milliseconds

	nodeIDsJSON, _ := json.Marshal(targetNodeIDs)
	envVarsJSON, _ := json.Marshal(envVars)
	resourcesJSON, _ := json.Marshal(resources)
	healthCheckJSON, _ := json.Marshal(healthCheck)

	query := `
		INSERT INTO deployments 
		(id, user_id, name, app_type, runtime, status, source_url, entrypoint, port, instances, target_node_ids, resources, env_vars, health_check, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING id, user_id, name, app_type, runtime, status, source_url, entrypoint, port, instances, target_node_ids, resources, env_vars, health_check, created_at, updated_at
	`

	deployment := &types.Deployment{}
	err := dm.dbConn.QueryRow(
		query,
		deploymentID, userID, name, appType, runtime, string(types.DeploymentStatusPending),
		sourceURL, entrypoint, port, instances, nodeIDsJSON, resourcesJSON, envVarsJSON, healthCheckJSON, now, now,
	).Scan(
		&deployment.ID, &deployment.UserID, &deployment.Name, &deployment.AppType, &deployment.Runtime, &deployment.Status,
		&deployment.SourceURL, &deployment.Entrypoint, &deployment.Port, &deployment.Instances,
		&nodeIDsJSON, &resourcesJSON, &envVarsJSON, &healthCheckJSON, &deployment.CreatedAt, &deployment.UpdatedAt,
	)

	if err != nil {
		logger.Error("Failed to create deployment", err)
		return nil, err
	}

	json.Unmarshal(nodeIDsJSON, &deployment.TargetNodeIDs)
	json.Unmarshal(envVarsJSON, &deployment.EnvVars)
	json.Unmarshal(resourcesJSON, &deployment.Resources)
	json.Unmarshal(healthCheckJSON, &deployment.HealthCheck)

	logger.Info("Deployment created", deploymentID, userID, name)
	return deployment, nil
}

// GetDeployment retrieves a deployment by ID
func (dm *DeploymentManager) GetDeployment(deploymentID string) (*types.Deployment, error) {
	query := `
		SELECT id, user_id, name, app_type, runtime, status, source_url, entrypoint, port, instances, target_node_ids, resources, env_vars, health_check, created_at, updated_at
		FROM deployments WHERE id = $1
	`

	deployment := &types.Deployment{}
	var nodeIDsJSON, resourcesJSON, envVarsJSON, healthCheckJSON []byte

	err := dm.dbConn.QueryRow(query, deploymentID).Scan(
		&deployment.ID, &deployment.UserID, &deployment.Name, &deployment.AppType, &deployment.Runtime, &deployment.Status,
		&deployment.SourceURL, &deployment.Entrypoint, &deployment.Port, &deployment.Instances,
		&nodeIDsJSON, &resourcesJSON, &envVarsJSON, &healthCheckJSON, &deployment.CreatedAt, &deployment.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		logger.Error("Failed to get deployment", err)
		return nil, err
	}

	json.Unmarshal(nodeIDsJSON, &deployment.TargetNodeIDs)
	json.Unmarshal(envVarsJSON, &deployment.EnvVars)
	json.Unmarshal(resourcesJSON, &deployment.Resources)
	json.Unmarshal(healthCheckJSON, &deployment.HealthCheck)

	return deployment, nil
}

// GetUserDeployments retrieves all deployments for a user
func (dm *DeploymentManager) GetUserDeployments(userID string) ([]*types.Deployment, error) {
	query := `
		SELECT id, user_id, name, app_type, runtime, status, source_url, entrypoint, port, instances, target_node_ids, resources, env_vars, health_check, created_at, updated_at
		FROM deployments WHERE user_id = $1 ORDER BY created_at DESC
	`

	rows, err := dm.dbConn.Query(query, userID)
	if err != nil {
		logger.Error("Failed to get user deployments", err)
		return nil, err
	}
	defer rows.Close()

	var deployments []*types.Deployment
	for rows.Next() {
		deployment := &types.Deployment{}
		var nodeIDsJSON, resourcesJSON, envVarsJSON, healthCheckJSON []byte

		if err := rows.Scan(
			&deployment.ID, &deployment.UserID, &deployment.Name, &deployment.AppType, &deployment.Runtime, &deployment.Status,
			&deployment.SourceURL, &deployment.Entrypoint, &deployment.Port, &deployment.Instances,
			&nodeIDsJSON, &resourcesJSON, &envVarsJSON, &healthCheckJSON, &deployment.CreatedAt, &deployment.UpdatedAt,
		); err != nil {
			logger.Error("Failed to scan deployment row", err)
			continue
		}

		json.Unmarshal(nodeIDsJSON, &deployment.TargetNodeIDs)
		json.Unmarshal(envVarsJSON, &deployment.EnvVars)
		json.Unmarshal(resourcesJSON, &deployment.Resources)
		json.Unmarshal(healthCheckJSON, &deployment.HealthCheck)

		deployments = append(deployments, deployment)
	}

	return deployments, nil
}

// GetDeploymentsByStatus retrieves deployments by status for a user
func (dm *DeploymentManager) GetDeploymentsByStatus(userID string, status types.DeploymentStatus) ([]*types.Deployment, error) {
	query := `
		SELECT id, user_id, name, app_type, runtime, status, source_url, entrypoint, port, instances, target_node_ids, resources, env_vars, health_check, created_at, updated_at
		FROM deployments WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC
	`

	rows, err := dm.dbConn.Query(query, userID, string(status))
	if err != nil {
		logger.Error("Failed to get deployments by status", err)
		return nil, err
	}
	defer rows.Close()

	var deployments []*types.Deployment
	for rows.Next() {
		deployment := &types.Deployment{}
		var nodeIDsJSON, resourcesJSON, envVarsJSON, healthCheckJSON []byte

		if err := rows.Scan(
			&deployment.ID, &deployment.UserID, &deployment.Name, &deployment.AppType, &deployment.Runtime, &deployment.Status,
			&deployment.SourceURL, &deployment.Entrypoint, &deployment.Port, &deployment.Instances,
			&nodeIDsJSON, &resourcesJSON, &envVarsJSON, &healthCheckJSON, &deployment.CreatedAt, &deployment.UpdatedAt,
		); err != nil {
			logger.Error("Failed to scan deployment row", err)
			continue
		}

		json.Unmarshal(nodeIDsJSON, &deployment.TargetNodeIDs)
		json.Unmarshal(envVarsJSON, &deployment.EnvVars)
		json.Unmarshal(resourcesJSON, &deployment.Resources)
		json.Unmarshal(healthCheckJSON, &deployment.HealthCheck)

		deployments = append(deployments, deployment)
	}

	return deployments, nil
}

// UpdateDeploymentStatus updates a deployment's status
func (dm *DeploymentManager) UpdateDeploymentStatus(deploymentID string, status types.DeploymentStatus) (*types.Deployment, error) {
	query := `UPDATE deployments SET status = $1, updated_at = $2 WHERE id = $3`
	now := time.Now().Unix() * 1000

	_, err := dm.dbConn.Exec(query, string(status), now, deploymentID)
	if err != nil {
		logger.Error("Failed to update deployment status", err)
		return nil, err
	}

	logger.Info("Deployment status updated", deploymentID, string(status))
	return dm.GetDeployment(deploymentID)
}

// ScaleDeployment scales a deployment to a new instance count
func (dm *DeploymentManager) ScaleDeployment(deploymentID string, instances int) (*types.Deployment, error) {
	query := `UPDATE deployments SET instances = $1, updated_at = $2 WHERE id = $3`
	now := time.Now().Unix() * 1000

	_, err := dm.dbConn.Exec(query, instances, now, deploymentID)
	if err != nil {
		logger.Error("Failed to scale deployment", err)
		return nil, err
	}

	logger.Info("Deployment scaled", deploymentID, instances)
	return dm.GetDeployment(deploymentID)
}

// UpdateEnvironmentVars updates a deployment's environment variables
func (dm *DeploymentManager) UpdateEnvironmentVars(deploymentID string, envVars []types.EnvVar) (*types.Deployment, error) {
	envVarsJSON, _ := json.Marshal(envVars)
	query := `UPDATE deployments SET env_vars = $1, updated_at = $2 WHERE id = $3`
	now := time.Now().Unix() * 1000

	_, err := dm.dbConn.Exec(query, envVarsJSON, now, deploymentID)
	if err != nil {
		logger.Error("Failed to update environment vars", err)
		return nil, err
	}

	logger.Info("Deployment environment updated", deploymentID, len(envVars))
	return dm.GetDeployment(deploymentID)
}

// AddTargetNode adds a target node to a deployment
func (dm *DeploymentManager) AddTargetNode(deploymentID string, nodeID string) (*types.Deployment, error) {
	deployment, err := dm.GetDeployment(deploymentID)
	if err != nil {
		return nil, err
	}
	if deployment == nil {
		return nil, nil
	}

	// Check if already exists
	for _, id := range deployment.TargetNodeIDs {
		if id == nodeID {
			return deployment, nil
		}
	}

	deployment.TargetNodeIDs = append(deployment.TargetNodeIDs, nodeID)
	nodeIDsJSON, _ := json.Marshal(deployment.TargetNodeIDs)
	query := `UPDATE deployments SET target_node_ids = $1, updated_at = $2 WHERE id = $3`
	now := time.Now().Unix() * 1000

	_, err = dm.dbConn.Exec(query, nodeIDsJSON, now, deploymentID)
	if err != nil {
		logger.Error("Failed to add target node", err)
		return nil, err
	}

	logger.Info("Node added to deployment", deploymentID, nodeID)
	return dm.GetDeployment(deploymentID)
}

// RemoveTargetNode removes a target node from a deployment
func (dm *DeploymentManager) RemoveTargetNode(deploymentID string, nodeID string) (*types.Deployment, error) {
	deployment, err := dm.GetDeployment(deploymentID)
	if err != nil {
		return nil, err
	}
	if deployment == nil {
		return nil, nil
	}

	for i, id := range deployment.TargetNodeIDs {
		if id == nodeID {
			deployment.TargetNodeIDs = append(deployment.TargetNodeIDs[:i], deployment.TargetNodeIDs[i+1:]...)
			break
		}
	}

	nodeIDsJSON, _ := json.Marshal(deployment.TargetNodeIDs)
	query := `UPDATE deployments SET target_node_ids = $1, updated_at = $2 WHERE id = $3`
	now := time.Now().Unix() * 1000

	_, err = dm.dbConn.Exec(query, nodeIDsJSON, now, deploymentID)
	if err != nil {
		logger.Error("Failed to remove target node", err)
		return nil, err
	}

	logger.Info("Node removed from deployment", deploymentID, nodeID)
	return dm.GetDeployment(deploymentID)
}

// DeleteDeployment deletes a deployment
func (dm *DeploymentManager) DeleteDeployment(deploymentID string) (bool, error) {
	query := `DELETE FROM deployments WHERE id = $1`

	result, err := dm.dbConn.Exec(query, deploymentID)
	if err != nil {
		logger.Error("Failed to delete deployment", err)
		return false, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}

	if rowsAffected == 0 {
		logger.Warn("Deployment not found", deploymentID)
		return false, nil
	}

	logger.Info("Deployment deleted", deploymentID)
	return true, nil
}

// GetDeploymentStats returns statistics about user's deployments
func (dm *DeploymentManager) GetDeploymentStats(userID string) (map[string]interface{}, error) {
	deployments, err := dm.GetUserDeployments(userID)
	if err != nil {
		return nil, err
	}

	byStatus := make(map[string]int)
	totalInstances := 0
	targetNodesSet := make(map[string]bool)

	for _, deployment := range deployments {
		byStatus[string(deployment.Status)]++
		totalInstances += deployment.Instances
		for _, nodeID := range deployment.TargetNodeIDs {
			targetNodesSet[nodeID] = true
		}
	}

	return map[string]interface{}{
		"total":             len(deployments),
		"byStatus":          byStatus,
		"totalInstances":    totalInstances,
		"totalTargetNodes":  len(targetNodesSet),
	}, nil
}

// Global deployment manager instance
var depManager = NewDeploymentManager()

func GetDeploymentManager() *DeploymentManager {
	return depManager
}
