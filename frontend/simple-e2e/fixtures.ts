import { Page } from '@playwright/test';
import { demoData, settings, toJob } from './fixtures-data';
export async function fixtures(page: Page) {
  const data = structuredClone(demoData());
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api', '');
    const result: Record<string, unknown> = {
      '/settings': settings,
      '/dashboard': {
        orders: {
          totalOrders: 6,
          totalBoxes: 12,
          totalRevenue: 780,
          byStatus: { delivered: { orders: 1, boxes: 2 } },
        },
        riders: { active: 2 },
        customers: { total: 6 },
        plans: { total: 1, active: data.plan },
        shop: { name: 'ทดสอบ', departureTime: '11:30', deadlineTime: '12:30' },
      },
      '/customers': data.customers,
      '/riders': data.riders,
      '/orders': data.orders,
      '/plans': [data.plan],
    };
    if (path.startsWith('/plans/')) return route.fulfill({ json: { data: data.plan } });
    if (path.startsWith('/jobs/')) return route.fulfill({ json: { data: toJob(data.plan) } });
    return route.fulfill({
      json: { data: result[path], meta: { page: 1, totalPages: 1, total: 6 } },
    });
  });
  await page.addInitScript(() => sessionStorage.setItem('khaokong-owner-token-v2', 'ui-fixture'));
}
