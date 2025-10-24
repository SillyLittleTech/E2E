# E2E Testing Suite (Screenshots & Accessibility)

A comprehensive GitHub Action that automatically captures screenshots of your website in multiple modes (web/mobile, light/dark) and performs accessibility testing using Playwright.

## 🌟 Features

- **📸 Automatic Screenshot Capture**: Takes screenshots in web and mobile viewports
- **🌓 Light & Dark Mode Support**: Captures both light and dark theme variations
- **♿ Accessibility Testing**: Runs Axe accessibility tests to ensure WCAG compliance
- **📊 GitHub Pages Integration**: Publishes screenshots to GitHub Pages with preview URLs
- **💬 PR Comments**: Automatically posts screenshots directly in pull request comments
- **🔄 Concurrency Control**: Smart concurrency management for PRs and main branch
- **🍴 Fork-Friendly**: Special handling for forked repository PRs
- **📦 Artifact Archiving**: Uploads test results and reports as workflow artifacts

## 🚀 Usage

### Option 1: Use as a GitHub Action (Recommended)

Add this to your workflow file (`.github/workflows/e2e.yml`):

```yaml
name: E2E Tests

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run E2E Tests
        uses: SillyLittleTech/E2E@v1
        with:
          port: '4173'
          node-version: '20'
          build-command: 'npm run build'
          preview-command: 'npm run preview'
```

### Option 2: Copy the Complete Workflow

### Option 2: Copy the Complete Workflow

For more control and GitHub Pages integration, copy the full workflow file to your repository:

1. **Copy the workflow file** to your repository:
   ```
   .github/workflows/e2e-testing.yml
   ```

2. **Set up required dependencies** in your project:
   ```bash
   npm install --save-dev playwright @axe-core/playwright wait-on
   ```

3. **Create Playwright test files** in your repository:
   - `tests/e2e.spec.ts` - For screenshot capture tests
   - `tests/a11y.spec.ts` - For accessibility tests

4. **Configure your `package.json`** with required scripts:
   ```json
   {
     "scripts": {
       "build": "your-build-command",
       "preview": "your-preview-server-command"
     }
   }
   ```

5. **Enable GitHub Pages** in your repository settings:
   - Go to Settings > Pages
   - Source: GitHub Actions

### Prerequisites

Before using this action, ensure your project has:

- **Node.js project** with `package.json`
- **Build script** defined (e.g., `npm run build`)
- **Preview server script** defined (e.g., `npm run preview`)
- **Playwright tests** in your repository

Install required dependencies:
```bash
npm install --save-dev playwright @axe-core/playwright wait-on
```

## 📋 Action Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `port` | Port for the preview server and Playwright tests | No | `4173` |
| `node-version` | Node.js version to use | No | `20` |
| `build-command` | Command to build the site | No | `npm run build` |
| `preview-command` | Command to start the preview server | No | `npm run preview` |
| `test-files` | Playwright test files to run (space-separated) | No | `tests/e2e.spec.ts tests/a11y.spec.ts` |
| `screenshot-prefix` | Prefix for screenshot filenames | No | `portfolio` |

### Example with Custom Inputs

```yaml
- name: Run E2E Tests
  uses: SillyLittleTech/E2E@v1
  with:
    port: '3000'
    node-version: '18'
    build-command: 'npm run build:prod'
    preview-command: 'npm run serve'
    test-files: 'tests/*.spec.ts'
    screenshot-prefix: 'my-app'
```

## 📝 Example Playwright Test Files

#### `tests/e2e.spec.ts` (Screenshot Capture)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Screenshot Capture', () => {
  test('capture web light mode', async ({ page }) => {
    await page.goto('http://localhost:4173');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.screenshot({ 
      path: 'playwright-logs/portfolio-web-light.png',
      fullPage: true 
    });
  });

  test('capture web dark mode', async ({ page }) => {
    await page.goto('http://localhost:4173');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({ 
      path: 'playwright-logs/portfolio-web-dark.png',
      fullPage: true 
    });
  });

  test('capture mobile light mode', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:4173');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.screenshot({ 
      path: 'playwright-logs/portfolio-mobile-light.png',
      fullPage: true 
    });
  });

  test('capture mobile dark mode', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:4173');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({ 
      path: 'playwright-logs/portfolio-mobile-dark.png',
      fullPage: true 
    });
  });
});
```

#### `tests/a11y.spec.ts` (Accessibility Testing)
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('http://localhost:4173');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // Save report
    fs.writeFileSync('axe-report.json', JSON.stringify(accessibilityScanResults, null, 2));
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4173` | Port for the preview server and Playwright tests |

You can customize the port by modifying the `env` section in the workflow:

