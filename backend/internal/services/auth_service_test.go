package services

import (
	"os"
	"testing"

	"automator67/internal/db"
)

// setupTestDB initializes test database connection
func setupTestDB(t *testing.T) {
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}

	cfg := db.Config{
		Host:     dbHost,
		Port:     5432,
		User:     "automator",
		Password: "devpassword123",
		Database: "automator67_test",
		SSLMode:  "disable",
	}

	_, err := db.Connect(cfg)
	if err != nil {
		t.Skipf("Skipping test: database not available - %v", err)
	}

	// Create tables if they don't exist
	createTableSQL := `
		CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(255) PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			created_at BIGINT NOT NULL,
			updated_at BIGINT NOT NULL
		);
	`

	if _, err := db.GetDB().Exec(createTableSQL); err != nil {
		t.Fatalf("Failed to create test table: %v", err)
	}

	// Clear existing data
	if _, err := db.GetDB().Exec("DELETE FROM users"); err != nil {
		t.Fatalf("Failed to clear test data: %v", err)
	}
}

// TestCreateUser tests user creation with valid credentials
func TestCreateUser(t *testing.T) {
	setupTestDB(t)

	authSvc := NewAuthService("test-secret")

	// Test: Create user successfully
	email := "testuser@example.com"
	password := "TestPassword123!"

	user, err := authSvc.CreateUser(email, password)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if user == nil {
		t.Fatal("Expected user, got nil")
	}

	if user.Email != email {
		t.Errorf("Expected email %s, got %s", email, user.Email)
	}

	if user.ID == "" {
		t.Fatal("Expected non-empty user ID")
	}

	if user.CreatedAt == 0 {
		t.Fatal("Expected non-zero CreatedAt")
	}
}

// TestCreateUserDuplicate tests that duplicate emails are rejected
func TestCreateUserDuplicate(t *testing.T) {
	setupTestDB(t)

	authSvc := NewAuthService("test-secret")

	email := "duplicate@example.com"
	password := "TestPassword123!"

	// Create first user
	_, err := authSvc.CreateUser(email, password)
	if err != nil {
		t.Fatalf("Failed to create first user: %v", err)
	}

	// Try to create duplicate
	_, err = authSvc.CreateUser(email, password)
	if err == nil {
		t.Fatal("Expected error for duplicate email, got nil")
	}

	if err.Error() != "email already registered" {
		t.Errorf("Expected 'email already registered', got %v", err)
	}
}

// TestAuthenticateUser tests successful authentication
func TestAuthenticateUser(t *testing.T) {
	setupTestDB(t)

	authSvc := NewAuthService("test-secret")

	email := "auth@example.com"
	password := "TestPassword123!"

	// Create user
	_, err := authSvc.CreateUser(email, password)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Authenticate with correct password
	user, err := authSvc.AuthenticateUser(email, password)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if user == nil {
		t.Fatal("Expected user, got nil")
	}

	if user.Email != email {
		t.Errorf("Expected email %s, got %s", email, user.Email)
	}
}

// TestAuthenticateUserWrongPassword tests authentication with wrong password
func TestAuthenticateUserWrongPassword(t *testing.T) {
	setupTestDB(t)

	authSvc := NewAuthService("test-secret")

	email := "wrongpass@example.com"
	password := "CorrectPassword123!"

	// Create user
	_, err := authSvc.CreateUser(email, password)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Try to authenticate with wrong password
	_, err = authSvc.AuthenticateUser(email, "WrongPassword456!")
	if err == nil {
		t.Fatal("Expected error for wrong password, got nil")
	}

	if err.Error() != "invalid email or password" {
		t.Errorf("Expected 'invalid email or password', got %v", err)
	}
}

// TestAuthenticateUserNotFound tests authentication with non-existent email
func TestAuthenticateUserNotFound(t *testing.T) {
	setupTestDB(t)

	authSvc := NewAuthService("test-secret")

	_, err := authSvc.AuthenticateUser("nonexistent@example.com", "password")
	if err == nil {
		t.Fatal("Expected error for non-existent user, got nil")
	}

	if err.Error() != "invalid email or password" {
		t.Errorf("Expected 'invalid email or password', got %v", err)
	}
}

// TestGetUser tests user retrieval by ID
func TestGetUser(t *testing.T) {
	setupTestDB(t)

	authSvc := NewAuthService("test-secret")

	email := "getuser@example.com"
	password := "TestPassword123!"

	// Create user
	createdUser, err := authSvc.CreateUser(email, password)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Retrieve user
	user, err := authSvc.GetUser(createdUser.ID)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if user == nil {
		t.Fatal("Expected user, got nil")
	}

	if user.ID != createdUser.ID {
		t.Errorf("Expected ID %s, got %s", createdUser.ID, user.ID)
	}

	if user.Email != email {
		t.Errorf("Expected email %s, got %s", email, user.Email)
	}
}

// TestGetUserNotFound tests retrieval of non-existent user
func TestGetUserNotFound(t *testing.T) {
	setupTestDB(t)

	authSvc := NewAuthService("test-secret")

	// Use a valid UUID format that doesn't exist in database
	user, err := authSvc.GetUser("00000000-0000-0000-0000-000000000000")
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if user != nil {
		t.Fatal("Expected nil user for non-existent ID")
	}
}

