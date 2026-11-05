const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const appUrl = pathToFileURL(path.resolve(__dirname, '../index.html')).href;

function captureBrowserIssues(page) {
  const browserIssues = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      browserIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => browserIssues.push(`pageerror: ${error.message}`));
  return browserIssues;
}

test('task lifecycle is deterministic and produces no browser errors', async ({ page }) => {
  const browserIssues = captureBrowserIssues(page);

  await page.goto(appUrl);
  await expect(page.getByRole('heading', { name: 'Todo App' })).toBeVisible();
  await expect(page.getByTestId('todo-list')).toBeEmpty();
  await expect(page.getByTestId('empty-state')).toHaveText('No tasks yet.');
  await expect(page.getByTestId('empty-state')).toBeVisible();
  await page.screenshot({ path: 'test-results/todo-empty.png', fullPage: true });

  const input = page.getByTestId('todo-input');
  await input.fill('  Buy milk  ');
  await page.getByTestId('add-button').click();
  await expect(page.getByTestId('todo-item-1')).toBeVisible();
  await expect(page.getByTestId('todo-title-1')).toHaveText('Buy milk');
  await expect(input).toHaveValue('');
  await expect(page.getByTestId('empty-state')).toBeHidden();
  await page.screenshot({ path: 'test-results/todo-populated.png', fullPage: true });

  await input.fill('Walk dog');
  await input.press('Enter');
  await expect(page.getByTestId('todo-item-2')).toBeVisible();
  await expect(page.getByTestId('todo-title-2')).toHaveText('Walk dog');
  await expect(page.getByTestId('todo-list').locator('li')).toHaveCount(2);
  await expect(page.getByTestId('todo-item-1').locator('input')).toBeVisible();
  await expect(page.getByTestId('todo-item-2').locator('input')).toBeVisible();

  await input.fill('   ');
  await page.getByTestId('add-button').click();
  await expect(page.getByTestId('todo-list').locator('li')).toHaveCount(2);
  await expect(input).toHaveValue('   ');
  await input.fill('   ');
  await input.press('Enter');
  await expect(page.getByTestId('todo-list').locator('li')).toHaveCount(2);
  await input.fill('');
  await input.press('Enter');
  await expect(page.getByTestId('todo-list').locator('li')).toHaveCount(2);

  const firstCheckbox = page.getByTestId('todo-checkbox-1');
  const firstTitle = page.getByTestId('todo-title-1');
  await firstCheckbox.check();
  await expect(firstTitle).toHaveCSS('text-decoration-line', 'line-through');
  await expect(page.getByTestId('todo-checkbox-2')).not.toBeChecked();
  await firstCheckbox.uncheck();
  await expect(firstTitle).not.toHaveCSS('text-decoration-line', 'line-through');

  await page.getByTestId('todo-delete-1').click();
  await expect(page.getByTestId('todo-item-1')).toHaveCount(0);
  await expect(page.getByTestId('todo-title-2')).toHaveText('Walk dog');
  await page.getByTestId('todo-delete-2').click();
  await expect(page.getByTestId('todo-list')).toBeEmpty();
  await expect(page.getByTestId('empty-state')).toBeVisible();
  await expect(page.getByTestId('empty-state')).toHaveText('No tasks yet.');
  expect(browserIssues).toEqual([]);
});

test('creation trims valid text and rejects blank input from both triggers', async ({ page }) => {
  const browserIssues = captureBrowserIssues(page);
  await page.goto(appUrl);
  const input = page.getByTestId('todo-input');

  await input.fill('   ');
  await page.getByTestId('add-button').click();
  await expect(page.getByTestId('todo-list')).toBeEmpty();
  await expect(page.getByTestId('empty-state')).toBeVisible();

  await input.fill('   ');
  await input.press('Enter');
  await expect(page.getByTestId('todo-list')).toBeEmpty();

  await input.fill('  x  ');
  await input.press('Enter');
  await expect(page.getByTestId('todo-title-1')).toHaveText('x');
  await expect(input).toHaveValue('');
  expect(browserIssues).toEqual([]);
});

test('completion toggles independently and restores the incomplete style', async ({ page }) => {
  const browserIssues = captureBrowserIssues(page);
  await page.goto(appUrl);
  const input = page.getByTestId('todo-input');
  await input.fill('First');
  await page.getByTestId('add-button').click();
  await input.fill('Second');
  await page.getByTestId('add-button').click();

  await page.getByTestId('todo-checkbox-1').check();
  await expect(page.getByTestId('todo-title-1')).toHaveCSS('text-decoration-line', 'line-through');
  await expect(page.getByTestId('todo-checkbox-2')).not.toBeChecked();
  await page.getByTestId('todo-checkbox-1').uncheck();
  await expect(page.getByTestId('todo-title-1')).not.toHaveCSS('text-decoration-line', 'line-through');
  expect(browserIssues).toEqual([]);
});

test('deletion removes only the selected task and restores the empty state', async ({ page }) => {
  const browserIssues = captureBrowserIssues(page);
  await page.goto(appUrl);
  const input = page.getByTestId('todo-input');
  await input.fill('Keep');
  await page.getByTestId('add-button').click();
  await input.fill('Remove');
  await page.getByTestId('add-button').click();

  await page.getByTestId('todo-delete-2').click();
  await expect(page.getByTestId('todo-item-2')).toHaveCount(0);
  await expect(page.getByTestId('todo-title-1')).toHaveText('Keep');
  await page.getByTestId('todo-delete-1').click();
  await expect(page.getByTestId('todo-list')).toBeEmpty();
  await expect(page.getByTestId('empty-state')).toHaveText('No tasks yet.');
  await expect(page.getByTestId('empty-state')).toBeVisible();

  await input.fill('After deletion');
  await page.getByTestId('add-button').click();
  await expect(page.getByTestId('todo-item-3')).toBeVisible();
  await expect(page.getByTestId('todo-title-3')).toHaveText('After deletion');
  await expect(page.getByTestId('todo-item-1')).toHaveCount(0);
  await expect(page.getByTestId('todo-item-2')).toHaveCount(0);
  await expect(page.getByTestId('todo-list').locator('li')).toHaveCount(1);
  expect(browserIssues).toEqual([]);
});
