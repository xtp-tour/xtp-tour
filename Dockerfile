# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source code
COPY frontend/ ./

# Build the frontend
RUN pnpm build

# Stage 2: Build the backend
FROM golang:1.23.2-alpine AS backend-builder

WORKDIR /app/api

# Copy go.mod and go.sum to download dependencies
COPY api/go.mod api/go.sum ./

# Download dependencies
RUN go mod download

# Copy backend source code
COPY api/ ./

# Build the backend
RUN CGO_ENABLED=0 go build -o /app/bin/api cmd/server/main.go

# Stage 3: Final image
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy backend binary
COPY --from=backend-builder /app/bin/api /app/api

# Create directory structure for frontend
RUN mkdir -p /app/frontend/dist/assets

# Copy frontend static files
COPY --from=frontend-builder /app/frontend/dist/index.html /app/frontend/dist/
COPY --from=frontend-builder /app/frontend/dist/assets /app/frontend/dist/assets

# Expose backend port
EXPOSE 8080

# Set environment variables (customize as needed)
ENV FRONTEND_PATH=/app/frontend/dist

# Command to run the api server
CMD ["/app/api"] 