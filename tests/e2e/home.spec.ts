import { test, expect } from '@playwright/test';
import { mockSupabase } from './utils/mockSupabase';

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
});

test('home page renders key sections', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /ask sharper/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /top questions/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /featured tags/i })).toBeVisible();
  await expect(page.getByText('No tags available yet.')).toBeVisible();
});

test('search routes to questions page with query', async ({ page }) => {
  await page.goto('/');

  const search = page.getByPlaceholder('Search questions, tags, or users...');
  await search.fill('nextjs');
  await search.press('Enter');

  await expect(page).toHaveURL(/\/question\?title=nextjs/);
  await expect(page.getByRole('heading', { name: 'All Questions' })).toBeVisible();
});

test('explore questions CTA navigates correctly', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Explore questions' }).click();
  await expect(page).toHaveURL(/\/question/);
  await expect(page.getByRole('heading', { name: 'All Questions' })).toBeVisible();
  await expect(page.getByText('No questions found.')).toBeVisible();
});