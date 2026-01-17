package services

import (
	"database/sql"
	"errors"
	"time"

	"automator67/internal/db"
	"automator67/internal/logger"
	"automator67/internal/types"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"github.com/golang-jwt/jwt/v5"
)

// AuthService handles user authentication and JWT token management
type AuthService struct {
	dbConn    *sql.DB
	jwtSecret string
}

// NewAuthService creates a new auth service
func NewAuthService(jwtSecret string) *AuthService {
	return &AuthService{
		dbConn:    db.GetDB(),
		jwtSecret: jwtSecret,
	}
}

// CreateUser creates a new user with hashed password
func (as *AuthService) CreateUser(email string, password string) (*types.User, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		logger.Error("Failed to hash password", err)
		return nil, errors.New("failed to create user: password hashing error")
	}

	userID := uuid.New().String()
	now := time.Now().Unix() * 1000

	query := `
		INSERT INTO users (id, email, password_hash, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, email, created_at, updated_at
	`

	user := &types.User{}
	err = as.dbConn.QueryRow(
		query,
		userID, email, string(hashedPassword), now, now,
	).Scan(
		&user.ID, &user.Email, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		if err.Error() == "pq: duplicate key value violates unique constraint \"users_email_key\"" {
			return nil, errors.New("email already registered")
		}
		logger.Error("Failed to create user", err)
		return nil, err
	}

	logger.Info("User created", userID, email)
	return user, nil
}

// AuthenticateUser validates email/password and returns the user
func (as *AuthService) AuthenticateUser(email string, password string) (*types.User, error) {
	query := `SELECT id, email, password_hash, created_at, updated_at FROM users WHERE email = $1`

	var hashedPassword string
	user := &types.User{}
	err := as.dbConn.QueryRow(query, email).Scan(
		&user.ID, &user.Email, &hashedPassword, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("invalid email or password")
	}
	if err != nil {
		logger.Error("Failed to query user", err)
		return nil, err
	}

	// Compare password
	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	logger.Info("User authenticated", email)
	return user, nil
}

// GetUser retrieves a user by ID
func (as *AuthService) GetUser(userID string) (*types.User, error) {
	query := `SELECT id, email, created_at, updated_at FROM users WHERE id = $1`

	user := &types.User{}
	err := as.dbConn.QueryRow(query, userID).Scan(
		&user.ID, &user.Email, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		logger.Error("Failed to get user", err)
		return nil, err
	}

	return user, nil
}

// GetUserByEmail retrieves a user by email
func (as *AuthService) GetUserByEmail(email string) (*types.User, error) {
	query := `SELECT id, email, created_at, updated_at FROM users WHERE email = $1`

	user := &types.User{}
	err := as.dbConn.QueryRow(query, email).Scan(
		&user.ID, &user.Email, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("user not found")
	}
	if err != nil {
		logger.Error("Failed to get user by email", err)
		return nil, err
	}

	return user, nil
}

// GenerateToken generates a JWT token for a user
func (as *AuthService) GenerateToken(userID string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)

	claims := jwt.MapClaims{
		"sub":  userID,
		"exp":  expirationTime.Unix(),
		"iat":  time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(as.jwtSecret))
	if err != nil {
		logger.Error("Failed to generate token", err)
		return "", err
	}

	return tokenString, nil
}

// VerifyToken verifies and parses a JWT token
func (as *AuthService) VerifyToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(as.jwtSecret), nil
	})

	if err != nil {
		return "", errors.New("invalid token")
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		if userID, ok := claims["sub"].(string); ok {
			return userID, nil
		}
	}

	return "", errors.New("invalid token claims")
}

// Global auth service instance
var authSvc *AuthService

// InitAuthService initializes the auth service with JWT secret
func InitAuthService(jwtSecret string) {
	authSvc = NewAuthService(jwtSecret)
}

// GetAuthService returns the auth service instance
func GetAuthService() *AuthService {
	if authSvc == nil {
		// Default to a placeholder - in production, should be set via InitAuthService
		authSvc = NewAuthService("development-secret-key")
	}
	return authSvc
}
