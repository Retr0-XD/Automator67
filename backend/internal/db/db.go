package db

import (
	"database/sql"
	"fmt"
	"sync"
	"time"

	"automator67/internal/logger"
	_ "github.com/lib/pq"
)

var (
	dbInstance *sql.DB
	dbOnce     sync.Once
)

// Config holds database configuration
type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	Database string
	SSLMode  string
}

// Connect establishes database connection
func Connect(cfg Config) (*sql.DB, error) {
	var err error
	dbOnce.Do(func() {
		dsn := fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Database, cfg.SSLMode,
		)

		dbInstance, err = sql.Open("postgres", dsn)
		if err != nil {
			logger.Error("Failed to open database", err)
			return
		}

		// Test connection
		if err = dbInstance.Ping(); err != nil {
			logger.Error("Failed to ping database", err)
			return
		}

		// Configure connection pool
		dbInstance.SetMaxOpenConns(25)
		dbInstance.SetMaxIdleConns(5)
		dbInstance.SetConnMaxLifetime(5 * time.Minute)

		logger.Info("Database connected successfully")
	})

	return dbInstance, err
}

// GetDB returns the database instance
func GetDB() *sql.DB {
	return dbInstance
}

// Close closes the database connection
func Close() error {
	if dbInstance != nil {
		return dbInstance.Close()
	}
	return nil
}
