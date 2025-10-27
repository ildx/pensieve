# Test Suite Documentation

This directory contains comprehensive tests for the Pensieve application.

## Test Structure

```
tests/
├── unit/              # Unit tests for utilities and pure functions
├── integration/       # Integration tests for API routes and middleware
├── e2e/              # End-to-end tests with Playwright
└── setup.ts          # Test environment setup
```

## Running Tests

### All Tests
```bash
bun run test
```

### Unit Tests Only
```bash
bun run test tests/unit
```

### Integration Tests Only
```bash
bun run test tests/integration
```

### E2E Tests
```bash
bun run test:e2e
```

### Watch Mode (for development)
```bash
bun run test --watch
```

### With UI
```bash
bun run test:ui
```

### Coverage Report
```bash
bun run test --coverage
```

## Test Coverage

### Unit Tests (`tests/unit/`)

- **rateLimit.test.ts**: Tests for rate limiting utilities
  - IP extraction from headers
  - Sleep/delay functionality
  
- **schema.test.ts**: Tests for database schema validation
  - Note insertion validation
  - Note update validation
  - Field length limits
  - UUID format validation

### Integration Tests (`tests/integration/`)

- **validate-email.test.ts**: Tests for email validation API
  - Input validation (format, length, type)
  - Security headers
  - Case-insensitive comparison
  - Generic error messages
  
- **proxy.test.ts**: Tests for authentication middleware
  - Public route access
  - Protected route redirection
  - Session token validation
  - Token format checks

### E2E Tests (`tests/e2e/`)

- **auth.spec.ts**: End-to-end authentication flow tests
  - Login page rendering
  - Email validation flow
  - Error handling
  - Passkey step navigation
  - Session management
  - Mobile responsiveness
  - Security headers verification

## Test Environment Setup

### Prerequisites

1. **Environment Variables**: Copy `.env.example` to `.env.test`
```bash
cp .env.example .env.test
```

2. **Test Database**: For integration tests that hit the database, ensure you have a test database configured:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/pensieve_test
```

3. **Allowed Emails**: Set test emails in `.env.test`:
```bash
ALLOWED_EMAILS=test@example.com,allowed@example.com
```

### Running E2E Tests

E2E tests require the development server to be running:

```bash
# Terminal 1: Start dev server
bun run dev

# Terminal 2: Run E2E tests
bun run test:e2e
```

Or use the built-in web server (configured in `playwright.config.ts`):
```bash
bun run test:e2e
```

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '@/lib/utils/myUtil'

describe('My Utility', () => {
  it('should do something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })
})
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/my-route/route'

describe('My API Route', () => {
  it('should handle POST request', async () => {
    const request = new Request('http://localhost:3000/api/my-route', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    })
    
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('should navigate to page', async ({ page }) => {
  await page.goto('/my-page')
  await expect(page.locator('h1')).toContainText('My Page')
})
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Clean up any test data after tests complete
3. **Mocking**: Mock external dependencies (APIs, databases) when appropriate
4. **Descriptive Names**: Use clear, descriptive test names
5. **AAA Pattern**: Arrange, Act, Assert - structure tests clearly
6. **Edge Cases**: Test both happy paths and error cases
7. **Security**: Include tests for security features (rate limiting, validation, etc.)

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Before deployment

Ensure all tests pass before merging PRs.

## Debugging Tests

### Vitest UI
```bash
bun run test:ui
```
Opens an interactive UI for debugging unit/integration tests.

### Playwright Debug Mode
```bash
PWDEBUG=1 bun run test:e2e
```
Opens Playwright Inspector for step-by-step debugging.

### Verbose Output
```bash
bun run test --reporter=verbose
```

## Test Data

Test data should be:
- Realistic but not real user data
- Consistent across test runs
- Easy to identify as test data (e.g., `test@example.com`)

## Known Limitations

1. **Passkey Tests**: E2E tests for passkey authentication require manual interaction and are marked as `skip` by default
2. **Rate Limiting**: Integration tests may need to account for rate limits
3. **Database State**: Some tests may require specific database state

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all existing tests still pass
3. Add tests for edge cases and error conditions
4. Update this README if adding new test categories

