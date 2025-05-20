FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy the Go module files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o bittactoe main.go

# Final stage
FROM alpine:latest

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/bittactoe .

# Copy static files
COPY --from=builder /app/static ./static

# Expose port 8080
EXPOSE 8080

# Run the application
CMD ["./bittactoe"]
