# Docker Deployment Guide

This document describes how to use Docker Compose to run the complete XTP Tour application stack, including frontend, backend, database, and integration tests.

## Overview

The Docker Compose setup includes:
- **MySQL Database**: Primary data storage with Adminer for database management
- **Backend API**: Go-based REST API service
- **Frontend**: React/TypeScript application served via Nginx
- **Integration Tests**: Automated tests that run after deployment

## Quick Start

### Basic Deployment (Frontend + Backend + Database)

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### Full Deployment with Integration Tests

```bash
# Run everything including integration tests
docker-compose up --build
```

### Using the Convenience Makefile

```bash
# Build all images
make -f Makefile.docker build

# Start services in development mode
make -f Makefile.docker dev

# Full deployment with tests
make -f Makefile.docker deploy

# Stop all services
make -f Makefile.docker down

# Clean up everything
make -f Makefile.docker clean
```

## Service Details

### Ports

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Backend Metrics**: http://localhost:8081
- **Database**: localhost:33306
- **Adminer**: http://localhost:38080

### Environment Variables

You can customize the deployment by setting these environment variables:

```bash
# Frontend build arguments
export VITE_CLERK_PUBLISHABLE_KEY="your-clerk-key"
export VITE_APP_VERSION="1.0.0"

# Then run docker-compose
docker-compose up --build
```

### Database Access

- **Host**: localhost:33306
- **Username**: root
- **Password**: password
- **Database**: xtp_tour

Access via Adminer at http://localhost:38080 or connect directly with any MySQL client.

## Development Workflow

### 1. Start Database Only
```bash
docker-compose up mysql adminer -d
```

### 2. Develop Backend Locally
```bash
cd api
make run
```

### 3. Develop Frontend Locally
```bash
cd frontend
make dev
```

### 4. Run Integration Tests
```bash
# Against running services
docker-compose up integration-tests

# Or with the convenience command
make -f Makefile.docker test
```

## File Structure

```
/
├── docker-compose.yaml          # Main compose file with all services
├── Makefile.docker             # Convenience commands
├── DOCKER.md                   # This file
├── api/
│   ├── Dockerfile              # Simple runtime container
│   ├── Dockerfile.multi        # Multi-stage build
│   ├── Int.Dockerfile          # Simple test container
│   ├── Int.Dockerfile.multi    # Multi-stage test build
│   └── docker-compose.yaml     # Original API-only compose
└── frontend/
    ├── Dockerfile              # Multi-stage React build
    └── default.conf            # Nginx configuration
```

## Troubleshooting

### Backend Won't Start
- Check if MySQL is healthy: `docker-compose logs mysql`
- Verify environment variables are set correctly
- Check backend logs: `docker-compose logs backend`

### Frontend Build Fails
- Ensure all required build arguments are provided
- Check if node_modules are properly installed
- Verify Nginx configuration

### Integration Tests Fail
- Ensure backend is running and healthy
- Check test logs: `docker-compose logs integration-tests`
- Verify network connectivity between services

### Database Issues
- Reset database: `docker-compose down -v && docker-compose up mysql -d`
- Check data persistence in `./api/.data/db/`

## Production Considerations

1. **Environment Variables**: Set proper production values for:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_API_BASE_URL`
   - `AUTH_TYPE` (set to "clerk" for production)

2. **Security**:
   - Change default database passwords
   - Use proper TLS certificates
   - Configure proper CORS settings

3. **Scaling**:
   - Use external database for production
   - Consider load balancing for multiple backend instances
   - Use CDN for frontend assets

4. **Monitoring**:
   - Backend metrics available at `:8081`
   - Add proper logging and monitoring solutions

## Commands Reference

```bash
# Start all services
docker-compose up -d

# Start with tests
docker-compose up

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose down

# Clean up completely
docker-compose down -v --remove-orphans

# Rebuild specific service
docker-compose build [service-name]

# Scale a service
docker-compose up -d --scale backend=2
```
