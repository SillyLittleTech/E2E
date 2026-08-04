const fs = require('fs');
const { execSync } = require('child_process');

function run() {
  const userConfigPath = process.argv[2];
  const defaultConfigPath = process.argv[3];

  let config = {};
  if (fs.existsSync(defaultConfigPath)) {
    config = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
  }

  if (fs.existsSync(userConfigPath)) {
    const userConfig = JSON.parse(fs.readFileSync(userConfigPath, 'utf8'));
    config = { ...config, ...userConfig };
  }

  if (config.unitTests && config.unitTests.run) {
    console.log(`Running unit tests: ${config.unitTests.command}`);
    try {
      const output = execSync(config.unitTests.command, { stdio: 'pipe' });
      fs.writeFileSync('unit-test-results.txt', output.toString() + "\nSUCCESS");
      console.log('Unit tests passed.');
    } catch (error) {
      console.error('Unit tests failed.');
      fs.writeFileSync('unit-test-results.txt', (error.stdout ? error.stdout.toString() : '') + (error.stderr ? error.stderr.toString() : '') + "\nFAILURE");
      // Don't exit with error here so E2E tests still run and report everything
    }
  } else {
    console.log('Unit tests not enabled or not configured.');
  }
}

run();