// TestGenerateToken tests token generation
func TestGenerateToken(t *testing.T) {
	authSvc := NewAuthService("test-secret-key")

	userID := "test-user-123"
	token, err := authSvc.GenerateToken(userID)

	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if token == "" {
		t.Fatal("Expected non-empty token")
	}
}

// TestVerifyToken tests valid token verification
func TestVerifyToken(t *testing.T) {
	authSvc := NewAuthService("test-secret-key")

	userID := "test-user-123"
	token, err := authSvc.GenerateToken(userID)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	// Verify token
	extractedID, err := authSvc.VerifyToken(token)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if extractedID != userID {
		t.Errorf("Expected userID %s, got %s", userID, extractedID)
	}
}

// TestVerifyTokenInvalid tests invalid token verification
func TestVerifyTokenInvalid(t *testing.T) {
	authSvc := NewAuthService("test-secret-key")

	_, err := authSvc.VerifyToken("invalid.token.here")
	if err == nil {
		t.Fatal("Expected error for invalid token, got nil")
	}

	if err.Error() != "invalid token" {
		t.Errorf("Expected 'invalid token', got %v", err)
	}
}

// TestVerifyTokenWrongSecret tests token verification with wrong secret
func TestVerifyTokenWrongSecret(t *testing.T) {
	authSvc1 := NewAuthService("secret-1")
	authSvc2 := NewAuthService("secret-2")

	userID := "test-user-123"
	token, err := authSvc1.GenerateToken(userID)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	// Try to verify with different secret
	_, err = authSvc2.VerifyToken(token)
	if err == nil {
		t.Fatal("Expected error for wrong secret, got nil")
	}
}

// TestEndToEndAuthFlow tests complete authentication flow
func TestEndToEndAuthFlow(t *testing.T) {
	setupTestDB(t)

	authSvc := NewAuthService("test-secret-key")

	email := "e2e@example.com"
	password := "SecurePassword123!"

	// 1. Create user
	createdUser, err := authSvc.CreateUser(email, password)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// 2. Authenticate user
	authUser, err := authSvc.AuthenticateUser(email, password)
	if err != nil {
		t.Fatalf("Failed to authenticate: %v", err)
	}

	if authUser.ID != createdUser.ID {
		t.Errorf("Expected same user ID: %s vs %s", createdUser.ID, authUser.ID)
	}

	// 3. Generate token
	token, err := authSvc.GenerateToken(authUser.ID)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	// 4. Verify token
	userID, err := authSvc.VerifyToken(token)
	if err != nil {
		t.Fatalf("Failed to verify token: %v", err)
	}

	if userID != authUser.ID {
		t.Errorf("Expected same user ID: %s vs %s", authUser.ID, userID)
	}

	// 5. Get user by ID
	retrievedUser, err := authSvc.GetUser(userID)
	if err != nil {
		t.Fatalf("Failed to get user: %v", err)
	}

	if retrievedUser == nil {
		t.Fatal("Expected user, got nil")
	}

	if retrievedUser.Email != email {
		t.Errorf("Expected email %s, got %s", email, retrievedUser.Email)
	}
}

// TestGetUserByEmail tests retrieving user by email
func TestGetUserByEmail(t *testing.T) {
	setupTestDB(t)
	authSvc := NewAuthService("test-secret-key")

	// Create user
	email := "test@example.com"
	user, err := authSvc.CreateUser(email, "password123")
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Retrieve user by email
	retrievedUser, err := authSvc.GetUserByEmail(email)
	if err != nil {
		t.Fatalf("Failed to get user by email: %v", err)
	}

	if retrievedUser.ID != user.ID {
		t.Errorf("Expected user ID %s, got %s", user.ID, retrievedUser.ID)
	}

	if retrievedUser.Email != email {
		t.Errorf("Expected email %s, got %s", email, retrievedUser.Email)
	}

	// Clean up
	db.GetDB().Exec("DELETE FROM users WHERE email = $1", email)
}

// TestGetUserByEmailNotFound tests retrieving non-existent user by email
func TestGetUserByEmailNotFound(t *testing.T) {
	setupTestDB(t)
	authSvc := NewAuthService("test-secret-key")

	_, err := authSvc.GetUserByEmail("nonexistent@example.com")
	if err == nil {
		t.Fatal("Expected error for non-existent user, got nil")
	}

	if err.Error() != "user not found" {
		t.Errorf("Expected 'user not found', got %v", err)
	}
}

// BenchmarkGenerateToken benchmarks token generation
func BenchmarkGenerateToken(b *testing.B) {
	authSvc := NewAuthService("test-secret-key")
	userID := "test-user-123"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		authSvc.GenerateToken(userID)
	}
}

// BenchmarkVerifyToken benchmarks token verification
func BenchmarkVerifyToken(b *testing.B) {
	authSvc := NewAuthService("test-secret-key")
	token, _ := authSvc.GenerateToken("test-user-123")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		authSvc.VerifyToken(token)
	}
}
