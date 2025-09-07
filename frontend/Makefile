.PHONY: start-backend start-frontend start build build-with-version test test-e2e test-e2e-ui test-setup

start-backend:
	cd ../api && make run

start-frontend:
	pnpm dev

update-api-schema:
	pnpm generate-types

run:
	make start-backend & make start-frontend

# Build with default version (dev)
build:
	pnpm build

# Build with specific version (example: make build-with-version VERSION=1.2.3)
build-with-version:
	VITE_APP_VERSION=$(VERSION) pnpm build

# Testing
test:
	pnpm test

test-setup:
	pnpm install
	pnpm run playwright:install

# Run integration tests against local environment
test-e2e:
	TEST_API_BASE_URL=http://localhost:8080 pnpm run test:e2e

# Run integration tests with UI
test-e2e-ui:
	TEST_API_BASE_URL=http://localhost:8080 pnpm run test:e2e:ui

# Run integration tests against deployed environment
# Usage: make test-e2e-deployed API_URL=https://api.example.com
test-e2e-deployed:
	TEST_API_BASE_URL=$(API_URL) pnpm run test:e2e