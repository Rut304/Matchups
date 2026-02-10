# Matchups Testing Strategy

## Current State

- **E2E Testing**: Playwright configured with comprehensive tests
- **Unit Testing**: Not configured
- **Integration Testing**: Partial (via E2E)

## Recommended Testing Stack (Open Source)

### 1. Unit Testing: Vitest

- **Why Vitest over Jest**:
  - Native ESM support (Next.js 16 uses ESM)
  - Vite-native speed (10-20x faster)
  - Jest-compatible API (easy migration)
  - Built-in TypeScript support

### 2. Component Testing: React Testing Library + Vitest

- Test components in isolation
- User-centric testing philosophy

### 3. E2E Testing: Playwright (already configured)

- Cross-browser testing
- Visual regression capability
- Network mocking

### 4. API Testing: Vitest + MSW (Mock Service Worker)

- Mock external APIs (ESPN, X/Twitter, etc.)
- Test API routes in isolation

---

## Implementation Plan

### Phase 1: Unit Testing Setup (Today)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom msw
```

### Phase 2: Critical Path Testing

1. **API Route Tests** - Your scrapers, grading system, leaderboard
2. **Data Processing** - Pick parsing, line extraction, grading logic
3. **Component Tests** - Key UI components

### Phase 3: Integration Tests

1. **Database Operations** - Supabase queries
2. **External API Integration** - ESPN, X/Twitter mocking

---

## Test Scripts to Add

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "vitest run && playwright test"
  }
}
```

---

## Priority Test Files to Create

### 1. Pick Grading Tests (`__tests__/grading/pick-grader.test.ts`)

```typescript
// Test that spreads are graded against THEIR line
// Test totals over/under logic
// Test moneyline grading
// Test edge cases (push, void)
```

### 2. Pick Parsing Tests (`__tests__/scrapers/pick-parser.test.ts`)

```typescript
// Test tweet parsing for betting picks
// Test line extraction from text
// Test team name detection
// Test sport detection
```

### 3. Leaderboard API Tests (`__tests__/api/leaderboard.test.ts`)

```typescript
// Test filtering by sport
// Test period calculations
// Test sorting
```

### 4. ESPN Scraper Tests (`__tests__/scrapers/espn.test.ts`)

```typescript
// Test HTML parsing
// Test expert extraction
// Test pick record parsing
```

---

## Mocking Strategy

### External APIs

Use MSW to mock:

- ESPN API responses
- X/Twitter API responses (avoid rate limits in tests)
- Supabase (for isolated unit tests)

### Database

- Use test database for integration tests
- Mock Supabase client for unit tests

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:coverage
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## Coverage Targets

| Area | Target | Priority |
|------|--------|----------|
| Grading Logic | 90%+ | 🔴 Critical |
| Pick Parsing | 85%+ | 🔴 Critical |
| API Routes | 80%+ | 🟠 High |
| Components | 70%+ | 🟡 Medium |
| Utilities | 75%+ | 🟡 Medium |

---

## Best Practices

1. **Test Naming**: `describe('gradePick')` → `it('should mark spread pick as won when team covers their line')`

2. **Arrange-Act-Assert**: Clear test structure

3. **Test Data**: Create fixtures in `__tests__/fixtures/`

4. **Snapshot Testing**: Only for stable UI components

5. **Avoid Testing Implementation**: Test behavior, not internals

---

## Quick Start Commands

```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom msw @vitest/coverage-v8 @vitest/ui

# Run unit tests
npm test

# Run with UI
npm run test:ui

# Run E2E tests
npx playwright test

# Run specific test file
npx vitest __tests__/grading/pick-grader.test.ts

# Run E2E with UI for debugging
npx playwright test --ui
```
