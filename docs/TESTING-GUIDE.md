# Testing Guide

## Test Structure
```
tests/
├── unit/           # Unit tests for utilities, services
├── integration/    # API route tests
├── e2e/            # Playwright E2E tests
└── platform-admin/ # Existing admin module tests
```

## Running Tests
```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# E2E tests (when implemented)
npx playwright test
```

## Unit Testing Patterns
- Test business logic, not implementation details
- Mock external dependencies (database, APIs)
- Use factories for test data
- Test edge cases and error paths

## API Testing Patterns
- Test each endpoint's happy path
- Test validation errors (400 responses)
- Test authorization (401/403 responses)
- Test not found scenarios (404 responses)
- Clean up test data after each test

## E2E Testing Patterns (Playwright)
- Test critical user journeys
- Login → Dashboard → Key Features
- Test on multiple viewports
- Use data-testid attributes for selectors
- Screenshots on failure

## Writing Good Tests
1. Arrange - set up test data and conditions
2. Act - perform the action being tested
3. Assert - verify the expected outcome
