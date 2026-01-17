.PHONY: build run dev test clean lint

# Build the application
build:
	go build -o bin/controller cmd/main.go

# Run the application
run: build
	./bin/controller

# Run in development mode with hot reload
dev:
	go run cmd/main.go

# Run tests
test:
	go test ./...

# Run tests with verbose output
test-v:
	go test -v ./...

# Lint the code
lint:
	golangci-lint run ./...

# Format code
fmt:
	go fmt ./...

# Clean build artifacts
clean:
	rm -rf bin/
	go clean

# Get dependencies
deps:
	go mod download
	go mod tidy

# Run with optimizations
run-prod: build
	GIN_MODE=release ./bin/controller
