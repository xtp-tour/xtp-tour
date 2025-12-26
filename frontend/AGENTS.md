This file provides guidance to AI Agents(Claude Code (claude.ai/code), Cursor, Copilot) when working with code in this repository.



IMPORTANT! This directory is part of the `xtp-tour` monorepo. Monorepo-wide rules are defined in `../AGENTS.md`.

## Development Commands

### Package Management
- **Package manager**: Use `pnpm` (required)
- Install dependencies: `pnpm install`
- Install Playwright browsers: `pnpm run playwright:install` or `make test-setup`

### Development
- Start dev server: `pnpm dev` or `make start-frontend`
- Start both backend & frontend: `make run` (from frontend directory)
- Dev server runs on port 5173 with proxy to backend at localhost:8080

### Building
- Build: `pnpm build` or `make build`
- Build with version: `make build-with-version VERSION=1.2.3`
- Preview production build: `pnpm preview`

### Linting
- Run ESLint: `pnpm lint`  and `pnpm i18n:check` completing a task

### Testing
- Run unit tests: `pnpm test` or `make test`
- Run tests in watch mode: `pnpm test:watch`
- Run tests with coverage: `pnpm test:coverage`
- Run E2E tests: `pnpm run test:e2e` or `make test-e2e` (requires TEST_API_BASE_URL env var)
- Run E2E tests with UI: `pnpm run test:e2e:ui` or `make test-e2e-ui`
- Run E2E tests in headed mode: `pnpm run test:e2e:headed`
- Debug E2E tests: `pnpm run test:e2e:debug`
- Run E2E against deployed environment: `make test-e2e-deployed API_URL=https://api.example.com`

### Type Generation
- Generate API types from OpenAPI spec: `pnpm generate-types` or `make update-api-schema`
- **Important**: Backend API must be running on localhost:8080 to generate types
- Types are generated in `src/types/schema.d.ts`

## Architecture Overview

### Technology Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6.x
- **Styling**: Bootstrap 5 with native CSS classes (avoid custom CSS)
- **Auth**: Clerk for authentication (can be disabled via env var)
- **HTTP Client**: Axios
- **i18n**: i18next with react-i18next (supports EN, ES, FR, PL)
- **Routing**: React Router v7
- **Testing**: Jest for unit tests, Playwright for E2E tests

### Project Structure
```
src/
├── components/         # React components
│   ├── event/         # Event-specific components
│   └── LandingPage/   # Landing page components
├── hooks/             # Custom React hooks
├── i18n/              # Internationalization config
├── services/          # API clients (mock & real)
├── styles/            # Shared styles
├── test/              # Test setup and E2E tests
│   └── e2e/          # Playwright tests
├── types/             # TypeScript type definitions
│   ├── schema.d.ts   # Auto-generated from OpenAPI (DO NOT EDIT)
│   └── api.ts        # API type wrappers
└── utils/             # Utility functions
```

### API Integration

**Type Generation Workflow**:
1. API types are auto-generated from OpenAPI spec in `src/types/schema.d.ts`
2. Never edit `schema.d.ts` directly - regenerate using `make update-api-schema`
3. Wrapper types are defined in `src/types/api.ts` for convenience
4. All API calls go through `APIClient` interface implementations

**API Client Architecture**:
- `APIProvider` (src/services/apiProvider.tsx) - React context provider
- `RealAPIClient` (src/services/realApi.ts) - Production API client with error reporting
- `MockAPIClient` (src/services/mockApi.ts) - Mock for development without backend
- Use `useAPI()` hook to access API client in components
- Client automatically handles authentication via Clerk tokens
- Falls back to mock client when Clerk is unavailable

**Authentication**:
- Clerk integration is optional via `VITE_CLERK_PUBLISHABLE_KEY` env var
- When Clerk is not configured, app runs in demo mode with mock API
- Backend supports DEBUG authentication mode for testing (see `../AGENTS.md`)

### Date/Time Handling
- **Critical**: API uses UTC timestamps, UI displays in local time
- Use utilities in `src/utils/dateUtils.ts` and `src/utils/i18nDateUtils.ts`
- `moment` library is used for date manipulation
- `react-timeago` for relative time display
- All date formatting should respect user's locale (i18n)

### Styling Guidelines
- Use native Bootstrap classes exclusively
- Avoid custom CSS unless absolutely necessary
- Bootstrap 5.3.x is the current version
- Bootstrap Icons for iconography
- CSS variables for theming (see `--tennis-navy`, `--tennis-accent` usage)

### Testing
- **Unit tests**: Jest with React Testing Library
- **E2E tests**: Playwright in `src/test/e2e/`
- E2E tests require backend API running (or use TEST_API_BASE_URL)
- Test setup in `src/test/setup.ts`
- Mock API available for component testing

### Environment Variables
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk auth key (optional)
- `VITE_API_BASE_URL` - API base URL (defaults to proxy)
- `VITE_APP_VERSION` - App version for display
- Development uses Vite proxy to avoid CORS (configured in vite.config.ts)

### Development Users (for testing)
- Email: "user2@example.com" Password: "biAShy=8&Q,%g~T"
- Email: "test3@example.com" Password: "aZKymXAlzB1Cp8"

## Common Patterns

### Adding New API Endpoints
1. Update backend OpenAPI spec
2. Run `make update-api-schema` with backend running
3. Add method to `APIClient` interface in `src/types/api.ts`
4. Implement in both `RealAPIClient` and `MockAPIClient`
5. Use via `useAPI()` hook in components

### Internationalization
- Add translations to `src/i18n/index.ts`
- Use `useTranslation()` hook: `const { t } = useTranslation();`
- Format dates with locale awareness using utils in `src/utils/i18nDateUtils.ts`
- All user-facing text must be translatable

### Error Handling
- `RealAPIClient` includes silent error reporting to backend
- Use `ErrorBoundary` component for catching React errors
- HTTP errors are wrapped in `HTTPError` class with status codes

### Validation
- Use Zod for validation


## Important Notes

- This is part of the xtp-tour monorepo (see `../AGENTS.md`)
- Never commit directly to README.md for changelog/updates
- Follow YAGNI, KISS, DRY, SOLID principles
- Use 5 Whys technique for root cause analysis
- Check dependencies in `package.json` before adding new ones


- Don't create MD files without permission
- Make sure you update AGENTS.md files when significant architecture changes are made