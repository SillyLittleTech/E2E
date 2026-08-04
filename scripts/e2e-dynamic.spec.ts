import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

// Read configuration
const configPath = process.env.E2E_CONFIG_PATH || 'e2e-config.json';
const defaultConfigPath = process.env.DEFAULT_CONFIG_PATH || 'scripts/default-config.json';

let config = {};
if (fs.existsSync(defaultConfigPath)) {
  config = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
}
if (fs.existsSync(configPath)) {
  const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config = { ...config, ...userConfig };
}

const pages = config.pages || [{ path: '/', anchors: [] }];
const viewports = config.viewports || {
  web: { width: 1280, height: 720 },
  mobile: { width: 375, height: 667 }
};
const themeToggleSelectors = config.themeToggleSelectors || [".theme-toggle", "[aria-label='Toggle dark mode']"];
const port = process.env.PORT || '4173';
const baseUrl = `http://localhost:${port}`;

test.describe('Dynamic E2E Tests', () => {
  for (const [viewportName, viewportSize] of Object.entries(viewports)) {
    test.describe(`Viewport: ${viewportName}`, () => {
      test.use({ viewport: viewportSize });

      for (const pageConfig of pages) {
        test(`Page: ${pageConfig.path}`, async ({ page }) => {
          const pagePath = pageConfig.path.startsWith('/') ? pageConfig.path : `/${pageConfig.path}`;
          const safePath = pagePath === '/' ? 'index' : pagePath.replace(/\//g, '-').replace(/^-/, '');

          // Helper to save screenshot
          const saveScreenshot = async (name, suffix) => {
            const filename = `playwright-logs/${viewportName}-${safePath}${name ? `-${name}` : ''}-${suffix}.png`;
            await page.screenshot({ path: filename, fullPage: true });
          };

          // Light mode
          await page.goto(`${baseUrl}${pagePath}`);
          await page.waitForLoadState('networkidle');
          await page.emulateMedia({ colorScheme: 'light' });
          await saveScreenshot('', 'light');

          // Dark mode
          let toggleFound = false;
          for (const selector of themeToggleSelectors) {
            const toggle = await page.$(selector);
            if (toggle) {
              await toggle.click();
              toggleFound = true;
              break;
            }
          }
          if (!toggleFound) {
            await page.emulateMedia({ colorScheme: 'dark' });
          }
          // wait a bit for transition
          await page.waitForTimeout(500);
          await saveScreenshot('', 'dark');

          // Anchors
          const anchors = pageConfig.anchors || [];
          for (const anchor of anchors) {
            const safeAnchor = anchor.replace(/^#/, '');

            // Go to light mode first for this anchor
            await page.emulateMedia({ colorScheme: 'light' });
            if (toggleFound) {
                // Try to reset to light mode if toggle was used.
                // A simple reload + emulate should do for most sites.
                await page.reload();
                await page.waitForLoadState('networkidle');
                await page.emulateMedia({ colorScheme: 'light' });
            }

            // Scroll to anchor
            try {
              const element = await page.locator(anchor).first();
              await element.scrollIntoViewIfNeeded();
              await page.waitForTimeout(500); // wait for scroll
              await saveScreenshot(safeAnchor, 'light');
            } catch (e) {
              console.warn(`Could not find anchor ${anchor} on ${pagePath}`);
              continue;
            }

            // Toggle to dark mode for anchor
            toggleFound = false;
            for (const selector of themeToggleSelectors) {
              const toggle = await page.$(selector);
              if (toggle) {
                await toggle.click();
                toggleFound = true;
                break;
              }
            }
            if (!toggleFound) {
              await page.emulateMedia({ colorScheme: 'dark' });
            }
            await page.waitForTimeout(500);
            await saveScreenshot(safeAnchor, 'dark');
          }
        });
      }
    });
  }
});

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues on main pages', async ({ page }) => {
    const allViolations = [];

    for (const pageConfig of pages) {
      const pagePath = pageConfig.path.startsWith('/') ? pageConfig.path : `/${pageConfig.path}`;
      await page.goto(`${baseUrl}${pagePath}`);

      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

      if (accessibilityScanResults.violations.length > 0) {
        allViolations.push({
          page: pagePath,
          violations: accessibilityScanResults.violations
        });
      }
    }

    // Save report
    fs.writeFileSync('axe-report.json', JSON.stringify(allViolations, null, 2));

    expect(allViolations).toEqual([]);
  });
});
