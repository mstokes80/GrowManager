# Analytics E2E Test Suite Documentation

## Overview

This document describes the comprehensive end-to-end (E2E) test suite for the GrowManager Analytics feature. The test suite validates analytics functionality across all major analytics pages, ensures proper error handling, tests performance benchmarks, and verifies accessibility compliance.

## Test Suite Structure

### Total Test Coverage

- **Total Test Files**: 9
- **Total Tests**: 54 tests
- **Test Framework**: Playwright
- **Browser Coverage**: Chrome, Firefox, Safari (WebKit), Mobile, Tablet

### Test Files

#### 1. `analytics-dashboard.spec.ts` (5 tests)
Tests the main analytics dashboard functionality:
- Dashboard navigation and metrics loading
- Recent activity feed display
- Metric card interaction and navigation
- Quick-add button functionality
- Mobile responsive layout

#### 2. `analytics-environmental.spec.ts` (7 tests)
Tests environmental analytics features:
- Page navigation and grow selection
- Temperature chart with data points
- Humidity chart rendering
- VPD (Vapor Pressure Deficit) chart with optimal ranges
- Time range filtering (7d, 30d, 90d)
- CSV export functionality

#### 3. `analytics-feeding.spec.ts` (6 tests)
Tests feeding analytics:
- Feeding schedule timeline visualization
- pH trend chart with optimal range (5.5-6.5)
- EC (Electrical Conductivity) trend chart
- Parameter visibility toggling
- CSV export

#### 4. `analytics-yield.spec.ts` (6 tests)
Tests yield analytics:
- Yield comparison bar charts
- Quality distribution visualization
- Top performers list
- Cultivar filtering
- CSV export

#### 5. `analytics-comparison.spec.ts` (8 tests)
Tests cultivar comparison features:
- Navigation and cultivar selection (2-4 cultivars)
- Comparison table rendering
- Radar chart with multiple axes
- Yield bar chart comparison
- Validation for single cultivar selection (error)
- Validation for 5+ cultivar selection (error)
- CSV export

#### 6. `analytics-timeline.spec.ts` (7 tests)
Tests timeline visualization:
- Timeline page navigation
- Chronological event rendering
- Event type filtering
- Event detail modal interaction
- Modal close functionality
- Photo timeline with images
- Time range filtering

#### 7. `analytics-performance.spec.ts` (5 tests)
Tests performance benchmarks:
- Dashboard page load time (<2 seconds target, <5s allowed)
- Chart render time (<1 second target, <3s allowed)
- Time range change response time
- React Query caching effectiveness
- Memory leak detection (10 page navigations)

#### 8. `analytics-errors.spec.ts` (5 tests)
Tests error handling:
- API error simulation and error message display
- Empty data state handling
- Invalid grow ID (404) handling
- Offline mode handling
- Rapid navigation without crashes

#### 9. `analytics-accessibility.spec.ts` (5 tests)
Tests accessibility compliance:
- Keyboard-only navigation (Tab, Enter, Escape)
- Chart aria-labels verification
- WCAG AA compliance (axe-core)
- Color contrast requirements
- Focus indicator visibility

## Running the Tests

### Prerequisites

```bash
cd growmanager-ui
npm install
```

Ensure the development server can start:
```bash
npm run dev
```

### Run All Tests

```bash
npm run test:e2e
```

Or using Playwright directly:
```bash
npx playwright test
```

### Run Specific Test File

```bash
# Run only dashboard tests
npx playwright test analytics-dashboard

# Run only performance tests
npx playwright test analytics-performance

# Run only accessibility tests
npx playwright test analytics-accessibility
```

### Run on Specific Browser

```bash
# Chrome only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Safari (WebKit) only
npx playwright test --project=webkit

# Mobile only
npx playwright test --project=mobile

# Tablet only
npx playwright test --project=tablet
```

### Run in Debug Mode

```bash
# Debug mode with browser visible
npx playwright test --debug

# Debug specific test
npx playwright test analytics-dashboard --debug
```

### View Test Report

```bash
# Generate and open HTML report
npx playwright show-report
```

## Test Utilities and Helpers

All tests use shared helper functions from `e2e/utils/analyticsHelpers.ts`:

- `navigateToAnalyticsPage()` - Navigate and wait for page load
- `waitForChartToRender()` - Wait for Recharts to render
- `selectGrow()` - Select grow from dropdown
- `selectCultivars()` - Select multiple cultivars
- `selectTimeRange()` - Change time range filter
- `toggleParameter()` - Toggle chart parameters
- `exportToCSV()` - Test CSV export
- `verifyChartHasData()` - Verify chart contains data
- `verifyErrorMessage()` - Check error handling
- `verifyEmptyState()` - Check empty state display
- `measurePageLoadTime()` - Performance measurement
- `measureChartRenderTime()` - Chart render performance
- `testKeyboardNavigation()` - Accessibility testing

Test data fixtures are in `e2e/fixtures/analyticsTestData.ts`.

## Performance Benchmarks

### Target Performance Metrics

| Metric | Target | Allowed (CI) | Description |
|--------|--------|--------------|-------------|
| Dashboard Load | <2s | <5s | Initial dashboard page load |
| Chart Render | <1s | <3s | Time to render all charts |
| Time Range Change | <500ms | <2s | Response to filter changes |
| API Response | <2s | <5s | Backend analytics API calls |

### Memory Leak Testing

The performance test suite includes a memory leak detection test that:
- Navigates between 4 different analytics pages
- Repeats navigation 10 times
- Monitors JavaScript heap usage
- Warns if heap usage exceeds 90%

