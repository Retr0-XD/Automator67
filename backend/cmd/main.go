package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"automator67/internal/db"
	"automator67/internal/handlers"
	"automator67/internal/logger"
	"automator67/internal/services"
	"github.com/gin-gonic/gin"
)

func main() {
	log := logger.New("controller")

	// Initialize database
	dbCfg := db.Config{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     5432,
		User:     getEnv("DB_USER", "automator"),
		Password: getEnv("DB_PASSWORD", "devpassword123"),
		Database: getEnv("DB_NAME", "automator67"),
		SSLMode:  "disable",
	}

	dbConn, err := db.Connect(dbCfg)
	if err != nil {
		log.Error("Failed to connect to database", err)
		os.Exit(1)
	}
	defer dbConn.Close()
	log.Info("Database connected successfully")

	// Initialize services
	services.InitAuthService("your-secret-jwt-key-change-in-production")
	nodeReg := services.GetNodeRegistry()
	services.InitHealthMonitor(nodeReg)
	healthMonitor := services.GetHealthMonitor()

	// Start health monitor
	if err := healthMonitor.Start(); err != nil {
		log.Error("Failed to start health monitor", err)
	}

	// Create Gin router
	router := gin.Default()

	// Middleware
	router.Use(requestIDMiddleware())

	// Health check endpoint (public)
	router.GET("/health", handlers.HealthHandler)

	// Authentication routes (public)
	auth := router.Group("/api/v1/auth")
	{
		auth.POST("/signup", handlers.SignupHandler)
		auth.POST("/login", handlers.LoginHandler)
		auth.GET("/github/callback", handlers.GitHubCallbackHandler)
	}

	// API routes (with auth middleware)
	api := router.Group("/api/v1")
	api.Use(handlers.AuthMiddleware)
	{
		// User routes
		api.GET("/me", handlers.MeHandler)

		// Node routes
		api.GET("/nodes", handlers.GetNodes)
		api.POST("/nodes", handlers.CreateNode)
		api.GET("/nodes/:nodeId", handlers.GetNode)
		api.DELETE("/nodes/:nodeId", handlers.DeleteNode)
		api.GET("/nodes/stats", handlers.GetNodeStats)

		// Deployment routes
		api.GET("/deployments", handlers.GetDeployments)
		api.POST("/deployments", handlers.CreateDeployment)
		api.GET("/deployments/:deploymentId", handlers.GetDeployment)
		api.DELETE("/deployments/:deploymentId", handlers.DeleteDeployment)
		api.GET("/deployments/stats", handlers.GetDeploymentStats)
	}

	// 404 handler
	router.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"error":      "Not Found",
			"message":    fmt.Sprintf("Route %s %s not found", c.Request.Method, c.Request.URL.Path),
			"statusCode": http.StatusNotFound,
			"timestamp":  time.Now(),
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	// Create server
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Info("Controller service running on port", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("Server error", err)
		}
	}()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	<-sigChan
	log.Info("Shutting down gracefully")

	// Stop health monitor
	if err := healthMonitor.Stop(); err != nil {
		log.Error("Failed to stop health monitor", err)
	}

	// Shutdown server with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error("Server shutdown error", err)
	}

	log.Info("Server closed")
}

// requestIDMiddleware adds a request ID to each request
func requestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetString("X-Request-ID")
		if requestID == "" {
			// Generate a simple request ID
			requestID = fmt.Sprintf("%d", time.Now().UnixNano())
		}
		c.Set("requestId", requestID)
		c.Header("X-Request-ID", requestID)
		c.Next()
	}
}

// getEnv gets environment variable or returns default
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
