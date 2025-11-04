## Project Structure
This is a full-stack application with a Go backend and TypeScript/React frontend. The project is organized into two main directories:
- `api/` for the backend
- `frontend/` for the frontend application

## Technologies
**Backend:**
- Go 1.24
- Gin web framework
- MySQL database
- Clerk authentication
- OpenAPI/Swagger (fizz)
- Prometheus metrics

**Frontend:**
- TypeScript
- React 19
- Vite build tool
- Bootstrap 5
- i18next internationalization
- Axios HTTP client
- Jest & Playwright testing

**Infrastructure:**
- Docker & Docker Compose for containerization
- pnpm package manager
- GitHub Actions CI/CD

## Backend Structure
The backend (`api/`) follows standard Go project layout:
- `cmd/`: Contains the main applications
- `pkg/`: Contains library code that can be used by external applications
- `test/`: Contains integration test for API and test data


## Frontend Structure
The frontend (`frontend/`) is a TypeScript/React application using Vite:
- `src/`: Contains the source code
- `public/`: Contains static assets
- `dist/`: Contains build output
- `node_modules/`: Contains dependencies

## Development Workflow
- Backend: Use `make` commands in `api/` directory for development
- Frontend: Use `make` commands in `frontend/` directory for development
- Frontend uses pnpm as a package manager
- Backend uses MySQL database which can be run using Docker Compose from the `api/` directory
- Authentication: Uses Clerk for user authentication and profile management. Backend could start in debug authentication in which case every request with token is considered as authenticated with userId same as token. Refer to `api/pkg/rest/auth/auth_middleware.go` for more details.
- Don't make direct changes in `frontend/src/types/schema.d.ts` file. Update it by running `make generate-types` in frontend directory command. API should be running to generate the types.
- Service tests for backend are in `api/test/` directory and are tagged with `servicetest`. They can be run with `make servicetest.run` command. For those tests API should run with DEBUG authentication middleware
- When you update REST interface by changing `api/pkg/api/api.go` or `api/pkg/server/router.go` you need to regenerate the types in `frontend/src/types/schema.d.ts` by running `make generate-types` in frontend directory command and update the frontend code accordingly. API should be running to generate the types.

## Code Style Guidelines
- Backend: Follow Go standard formatting (gofmt)
- Frontend: Follow TypeScript/React best practices and use ESLint for linting

## Testing Guidelines
- Backend: Write integration tests in the `api/test/` directory and unit tests in the Go conventional way
- Frontend: Write tests alongside the components they test
- Frontend: E2E tests using Playwright in `frontend/src/test/e2e/`
- Frontend: Unit tests using Jest with coverage reporting

## Environment Setup
- Backend: Use `.env.example` as a template for environment variables
- Frontend: Environment variables are configured in `vite.config.ts`


## Application Logic

This application is a scheduling platform for racket sports like tennis. It allows creating events and sharing them publicly or with specific people via link or sharing options. Other people may join events and the application manages the event joining lifecycle.

### Key Features
- **Event creation and management**: Create, share, and cancel events
- **Join requests**: Users can express interest by sending join requests with their availability
- **Event confirmation**: Event creators can accept join requests and confirm events
- **Internationalization**: Multi-language support (EN, ES, FR, PL) with localized date/time formatting
- **Notifications**: Automated email notifications for event updates and user actions
- **User profiles**: User management with NTRP ratings and preferences


### Event Flow
1. **UserA creates an event** - The event becomes visible to other players
   - UserA can cancel their own event at any point before confirmation
2. **Users send join requests** - Users select time slots and places available to them (UserB and UserC send requests)
3. **UserA reviews requests** - All join requests are visible to the event creator
4. **UserA confirms a request** - UserA selects UserB's request and must make a reservation at the agreed location and time
   - If reservation fails, the request transitions to ReservationFailed state
5. **Other requests rejected** - UserC's request transitions to rejected state
6. **Event completion** - After the game date/time passes, the event transitions to Completed state
7. **Joined users can cancel** - Users who joined an event can cancel their participation before event is confirmed

### Notification System
- **Queue-based architecture**: Notifications are queued in database and processed by a background worker
- **Multiple delivery methods**: Supports email (SMTP) and can be extended for SMS or other channels
- **Retry mechanism**: Failed notifications are retried with configurable max retry count
- **User preferences**: Users can configure notification preferences (email, phone, etc.)


# Best Practices

## Development Philosophy
- **YAGNI**: Don't add functionality until necessary
- **KISS**: Aim for simplicity in design and implementation
- **DRY**: Avoid duplication by abstracting common functionality
- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion

## Problem-Solving
- **5 Whys**: Use root cause analysis when fixing errors
- **Verify first**: Understand the problem fully before implementing solutions
- **Ask when uncertain**: Consult team if root cause is unclear


