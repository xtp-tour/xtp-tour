.PHONY: start-backend start-frontend start build build-with-version

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