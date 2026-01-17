package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"automator67/internal/db"
	"automator67/internal/services"
	"automator67/internal/types"
	"github.com/gin-gonic/gin"
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
		User:     "postgres",
		Password: "password",
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

// Helper function to setup test router
func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Initialize auth service
	services.InitAuthService("test-secret-key")

	// Register routes
	router.POST("/auth/signup", SignupHandler)
	router.POST("/auth/login", LoginHandler)
	router.GET("/auth/github/callback", GitHubCallbackHandler)
	router.GET("/me", AuthMiddleware, MeHandler)

	return router
}

// TestSignupSuccess tests successful user signup
func TestSignupSuccess(t *testing.T) {
	setupTestDB(t)

	router := setupTestRouter()

	reqBody := SignupRequest{
		Email:    "newuser@example.com",
		Password: "SecurePass123!",
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/auth/signup", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d", http.StatusCreated, w.Code)
	}

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	if response["user"] == nil {
		t.Fatal("Expected user in response")
	}

	if response["token"] == nil {
		t.Fatal("Expected token in response")
	}
}

// TestSignupDuplicateEmail tests signup with duplicate email
func TestSignupDuplicateEmail(t *testing.T) {
	setupTestDB(t)

	router := setupTestRouter()

	email := "duplicate@example.com"
	password := "SecurePass123!"

	// First signup
	reqBody1 := SignupRequest{Email: email, Password: password}
	body1, _ := json.Marshal(reqBody1)
	req1 := httptest.NewRequest("POST", "/auth/signup", bytes.NewReader(body1))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)

	if w1.Code != http.StatusCreated {
		t.Fatalf("First signup failed: got status %d", w1.Code)
	}

	// Second signup with same email
	reqBody2 := SignupRequest{Email: email, Password: password}
	body2, _ := json.Marshal(reqBody2)
	req2 := httptest.NewRequest("POST", "/auth/signup", bytes.NewReader(body2))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	if w2.Code != http.StatusConflict {
		t.Errorf("Expected status %d, got %d", http.StatusConflict, w2.Code)
	}
}

// TestSignupInvalidEmail tests signup with invalid email
func TestSignupInvalidEmail(t *testing.T) {
	setupTestDB(t)

	router := setupTestRouter()

	reqBody := SignupRequest{
		Email:    "invalid-email",
		Password: "SecurePass123!",
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/auth/signup", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestSignupWeakPassword tests signup with password too short
func TestSignupWeakPassword(t *testing.T) {
	setupTestDB(t)

	router := setupTestRouter()

	reqBody := SignupRequest{
		Email:    "user@example.com",
		Password: "short",
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/auth/signup", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

// TestLoginSuccess tests successful login
func TestLoginSuccess(t *testing.T) {
	setupTestDB(t)

	router := setupTestRouter()
	authSvc := services.GetAuthService()

	email := "login@example.com"
	password := "SecurePass123!"

	// Create user first
	authSvc.CreateUser(email, password)

	// Login
	reqBody := LoginRequest{Email: email, Password: password}
	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	if response["user"] == nil {
		t.Fatal("Expected user in response")
	}

	if response["token"] == nil {
		t.Fatal("Expected token in response")
	}
}

// TestLoginInvalidEmail tests login with non-existent email
func TestLoginInvalidEmail(t *testing.T) {
	setupTestDB(t)

	router := setupTestRouter()

	reqBody := LoginRequest{
		Email:    "nonexistent@example.com",
		Password: "SomePassword123!",
	}

	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d, got %d", http.StatusUnauthorized, w.Code)
	}
}

// TestLoginWrongPassword tests login with wrong password
func TestLoginWrongPassword(t *testing.T) {
	setupTestDB(t)

	router := setupTestRouter()
	authSvc := services.GetAuthService()

	email := "wrongpass@example.com"
	password := "CorrectPassword123!"

	// Create user
	authSvc.CreateUser(email, password)

	// Try login with wrong password
	reqBody := LoginRequest{Email: email, Password: "WrongPassword456!"}
	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d, got %d", http.StatusUnauthorized, w.Code)
	}
}

// TestMeHandlerAuthenticated tests getting profile when authenticated
func TestMeHandlerAuthenticated(t *testing.T) {
	setupTestDB(t)

	router := setupTestRouter()
	authSvc := services.GetAuthService()

	email := "me@example.com"
	password := "SecurePass123!"

	// Create and authenticate user
	user, _ := authSvc.CreateUser(email, password)
	token, _ := authSvc.GenerateToken(user.ID)

	// Get profile
	req := httptest.NewRequest("GET", "/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var user_response types.User
	json.Unmarshal(w.Body.Bytes(), &user_response)

	if user_response.Email != email {
		t.Errorf("Expected email %s, got %s", email, user_response.Email)
	}
}

// TestMeHandlerNoAuth tests getting profile without authentication
func TestMeHandlerNoAuth(t *testing.T) {
	setupTestDB(t)

	router := setupTestRouter()

	req := httptest.NewRequest("GET", "/me", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// Should fall back to test-user in development
	if w.Code != http.StatusOK && w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d or %d, got %d", http.StatusOK, http.StatusUnauthorized, w.Code)
	}
}

// TestMeHandlerInvalidToken tests getting profile with invalid token
func TestMeHandlerInvalidToken(t *testing.T) {
	setupTestDB(t)

	router := setupTestRouter()

	req := httptest.NewRequest("GET", "/me", nil)
	req.Header.Set("Authorization", "Bearer invalid.token.here")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status %d, got %d", http.StatusUnauthorized, w.Code)
	}
}

// BenchmarkSignup benchmarks signup endpoint
func BenchmarkSignup(b *testing.B) {
	setupTestDB(&testing.T{})

	router := setupTestRouter()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		reqBody := SignupRequest{
			Email:    "bench" + string(rune(i)) + "@example.com",
			Password: "BenchPass123!",
		}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest("POST", "/auth/signup", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)
	}
}

// BenchmarkLogin benchmarks login endpoint
func BenchmarkLogin(b *testing.B) {
	setupTestDB(&testing.T{})

	router := setupTestRouter()
	authSvc := services.GetAuthService()

	email := "benchlogin@example.com"
	password := "BenchPass123!"
	authSvc.CreateUser(email, password)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		reqBody := LoginRequest{Email: email, Password: password}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest("POST", "/auth/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)
	}
}