## Browser Compatibility Matrix

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome | ✓ | ✓ | Full support |
| Firefox | ✓ | - | Full support |
| Safari (WebKit) | ✓ | ✓ | Full support |
| Edge | ✓ | - | Same as Chrome |

### Known Browser-Specific Issues

- **WebKit (Safari)**: Focus indicators may appear differently but are functionally equivalent
- **Mobile**: Touch targets are tested to ensure adequate size (44x44px minimum)

## Accessibility Compliance

### WCAG AA Standards

All analytics pages are tested for:
- **Color Contrast**: Text meets 4.5:1 ratio requirement
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Charts have proper aria-labels
- **Focus Indicators**: All focusable elements have visible focus states

### Accessibility Testing Tools

- **axe-core**: Automated WCAG 2.1 AA compliance testing
- **Playwright Accessibility**: Built-in accessibility testing

### Common Accessibility Patterns

```typescript
// Charts should have aria-labels
<svg role="img" aria-label="Temperature trend over time">

// Interactive elements should be keyboard accessible
<button tabindex="0" aria-label="Export to CSV">

// Focus indicators should be visible
button:focus-visible {
  outline: 2px solid #3b82f6;
}
```

## CI/CD Integration

### GitHub Actions Configuration

The tests are designed to run in CI/CD environments with:
- **Retries**: 2 automatic retries on failure
- **Workers**: 1 worker in CI (sequential execution)
- **Screenshots**: Captured on failure
- **Traces**: Recorded on first retry
- **HTML Report**: Generated for all runs

### CI-Specific Adjustments

- Increased timeout allowances (5s vs 2s for page loads)
- Network idle waiting for stability
- Automatic screenshot capture on failures
- Trace files for debugging

### Example GitHub Actions Usage

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e

- name: Upload Test Report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

## Known Issues and Limitations

### Current Limitations

1. **API Mocking**: Some tests rely on actual API responses; full MSW mocking not yet implemented
2. **Test Data Dependency**: Tests may fail if test database is not seeded
3. **Chart Internals**: Tests check for Recharts classes which may change with library updates
4. **Performance Variance**: CI environments may have slower performance than targets

### Workarounds

1. **Flexible Assertions**: Tests use flexible timeouts and graceful degradation
2. **Fallback Checks**: Multiple ways to verify functionality
3. **Resilient Selectors**: Tests use multiple selector strategies
4. **Environment Detection**: Different thresholds for CI vs local

## Maintenance Guidelines

### Updating Tests

When analytics features change:

1. **Update Test Data**: Modify `e2e/fixtures/analyticsTestData.ts`
2. **Update Helpers**: Add new helpers to `e2e/utils/analyticsHelpers.ts`
3. **Update Assertions**: Adjust test expectations in relevant spec files
4. **Update Documentation**: Keep this file current

### Adding New Tests

Template for new analytics test:

```typescript
import { test, expect } from '@playwright/test';
import { navigateToAnalyticsPage } from '../utils/analyticsHelpers';

test.describe('New Feature Tests', () => {
  test('should test new feature', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/new-feature');

    // Wait for content
    await page.waitForTimeout(1000);

    // Verify feature
    const feature = page.locator('[data-testid="new-feature"]');
    await expect(feature).toBeVisible();
  });
});
```

### Test Naming Conventions

- Use descriptive test names: `should [action] and verify [result]`
- Group related tests in `describe` blocks
- Use consistent file naming: `analytics-[feature].spec.ts`

## Troubleshooting

### Common Issues

**Tests timing out:**
- Increase timeout in test: `{ timeout: 10000 }`
- Check if dev server is running
- Verify network connectivity

**Charts not rendering:**
- Wait longer for networkidle: `await page.waitForLoadState('networkidle')`
- Check for JavaScript errors in console
- Verify Recharts is installed

**Accessibility tests failing:**
- Review specific axe-core violation messages
- Check if new components have proper aria-labels
- Verify color contrast with browser dev tools

**Performance tests failing in CI:**
- CI environments are slower - adjust thresholds
- Check for memory leaks with Chrome DevTools
- Profile with Playwright trace viewer

### Debug Commands

```bash
# Run with headed browser
npx playwright test --headed

# Run with slow motion
npx playwright test --headed --slow-mo=1000

# Open trace viewer
npx playwright show-trace trace.zip

# Generate coverage report
npx playwright test --reporter=html
```

## Future Improvements

### Planned Enhancements

1. **Visual Regression Testing**: Add screenshot comparison tests
2. **API Mocking**: Complete MSW integration for all API calls
3. **Test Data Factory**: Create test data builder pattern
4. **Parallel Execution**: Optimize for faster CI runs
5. **Cross-Browser Testing**: Add more browser configurations
6. **Performance Budgets**: Enforce strict performance requirements

### Metrics to Track

- Test execution time
- Test flakiness rate
- Code coverage percentage
- Accessibility score trends
- Performance metric trends

## Support and Resources

### Documentation
- [Playwright Documentation](https://playwright.dev)
- [Recharts Documentation](https://recharts.org)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Internal Resources
- Project README: `/README.md`
- Component Documentation: `/docs/components.md`
- API Documentation: `http://localhost:8080/swagger-ui.html`

## Conclusion

This comprehensive E2E test suite ensures the GrowManager Analytics feature is:
- Functionally correct across all analytics pages
- Performant with sub-2-second load times
- Accessible to all users (WCAG AA compliant)
- Robust with proper error handling
- Compatible across major browsers and devices

The test suite provides confidence for continuous deployment and serves as living documentation of expected system behavior.