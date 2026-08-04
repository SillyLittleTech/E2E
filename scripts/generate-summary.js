const fs = require('fs');
const path = require('path');

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

const formatting = config.formatting || { useDetailsBlocks: true, customCommentText: "" };
let summary = "";

if (formatting.customCommentText) {
  summary += `${formatting.customCommentText}\n\n`;
}

// Unit Tests
if (config.unitTests && config.unitTests.run && fs.existsSync('unit-test-results.txt')) {
  const results = fs.readFileSync('unit-test-results.txt', 'utf8');
  const lines = results.trim().split('\n');
  const status = lines.pop(); // SUCCESS or FAILURE
  const output = lines.join('\n');

  summary += `## Unit Tests: ${status === 'SUCCESS' ? '✅ Passed' : '❌ Failed'}\n\n`;
  if (formatting.useDetailsBlocks) {
    summary += `<details>\n<summary>View Output</summary>\n\n`;
  }
  summary += `\`\`\`\n${output}\n\`\`\`\n\n`;
  if (formatting.useDetailsBlocks) {
    summary += `</details>\n\n`;
  }
}

// Screenshots
summary += `## Visual Regression Results\n\n`;

const logDir = 'playwright-logs';
if (fs.existsSync(logDir)) {
  const files = fs.readdirSync(logDir).filter(f => f.endsWith('.png'));

  if (files.length === 0) {
    summary += `⚠️ No screenshots were generated.\n\n`;
  } else {
    const viewportsToProcess = Object.keys(config.viewports || { web: 1, mobile: 1 });
    const pagesToProcess = config.pages || [{ path: '/', anchors: [] }];

    for (const viewport of viewportsToProcess) {
      let viewportSummary = '';

      for (const pageConfig of pagesToProcess) {
        let pageSummary = '';
        const pagePath = pageConfig.path.startsWith('/') ? pageConfig.path : `/${pageConfig.path}`;
        const safePath = pagePath === '/' ? 'index' : pagePath.replace(/\//g, '-').replace(/^-/, '');

        const anchors = [''].concat(pageConfig.anchors || []); // '' means top of page

        for (const anchor of anchors) {
          const safeAnchor = anchor ? anchor.replace(/^#/, '') : '';

          const expectedLight = `${viewport}-${safePath}${safeAnchor ? `-${safeAnchor}` : ''}-light.png`;
          const expectedDark = `${viewport}-${safePath}${safeAnchor ? `-${safeAnchor}` : ''}-dark.png`;

          const hasLight = fs.existsSync(path.join(logDir, expectedLight));
          const hasDark = fs.existsSync(path.join(logDir, expectedDark));

          if (hasLight || hasDark) {
            pageSummary += `**Section**: ${anchor === '' ? 'Full Page' : `\`${anchor}\``}\n\n`;
            pageSummary += `| Light Mode | Dark Mode |\n`;
            pageSummary += `| :---: | :---: |\n`;

            const lightImg = hasLight ? `![Light](${logDir}/${expectedLight})` : 'N/A';
            const darkImg = hasDark ? `![Dark](${logDir}/${expectedDark})` : 'N/A';

            pageSummary += `| ${lightImg} | ${darkImg} |\n\n`;
          }
        }

        if (pageSummary) {
          if (formatting.useDetailsBlocks) {
            viewportSummary += `<details>\n<summary>Page: <code>${pagePath}</code></summary>\n\n${pageSummary}</details>\n\n`;
          } else {
            viewportSummary += `#### Page: \`${pagePath}\`\n\n${pageSummary}`;
          }
        }
      }

      if (viewportSummary) {
        summary += `### Viewport: \`${viewport}\`\n\n${viewportSummary}`;
      }
    }
  }
} else {
  summary += `⚠️ Screenshot directory not found.\n\n`;
}

// Accessibility
summary += `## Accessibility (a11y) Results\n\n`;
if (fs.existsSync('axe-report.json')) {
  const axeData = JSON.parse(fs.readFileSync('axe-report.json', 'utf8'));
  if (axeData.length === 0) {
    summary += `✅ No automatically detectable accessibility issues found.\n\n`;
  } else {
    summary += `❌ Found accessibility issues:\n\n`;
    if (formatting.useDetailsBlocks) {
      summary += `<details>\n<summary>View Violations</summary>\n\n`;
    }
    for (const report of axeData) {
      summary += `**Page**: \`${report.page}\`\n`;
      for (const violation of report.violations) {
        summary += `- **${violation.id}**: ${violation.description}\n`;
        summary += `  - Impact: ${violation.impact}\n`;
        summary += `  - Help: [${violation.help}](${violation.helpUrl})\n`;
      }
      summary += `\n`;
    }
    if (formatting.useDetailsBlocks) {
      summary += `</details>\n\n`;
    }
  }
} else {
  summary += `⚠️ Accessibility report not found.\n\n`;
}

fs.writeFileSync('e2e-summary.md', summary);
console.log('Markdown summary generated.');