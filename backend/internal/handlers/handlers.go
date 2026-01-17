package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"automator67/internal/logger"
	"automator67/internal/services"
	"automator67/internal/types"
	"github.com/gin-gonic/gin"
)

var (
	nodeReg = services.GetNodeRegistry()
	depMgr  = services.GetDeploymentManager()
)

// getAuthSvc returns the auth service instance
func getAuthSvc() *services.AuthService {
	return services.GetAuthService()
}

// HealthHandler returns health status
func HealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now(),
		"version":   "1.0.0",
		"uptime":    time.Since(startTime).Seconds(),
	})
}

var startTime = time.Now()

// GetNodes returns all nodes for the authenticated user
func GetNodes(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001" // For development
	}

	nodes, err := nodeReg.GetUserNodes(userID)
	if err != nil {
		logger.Error("Failed to get nodes", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve nodes"})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Data:      nodes,
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// CreateNode creates a new node
func CreateNode(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001" // For development
	}

	var req struct {
		Provider     types.CloudProvider `json:"provider" binding:"required"`
		Endpoint     string              `json:"endpoint" binding:"required,url"`
		Region       string              `json:"region" binding:"required"`
		Credentials  types.NodeCredentials `json:"credentials" binding:"required"`
		Capabilities types.NodeCapabilities `json:"capabilities" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	node, err := nodeReg.RegisterNode(
		userID,
		req.Provider,
		req.Endpoint,
		req.Region,
		req.Capabilities,
		req.Credentials,
	)
	if err != nil {
		logger.Error("Failed to register node", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register node"})
		return
	}

	c.JSON(http.StatusCreated, types.APIResponse{
		Data:      node,
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// GetNode retrieves a specific node
func GetNode(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	nodeID := c.Param("nodeId")
	node, err := nodeReg.GetNode(nodeID)
	if err != nil {
		logger.Error("Failed to get node", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve node"})
		return
	}

	if node == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Node not found"})
		return
	}

	if node.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Data:      node,
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// DeleteNode deletes a node
func DeleteNode(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	nodeID := c.Param("nodeId")
	node, err := nodeReg.GetNode(nodeID)
	if err != nil {
		logger.Error("Failed to get node", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve node"})
		return
	}

	if node == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Node not found"})
		return
	}

	if node.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	success, err := nodeReg.RemoveNode(nodeID)
	if err != nil || !success {
		logger.Error("Failed to remove node", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove node"})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Data:      gin.H{"id": nodeID, "removed": true},
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// GetNodeStats returns node statistics
func GetNodeStats(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	stats, err := nodeReg.GetNodeStats(userID)
	if err != nil {
		logger.Error("Failed to get node stats", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve stats"})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Data:      stats,
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// GetDeployments returns all deployments for the authenticated user
func GetDeployments(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	deployments, err := depMgr.GetUserDeployments(userID)
	if err != nil {
		logger.Error("Failed to get deployments", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve deployments"})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Data:      deployments,
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// CreateDeployment creates a new deployment
func CreateDeployment(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	var req struct {
		Name          string                `json:"name" binding:"required"`
		AppType       string                `json:"appType" binding:"required"`
		Runtime       string                `json:"runtime" binding:"required"`
		SourceURL     string                `json:"sourceUrl" binding:"required,url"`
		Entrypoint    string                `json:"entrypoint" binding:"required"`
		Instances     int                   `json:"instances" binding:"required,min=1"`
		TargetNodeIDs []string              `json:"targetNodeIds" binding:"required,min=1"`
		Resources     types.Resources       `json:"resources" binding:"required"`
		EnvVars       []types.EnvVar        `json:"envVars"`
		HealthCheck   *types.HealthCheck    `json:"healthCheck"`
		Port          *int                  `json:"port"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	deployment, err := depMgr.CreateDeployment(
		userID,
		req.Name,
		req.AppType,
		req.Runtime,
		req.SourceURL,
		req.Entrypoint,
		req.Instances,
		req.TargetNodeIDs,
		req.Resources,
		req.EnvVars,
		req.HealthCheck,
		req.Port,
	)
	if err != nil {
		logger.Error("Failed to create deployment", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create deployment"})
		return
	}

	c.JSON(http.StatusCreated, types.APIResponse{
		Data:      deployment,
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// GetDeployment retrieves a specific deployment
func GetDeployment(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	deploymentID := c.Param("deploymentId")
	deployment, err := depMgr.GetDeployment(deploymentID)
	if err != nil {
		logger.Error("Failed to get deployment", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve deployment"})
		return
	}

	if deployment == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Deployment not found"})
		return
	}

	if deployment.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Data:      deployment,
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// DeleteDeployment deletes a deployment
func DeleteDeployment(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	deploymentID := c.Param("deploymentId")
	deployment, err := depMgr.GetDeployment(deploymentID)
	if err != nil {
		logger.Error("Failed to get deployment", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve deployment"})
		return
	}

	if deployment == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Deployment not found"})
		return
	}

	if deployment.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	success, err := depMgr.DeleteDeployment(deploymentID)
	if err != nil || !success {
		logger.Error("Failed to delete deployment", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete deployment"})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Data:      gin.H{"id": deploymentID, "deleted": true},
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// GetDeploymentStats returns deployment statistics
func GetDeploymentStats(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	stats, err := depMgr.GetDeploymentStats(userID)
	if err != nil {
		logger.Error("Failed to get deployment stats", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve stats"})
		return
	}

	c.JSON(http.StatusOK, types.APIResponse{
		Data:      stats,
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// ==================== Authentication Endpoints ====================

// SignupRequest represents a signup request
type SignupRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// SignupHandler creates a new user account
func SignupHandler(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	user, err := getAuthSvc().CreateUser(req.Email, req.Password)
	if err != nil {
		logger.Warn("Signup failed", req.Email, err.Error())
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	// Generate token
	token, err := getAuthSvc().GenerateToken(user.ID)
	if err != nil {
		logger.Error("Failed to generate token", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"user": user,
		"token": token,
	})
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginHandler authenticates a user and returns a token
func LoginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	user, err := getAuthSvc().AuthenticateUser(req.Email, req.Password)
	if err != nil {
		logger.Warn("Login failed", req.Email, err.Error())
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Generate token
	token, err := getAuthSvc().GenerateToken(user.ID)
	if err != nil {
		logger.Error("Failed to generate token", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
		"token": token,
	})
}

// MeHandler returns current user info
func MeHandler(c *gin.Context) {
	userID := c.GetString("userId")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	user, err := getAuthSvc().GetUser(userID)
	if err != nil {
		logger.Error("Failed to get user", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// ==================== GitHub OAuth ====================

// GitHubCallbackRequest represents the request from GitHub OAuth redirect
type GitHubCallbackRequest struct {
	Code  string `form:"code"`
	State string `form:"state"`
	Error string `form:"error"`
}

// GitHubTokenResponse represents the response from GitHub token endpoint
type GitHubTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	Scope       string `json:"scope"`
	Error       string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

// GitHubUserResponse represents user info from GitHub API
type GitHubUserResponse struct {
	ID    int    `json:"id"`
	Login string `json:"login"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

// GitHubCallbackHandler handles OAuth callback from GitHub
func GitHubCallbackHandler(c *gin.Context) {
	var req GitHubCallbackRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		logger.Warn("Invalid callback request", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid callback request"})
		return
	}

	// Check for OAuth errors
	if req.Error != "" {
		logger.Warn("GitHub OAuth error", fmt.Sprintf("%s: %s", req.Error, req.State))
		c.JSON(http.StatusBadRequest, gin.H{"error": req.Error})
		return
	}

	// Validate authorization code
	if req.Code == "" {
		logger.Warn("Missing authorization code")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing authorization code"})
		return
	}

	// Exchange code for token
	accessToken, err := exchangeCodeForToken(req.Code)
	if err != nil {
		logger.Error("Failed to exchange code for token", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to authenticate with GitHub"})
		return
	}

	// Get user info from GitHub
	user, err := getGitHubUserInfo(accessToken)
	if err != nil {
		logger.Error("Failed to get GitHub user info", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info from GitHub"})
		return
	}

	// Generate email from GitHub username if email is not provided
	email := user.Email
	if email == "" {
		email = fmt.Sprintf("%s@github.local", user.Login)
	}

	// Create or get user
	authSvc := getAuthSvc()
	userRecord, err := authSvc.GetUserByEmail(email)
	if err != nil {
		// User doesn't exist, create one
		userRecord, err = authSvc.CreateUser(email, "")
		if err != nil {
			logger.Error("Failed to create user from GitHub OAuth", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
		logger.Info("User created from GitHub OAuth", email)
	}

	// Generate JWT token
	token, err := authSvc.GenerateToken(userRecord.ID)
	if err != nil {
		logger.Error("Failed to generate token", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	logger.Info("User authenticated via GitHub OAuth", email)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    userRecord.ID,
			"email": userRecord.Email,
		},
	})
}

// exchangeCodeForToken exchanges GitHub authorization code for access token
func exchangeCodeForToken(code string) (string, error) {
	clientID := os.Getenv("GITHUB_CLIENT_ID")
	clientSecret := os.Getenv("GITHUB_CLIENT_SECRET")

	if clientID == "" || clientSecret == "" {
		return "", fmt.Errorf("missing GitHub OAuth credentials")
	}

	// Exchange code for token
	reqBody := fmt.Sprintf(
		"client_id=%s&client_secret=%s&code=%s",
		clientID, clientSecret, code,
	)

	req, err := http.NewRequest("POST", "https://github.com/login/oauth/access_token", strings.NewReader(reqBody))
	if err != nil {
		return "", fmt.Errorf("failed to create token request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	var tokenResp GitHubTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", fmt.Errorf("failed to parse token response: %w", err)
	}

	if tokenResp.Error != "" {
		return "", fmt.Errorf("GitHub OAuth error: %s", tokenResp.ErrorDescription)
	}

	if tokenResp.AccessToken == "" {
		return "", fmt.Errorf("no access token in response")
	}

	return tokenResp.AccessToken, nil
}

// getGitHubUserInfo fetches user info from GitHub API
func getGitHubUserInfo(accessToken string) (*GitHubUserResponse, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create user info request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	// If we get 404, try to get primary email
	if resp.StatusCode == http.StatusNotFound {
		// Try to get email from separate endpoint
		emailResp, err := getGitHubUserEmail(accessToken)
		if err != nil {
			return nil, err
		}
		return emailResp, nil
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("unexpected status code: %d, body: %s", resp.StatusCode, string(body))
	}

	var user GitHubUserResponse
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("failed to parse user response: %w", err)
	}

	return &user, nil
}

// getGitHubUserEmail fetches primary email from GitHub API
func getGitHubUserEmail(accessToken string) (*GitHubUserResponse, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/user/emails", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create email request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get user emails: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get emails: status %d", resp.StatusCode)
	}

	var emails []struct {
		Email   string `json:"email"`
		Primary bool   `json:"primary"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&emails); err != nil {
		return nil, fmt.Errorf("failed to parse emails: %w", err)
	}

	// Find primary email
	for _, e := range emails {
		if e.Primary {
			return &GitHubUserResponse{Email: e.Email}, nil
		}
	}

	// Fallback to first email
	if len(emails) > 0 {
		return &GitHubUserResponse{Email: emails[0].Email}, nil
	}

	return nil, fmt.Errorf("no email found")
}

// ==================== Middleware ====================

// AuthMiddleware validates JWT token and extracts user info
func AuthMiddleware(c *gin.Context) {
	// Get token from Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		// For development, allow requests without auth token with a valid test UUID
		c.Set("userId", "00000000-0000-0000-0000-000000000001") // Valid UUID for testing
		c.Next()
		return
	}

	// Extract bearer token
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
		c.Abort()
		return
	}

	token := parts[1]
	userID, err := getAuthSvc().VerifyToken(token)
	if err != nil {
		logger.Warn("Token verification failed", err.Error())
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		c.Abort()
		return
	}

	c.Set("userId", userID)
	c.Next()
}

// RequestIDMiddleware adds a request ID to each request
func RequestIDMiddleware(c *gin.Context) {
	// Generate a simple request ID (in production, use a UUID)
	c.Set("requestId", c.GetHeader("X-Request-ID"))
	c.Next()
}
