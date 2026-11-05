const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['json', { outputFile: 'e2e-results.json' }], ['list']],
  use: {
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
});
