# E2E Tests

End-to-end tests for the XTP Tour frontend using [Playwright](https://playwright.dev/).

## Purpose

These tests validate the complete user flows through the frontend application, including:

- **Basic app functionality**: Verifies the app loads correctly and main UI elements are accessible
- **Event flow**: Tests the complete lifecycle of creating, joining, and confirming events
- **Private events**: Validates private event visibility and direct link access
- **Join state management**: Tests the "Already Joined" button states and join request handling

## Prerequisites

1. **Install Playwright browsers** (first time setup):
   ```bash
   pnpm run playwright:install
   # or
   make test-setup
   ```

2. **Start the development server** (unless using a deployed environment):
   ```bash
   pnpm dev
   # or from frontend directory:
   make run  # starts both backend and frontend
   ```

## Running Tests

### Basic Commands

```bash
# Run all e2e tests (headless)
pnpm run test:e2e

# Run tests with Playwright UI
pnpm run test:e2e:ui

# Run tests in headed browser mode
pnpm run test:e2e:headed

# Debug tests (step through interactively)
pnpm run test:e2e:debug
```

### Using Make Commands

```bash
# Run e2e tests
make test-e2e

# Run e2e tests with UI
make test-e2e-ui

# Run against a deployed environment
make test-e2e-deployed API_URL=https://api.example.com
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TEST_BASE_URL` | Frontend URL to test against | `http://localhost:5173` |
| `CI` | Set in CI environments, adjusts retry and parallelism | - |

Example:
```bash
TEST_BASE_URL=http://localhost:5173 pnpm run test:e2e
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- **Test directory**: `src/test/e2e/`
- **Parallel execution**: Enabled (disabled in CI)
- **Retries**: 2 in CI, 0 locally
- **Browsers**: Chromium, Firefox, WebKit

## Test Structure

### `frontend-event-flow.spec.ts`

Contains three test suites:

1. **Frontend Event Flow Test**
   - `Complete event flow with existing users` (skipped) - Full flow with user switching
   - `Basic app loads correctly` - Verifies app loads without errors
   - `Frontend UI elements are accessible` - Checks main buttons and elements

2. **Private Events Feature**
   - `Public event page shows event details` - Verifies public events page structure
   - `Direct event link page loads correctly` - Tests `/event/:eventId` route
   - `Private event badge indicator renders correctly` - Checks badge support

3. **Already Joined State**
   - `Join button states are properly styled` - Verifies Bootstrap button styles
   - `Sign in to join button is visible for unauthenticated users` - Auth flow check
   - `Already Joined indicator shows after joining event` (skipped) - Full join flow

## Test Users

For authenticated tests, use the development test users:

| Email | Password |
|-------|----------|
| `user2@example.com` | `biAShy=8&Q,%g~T` |
| `test3@example.com` | `aZKymXAlzB1Cp8` |

## Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

Reports are generated in the `playwright-report/` directory.

## Debugging Tips

1. **Use debug mode** for step-by-step execution:
   ```bash
   pnpm run test:e2e:debug
   ```

2. **Run a specific test file**:
   ```bash
   npx playwright test frontend-event-flow.spec.ts
   ```

3. **Run a specific test by name**:
   ```bash
   npx playwright test -g "Basic app loads correctly"
   ```

4. **View trace on failure** (enabled in CI):
   - Traces are saved in `test-results/`
   - Open with: `npx playwright show-trace <trace-file>`