```yaml
env:
  PORT: 4173  # Change to your preferred port
```

### Workflow Triggers

The workflow is triggered on:
- **Push to main branch**: Runs tests and publishes to GitHub Pages
- **Pull requests**: Runs tests, posts screenshots as PR comments

```yaml
on:
  push:
    branches:
      - main
  pull_request:
```

### Required Permissions

The workflow requires the following permissions:

```yaml
permissions:
  contents: write       # needed to push to gh-pages
  pages: write          # deploy with actions/deploy-pages
  id-token: write       # required by actions/deploy-pages
  pull-requests: write  # comment on PRs
  issues: write         # comment on issues
```

### Concurrency Groups

The workflow uses smart concurrency management:

- **Pull Requests**: Each PR gets its own concurrency group (`e2e-pr-{PR_NUMBER}`)
- **Main Branch**: Uses the branch ref as concurrency group (`e2e-{REF}`)
- **Cancel in Progress**: Disabled to allow tests to complete

```yaml
concurrency:
  group: ${{ github.event_name == 'pull_request' && format('e2e-pr-{0}', github.event.pull_request.number) || format('e2e-{0}', github.ref) }}
  cancel-in-progress: false
```

## 📁 Output Structure

### Screenshot Locations

Screenshots are saved in the following structure:

**For Pull Requests:**
```
/(Dev-Shots)/PR-{PR_NUMBER}/
  ├── portfolio-web-light.png
  ├── portfolio-web-dark.png
  ├── portfolio-mobile-light.png
  └── portfolio-mobile-dark.png
```

**For Main Branch:**
```
/(Dev-Shots)/screenshots/{RUN_ID}/
  ├── portfolio-web-light.png
  ├── portfolio-web-dark.png
  ├── portfolio-mobile-light.png
  └── portfolio-mobile-dark.png
```

### Artifacts

The workflow uploads the following artifacts:

- `e2e-test-results` containing:
  - All screenshot PNG files
  - Playwright HTML report (`playwright-report/**`)
  - Axe accessibility report (`axe-report.json`)

## 📝 Workflow Behavior

### For Pull Requests (Same Repository)

1. Runs E2E and accessibility tests
2. Captures screenshots in all modes
3. Publishes screenshots to GitHub Pages with preview URL
4. Posts an inline comment on the PR with embedded screenshots
5. Updates the comment on subsequent commits

### For Pull Requests (Forked Repository)

1. Runs E2E and accessibility tests
2. Captures screenshots in all modes
3. Uploads screenshots as workflow artifacts
4. Posts a comment with link to workflow run summary
5. ⚠️ **Note**: Cannot publish to GitHub Pages due to token restrictions

### For Main Branch Pushes

1. Runs E2E and accessibility tests
2. Captures screenshots in all modes
3. Publishes screenshots to GitHub Pages
4. Adds links to job summary

## 🎯 Customization

### Changing Screenshot Names

Modify the file names in the workflow:

```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    name: e2e-test-results
    path: |
      playwright-logs/your-custom-name-light.png
      playwright-logs/your-custom-name-dark.png
```

### Changing Node Version

Update the Node.js version:

```yaml
- name: Use Node
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change to your preferred version
```

### Adding Custom Test Files

Add more test files to the Playwright test command:

```yaml
- name: Run Playwright tests
  run: |
    npx playwright test tests/e2e.spec.ts tests/a11y.spec.ts tests/custom.spec.ts
```

### Customizing Build and Preview Commands

Update the commands to match your project:

```yaml
- name: Build site
  run: npm run build  # Change to your build command

- name: Start preview server
  run: npm run preview -- --port $PORT &  # Change to your preview command
```

## 🔍 Troubleshooting

### Screenshots Not Generated

- Ensure your Playwright tests save screenshots to `playwright-logs/` directory
- Check that the file names match the expected pattern
- Verify the preview server is running on the correct port

### Preview Server Not Starting

- Ensure your `package.json` has a `preview` script
- Check that the port is not already in use
- Verify the build output is in the correct location

### Accessibility Tests Failing

- Review the `axe-report.json` artifact for violation details
- Fix accessibility issues in your application
- Temporarily adjust Axe rules if needed (but fix issues ASAP)

### PR Comments Not Appearing

- Verify workflow has `pull-requests: write` permission
- Check that the workflow completed successfully
- For forked PRs, comments are limited - check workflow artifacts

### GitHub Pages Not Deploying

- Enable GitHub Pages in repository settings
- Ensure workflow has required permissions (`pages: write`, `id-token: write`)
- Check the Pages settings are set to "GitHub Actions" as source

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Axe Core Playwright Integration](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

## 📄 License

See [LICENSE](LICENSE) file for details.
