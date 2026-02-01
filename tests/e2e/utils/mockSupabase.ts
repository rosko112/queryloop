import type { Page, Route } from '@playwright/test';

const jsonHeaders = {
  'content-type': 'application/json',
};

type RestOverrides = Record<string, unknown>;

export async function mockSupabase(
  page: Page,
  options: { authUser?: Record<string, unknown> | null; rest?: RestOverrides } = {}
) {
  const { authUser = null, rest = {} } = options;

  await page.route('**/auth/v1/**', async (route: Route) => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ user: authUser }),
      });
    }

    return route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({}),
    });
  });

  await page.route('**/rest/v1/**', async (route: Route) => {
    const requestUrl = new URL(route.request().url());
    const tableMatch = requestUrl.pathname.match(/\/rest\/v1\/([^/]+)/);
    const table = tableMatch ? tableMatch[1] : undefined;
    const data = table && Object.prototype.hasOwnProperty.call(rest, table) ? rest[table] : [];
    const isArray = Array.isArray(data);
    const total = isArray ? data.length : 1;
    const rangeEnd = Math.max(0, total - 1);

    return route.fulfill({
      status: 200,
      headers: {
        ...jsonHeaders,
        'content-range': `0-${rangeEnd}/${total}`,
      },
      body: JSON.stringify(data),
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
