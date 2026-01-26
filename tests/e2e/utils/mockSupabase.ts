import type { Page, Route } from '@playwright/test';

const jsonHeaders = {
  'content-type': 'application/json',
};

export async function mockSupabase(page: Page) {
  await page.route('**/auth/v1/**', async (route: Route) => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ user: null }),
      });
    }

    return route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({}),
    });
  });

  await page.route('**/rest/v1/**', async (route: Route) => {
    return route.fulfill({
      status: 200,
      headers: {
        ...jsonHeaders,
        'content-range': '0-0/0',
      },
      body: '[]',
    });
  });

  await page.route('**/storage/v1/**', async (route: Route) => {
    return route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({}),
    });
  });
}