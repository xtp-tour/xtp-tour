

This file provides guidance to AI Agents(Claude Code (claude.ai/code), Cursor, Copilot) when working with code in this repository.

IMPORTANT! This directory is part of the `xtp-tour` monorepo. Common rules are definde in `../AGENTS.md`.

## Common Development Commands

### Running the Application
- `make run` or `go run cmd/server/main.go` - Start the API server (default port 8080)
- `make dev` - Run with hot-reload using air (sets AUTH_TYPE=debug, LOG_LEVEL=debug)
- `make build` - Build the binary to `bin/api`
- `make build-arm` - Build for ARM64 architecture

### Database Management
- `make migrate` or `go run ./... migrate` - Run database migrations
- `make dbreset` - **DESTRUCTIVE**: Drop and recreate database with migrations
- `make gen-schemas` - Generate database models from schema using xo

### Testing
- `go test ./... -v` - Run unit tests
- `make servicetest.run` or `go test ./test/stest -tags servicetest -v -count=1` - Run service tests (requires running server with DEBUG auth)
- `make str` - Run service tests against temporary local database (sets up db, starts server, runs tests, cleans up)

### Code Quality
- `make lint` - Run golangci-lint

## Architecture Overview

### Project Structure
```
api/
├── cmd/
│   ├── server/main.go    - Application entry point
│   └── version/          - Version handling
├── pkg/
│   ├── api/              - API request/response types and OpenAPI definitions
│   ├── db/               - Database layer (queries, migrations, types)
│   ├── rest/             - REST utilities (fizz setup, auth middleware)
│   ├── server/           - HTTP router and handlers
│   ├── notifications/    - Notification system (queue, workers, senders)
│   └── metrics/          - Prometheus metrics
└── test/stest/           - Service tests (integration tests)
```

### Key Technologies
- **Web Framework**: Gin with fizz/tonic for OpenAPI-first REST API
- **Database**: MySQL 9.3+ accessed via database/sql and jmoiron/sqlx
- **Authentication**: Clerk (production) or debug mode (testing)
- **API Documentation**: OpenAPI/Swagger via fizz (http://localhost:8080/swagger)
- **Metrics**: Prometheus metrics on separate port (default 10250)
- **Configuration**: Environment variables via num30/config

### Authentication
The API supports two authentication modes (configured via `AUTH_TYPE` env var):
- `clerk` (default): Production authentication using Clerk SDK
- `debug`: Development mode where the `Authentication` header value is used directly as the user ID

Location: `pkg/rest/auth/auth_middleware.go`

### Database Layer
- **Migrations**: SQL files in `pkg/db/sql/migrations/` managed by golang-migrate
- **Migration naming**: `NNNNNN_description.up.sql` and `NNNNNN_description.down.sql`
- **Database access**: All queries are in `pkg/db/db.go` using sqlx for parameterized queries
- **Custom types**: `pkg/db/db_types.go` contains custom scanner/valuer implementations for JSON columns

### API Handlers (pkg/server/router.go)
All handlers follow the pattern:
1. Extract user ID from Gin context (set by auth middleware)
2. Create structured logger with relevant context
3. Call database layer methods
4. Return typed responses or `rest.HttpError` for errors

The router uses fizz for OpenAPI generation. All API types are defined in `pkg/api/api.go` with struct tags for validation and OpenAPI documentation.

### Notification System
Background worker-based notification system:
- **Queue**: Database-backed queue (`pkg/db/notif_queue.go`)
- **Worker**: Polls queue on configurable interval (`pkg/notifications/worker.go`)
- **Senders**: Fan-out architecture supporting email, SMS, and debug channels
- **Configuration**: Email SMTP settings via environment variables

The worker starts in `cmd/server/main.go` and runs in a separate goroutine.

## Service Tests
Service tests are in `test/stest/` and tagged with `//go:build servicetest`.

**Requirements**:
- Server must be running with `AUTH_TYPE=debug`
- Tests use `Authentication` header with user ID as the token value
- Configuration via environment variables: `SERVICE_HOST`, `METRICS_HOST`

**Test patterns**:
- Tests create temporary user profiles with timestamps for uniqueness
- Helper functions: `createProfiles()` creates test users, `deleteProfiles()` cleans up
- Tests use relative dates via `getRelativeDate(days, hour)` to avoid time-dependent failures

## Event Features

### Event Visibility
Events support two visibility modes (`visibility` field):
- `PUBLIC`: Event appears in public events list
- `PRIVATE`: Event is hidden from public list but accessible via direct link

**API Behavior**:
- `GET /api/events/public` - Returns only PUBLIC events with OPEN status
- `GET /api/events/public/{eventId}` - Returns any event (PUBLIC or PRIVATE) by ID
- Private events can be joined via `/api/events/public/{eventId}/joins` endpoint
- Host always sees their private events in `GET /api/events/` (my events list)

**Use Cases**:
- Private events for invite-only games (share link via WhatsApp, email, etc.)
- Public events for open matchmaking

### Join Request States
Join requests track user participation with the following states:
- `isAccepted: null/undefined` - Pending approval
- `isAccepted: true` - Accepted by host (included in event confirmation)
- `isRejected: true` - Rejected by host

**Important**: New join requests have `isRejected` as `null`/`undefined`, not `false`. Frontend uses `isRejected !== true` check to detect active join requests.

## Important Patterns

### Error Handling
Use `rest.HttpError` for HTTP errors:
```go
return nil, rest.HttpError{
    HttpCode: http.StatusBadRequest,
    Message:  "User-friendly error message",
}
```

### Database Custom Errors
- `db.DbObjectNotFoundError`: Resource not found (maps to 404)
- `db.ValidationError`: Business logic validation failed (maps to 400)

### Date/Time Format
All timestamps use ISO 8601 format in UTC: `YYYY-MM-DDTHH:MM:SSZ`
Utility functions in `pkg/api/time_utils.go`

### OpenAPI Documentation
Struct tags control OpenAPI generation:
- `json:"fieldName"` - JSON field name
- `validate:"required"` - Mark as required
- `enum:"VALUE1,VALUE2"` - Enum values
- `description:"..."` - Field description
- `format:"date"` - Date/time format hint
- `path:"paramName"` - Path parameter
- `default:"value"` - Default value

## Configuration
Configuration is loaded from environment variables via `pkg/config.go`:
- `DEBUG_MODE` - Enable debug mode features
- `LOG_LEVEL` - Log level (debug, info, warn, error)
- `SERVICE_PORT` - HTTP server port (default: 8080)
- `METRICS_PORT` - Prometheus metrics port (default: 10250)
- `AUTH_TYPE` - Authentication type (clerk or debug)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database connection
- `EMAIL_*` - Email notification settings (SMTP)
- `NOTIFICATION_MAX_RETRIES`, `NOTIFICATION_TICKER_SECONDS` - Notification worker config

## Common Issues & Solutions

### Service Tests Failing
- Ensure server is running with `AUTH_TYPE=debug`
- Check `SERVICE_HOST` and `METRICS_HOST` environment variables
- Use `make str` to run tests with automatic setup/teardown

### Database Connection Issues
- Default connection: `mysql://root:password@127.0.0.1:33306/xtp_tour`
- Check docker-compose is running for local MySQL
- Verify `parseTime=true` is in connection string for time handling

### OpenAPI Schema Generation
- API must be running to generate frontend types
- Access OpenAPI spec at http://localhost:8080/openapi.json
- Swagger UI available at http://localhost:8080/swagger
