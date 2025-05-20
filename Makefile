# BitTacToe Makefile

# Binary name
SERVER_BIN := ./build/bittactoe

# Source directory
SERVER_SRC := main.go

# Build flags
BUILD_FLAGS := -v

# Default goal
.PHONY: all
all: build

# Build the server
.PHONY: build
build:
	@echo "Building BitTacToe server..."
	go build $(BUILD_FLAGS) -o $(SERVER_BIN) $(SERVER_SRC)

# Run the server
.PHONY: run
run: build
	@echo "Starting BitTacToe server on port 8080..."
	./$(SERVER_BIN)

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	rm -f $(SERVER_BIN)

# Run tests
.PHONY: test
test:
	@echo "Running tests..."
	go test -v ./...

# Build Docker image
.PHONY: docker-build
docker-build:
	@echo "Building Docker image..."
	docker build -t bittactoe:latest .

# Run Docker container
.PHONY: docker-run
docker-run: docker-build
	@echo "Running Docker container..."
	docker run -p 8080:8080 bittactoe:latest

# Development mode: watch for file changes and restart server
.PHONY: dev
dev:
	@echo "Starting development mode with hot reload..."
	@if command -v air > /dev/null; then \
		air -c .air.toml; \
	else \
		echo "Air is not installed. Install with: go install github.com/cosmtrek/air@latest"; \
		go build $(BUILD_FLAGS) -o $(SERVER_BIN) $(SERVER_SRC) && ./$(SERVER_BIN); \
	fi

# Install dependencies
.PHONY: deps
deps:
	@echo "Installing dependencies..."
	go mod download

# Show help
.PHONY: help
help:
	@echo "BitTacToe Makefile commands:"
	@echo "  make build           - Build the server"
	@echo "  make run             - Build and run the server"
	@echo "  make clean           - Remove build artifacts"
	@echo "  make test            - Run tests"
	@echo "  make docker-build    - Build Docker image"
	@echo "  make docker-run      - Build and run Docker container"
	@echo "  make dev             - Run server in development mode with hot reload"
	@echo "  make deps            - Install dependencies"
	@echo "  make help            - Show this help message"

# Default target
.DEFAULT_GOAL := help
