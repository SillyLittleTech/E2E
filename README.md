# E2E Testing Suite (Screenshots, Accessibility & Unit Tests)

A comprehensive GitHub Action that automatically captures screenshots of your website across multiple custom viewports and modes (light/dark), performs accessibility testing, runs unit tests, and formats a beautiful rich Markdown report on Pull Requests.

## 🌟 Features

- **📸 Dynamic Screenshot Capture**: Take screenshots across any viewports (mobile, tablet, desktop, TV, etc.).
- **🔗 Page & Anchor Navigation**: Automatically navigates to multiple pages and scrolls to specific element anchors.
- **🌓 Auto Light & Dark Mode Support**: Attempts to find and click theme toggles on your page, and falls back to system dark mode if none are found.
- **🧪 Unit Test Integration**: Run your unit tests and optionally report their success/failure directly in the summary.
- **♿ Accessibility Testing**: Runs Axe accessibility tests to ensure WCAG compliance on all captured pages.
- **💬 Rich PR Comments**: Automatically generates customizable summary with images in `<details>` blocks.
- **📦 Zero-Config Playwright**: No need to write or maintain Playwright tests in your repository—the action handles all test generation dynamically!

## 🚀 Usage

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
        uses: SillyLittleTech/E2E@v2.7.3
        with:
          port: '4173'
          node-version: '20'
          build-command: 'npm run build'
          preview-command: 'npm run preview'
          config-file: 'e2e-config.json'
```

### Configuration (`e2e-config.json`)

To unlock the full potential of this action, create an `e2e-config.json` file in the root of your repository. If you don't provide one, a default configuration will capture the main page in web and mobile viewports.

Here is an example showcasing all the available features:

```json
{
  "pages": [
    { "path": "/", "anchors": ["#hero", "#footer"] },
    { "path": "/about", "anchors": [] },
    { "path": "/contact", "anchors": ["#contact-form"] }
  ],
  "viewports": {
    "web": { "width": 1280, "height": 720 },
    "tablet": { "width": 768, "height": 1024 },
    "mobile": { "width": 375, "height": 667 },
    "tv": { "width": 1920, "height": 1080 }
  },
  "unitTests": {
    "run": true,
    "command": "npm run test"
  },
  "formatting": {
    "customCommentText": "Here are your automated testing results! Please review any visual changes.",
    "useDetailsBlocks": true
  },
  "themeToggleSelectors": [
    ".theme-toggle",
    "[aria-label='Toggle dark mode']",
    "#dark-mode-switch"
  ]
}
```

#### Configuration Options

- **`pages`**: An array of page objects.
  - `path`: The route to visit (e.g., `/` or `/about`).
  - `anchors`: An array of CSS selectors (e.g., `#hero`). The script will scroll to each anchor and capture screenshots.
- **`viewports`**: Key-value pairs defining the screen sizes to test. You can name these whatever you like (e.g., `web`, `tablet`, `tv`).
- **`unitTests`**:
  - `run`: Boolean. Set to `true` to run unit tests.
  - `command`: The command to run your tests (e.g., `npm run test` or `npm run test:ci`). The output will be appended to the PR comment.
- **`formatting`**:
  - `customCommentText`: Optional text to prepend to the generated summary.
  - `useDetailsBlocks`: Set to `true` to wrap screenshots and logs in HTML `<details>` blocks to keep the PR comment clean. Set to `false` for a flat layout.
- **`themeToggleSelectors`**: An array of CSS selectors to try clicking to toggle dark mode. If the script cannot find any of these elements, it will fall back to using `emulateMedia({ colorScheme: 'dark' })`.

### Prerequisites

Before using this action, ensure your project has:

- **Node.js project** with `package.json`
- **Build script** defined (e.g., `npm run build`)
- **Preview server script** defined (e.g., `npm run preview`)

Install required dependencies:
```bash
npm install --save-dev playwright @axe-core/playwright
```

## 📋 Action Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `port` | Port for the preview server and Playwright tests | No | `4173` |
| `node-version` | Node.js version to use | No | `20` |
| `build-command` | Command to build the site | No | `npm run build` |
| `preview-command` | Command to start the preview server | No | `npm run preview` |
| `config-file` | Path to E2E configuration JSON file | No | `e2e-config.json` |

## 📁 Output Structure

The workflow uploads a single artifact named `e2e-test-results` which contains:

- `playwright-logs/` - All generated screenshot PNG files.
- `playwright-report/` - The detailed Playwright HTML report.
- `axe-report.json` - The raw data of the accessibility violations.
- `e2e-summary.md` - The raw markdown generated for the summary.

## 📝 Workflow Behavior

1. **Unit Tests (Optional)**: Runs the command specified in `e2e-config.json`. Captures logs and success/failure state.
2. **Setup**: Builds the application and starts the preview server.
3. **Dynamic Playwright Script**: Reads the `e2e-config.json`, generates a dynamic test runner, and executes it.
4. **Screenshots & Anchors**: For each viewport and page, takes full-page screenshots in light/dark mode. Scrolls to any specified anchors and captures them in both modes.
5. **Accessibility**: Runs Axe accessibility checks on all pages.
6. **Report Generation**: Dynamically formats a beautiful Markdown report based on your layout preferences.
7. **Publishing**: Appends the summary to the GitHub Job Summary.

## 📄 License

See [LICENSE](LICENSE) file for details.
