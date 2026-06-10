import { test, expect } from '@playwright/test';

async function demoLogin(page, role) {
  await page.goto('/login');
  const label = role.charAt(0).toUpperCase() + role.slice(1);
  await page.getByRole('button', { name: `Demo ${label}` }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}`));
}

test.describe('Landing & auth', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'DOJANG' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('demo student login reaches dashboard', async ({ page }) => {
    await demoLogin(page, 'student');
    await expect(page.getByRole('heading', { name: 'Alex Kim' })).toBeVisible();
  });

  test('demo parent login reaches dashboard', async ({ page }) => {
    await demoLogin(page, 'parent');
    await expect(page.getByRole('heading', { name: 'Your children' })).toBeVisible();
  });

  test('demo instructor login reaches dashboard', async ({ page }) => {
    await demoLogin(page, 'instructor');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});

test.describe('Student practice', () => {
  test.beforeEach(async ({ page }) => {
    await demoLogin(page, 'student');
  });

  test('learn hub and flashcards accessible', async ({ page }) => {
    await page.getByRole('link', { name: 'Learn' }).click();
    await expect(page).toHaveURL(/\/student\/learn/);
    await page.getByRole('link', { name: 'Terminology' }).click();
    await expect(page.getByText(/flashcard/i)).toBeVisible();
  });

  test('theme toggle changes data-theme', async ({ page }) => {
    await page.getByRole('button', { name: /Theme/i }).click();
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(['dark', 'light']).toContain(theme);
  });
});

test.describe('Instructor tools', () => {
  test.beforeEach(async ({ page }) => {
    await demoLogin(page, 'instructor');
  });

  test('school switcher filters roster context', async ({ page }) => {
    const switcher = page.locator('.school-switcher select');
    if (await switcher.isVisible()) {
      await switcher.selectOption({ label: 'Beta Martial Arts' });
      await expect(switcher).toHaveValue(/school-beta/);
    }
  });

  test('reports page loads export actions', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Reports' }).click();
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
    await expect(page.getByRole('button', { name: /CSV/i }).first()).toBeVisible();
  });
});
