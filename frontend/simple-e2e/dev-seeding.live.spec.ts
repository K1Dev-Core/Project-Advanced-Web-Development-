import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(
  readFileSync('../backend/.env', 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);
if (
  env['DB_NAME'] !== 'songsook_local' ||
  env['DB_HOST'] !== '127.0.0.1' ||
  env['DB_PORT'] !== '33307'
)
  throw new Error('Only isolated local data may be used');
const api = 'http://127.0.0.1:3000/api';
test('Dev generator persists a real local bundle and refreshes its destination page', async ({
  page,
  request,
}) => {
  const anonymous = await request.post(api + '/simulations/riders', { data: { count: 1 } });
  expect(anonymous.status()).toBe(401);
  const login = await request.post(api + '/auth/login', {
    data: { username: env['OWNER_USERNAME'], password: env['OWNER_PASSWORD'] },
  });
  expect(login.ok()).toBe(true);
  const token = (await login.json()).data.token;
  const headers = { Authorization: 'Bearer ' + token };
  async function list(path: string) {
    const rows: any[] = [];
    let index = 1;
    while (true) {
      const response = await request.get(
        api + path + (path.includes('?') ? '&' : '?') + 'limit=100&page=' + index,
        { headers },
      );
      expect(response.ok()).toBe(true);
      const data = await response.json();
      rows.push(...data.data);
      if (!data.meta || index >= data.meta.totalPages) return rows;
      index++;
    }
  }
  const beforeCustomers = new Set((await list('/customers')).map((row) => row.id));
  const beforeRiders = new Set((await list('/riders')).map((row) => row.id));
  const date = '2096-11-15';
  const beforeOrders = new Set((await list('/orders?date=' + date)).map((row) => row.id));
  try {
    await page.addInitScript(
      (value) => sessionStorage.setItem('khaokong-owner-token-v2', value),
      token,
    );
    await page.goto('/admin/orders');
    await page.getByRole('button', { name: 'เปิด Dev tools', exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'Dev tools', exact: true });
    await panel.getByLabel('จำนวนลูกค้า', { exact: true }).fill('2');
    await panel.getByLabel('จำนวนไรเดอร์', { exact: true }).fill('1');
    await panel.getByLabel('จำนวนรายการสั่งอาหาร', { exact: true }).fill('3');
    await panel.getByLabel('วันที่จัดส่งข้อมูลทดสอบ', { exact: true }).fill(date);
    await panel.getByLabel('วันที่จัดส่งข้อมูลทดสอบ', { exact: true }).press('Tab');
    await panel.getByRole('button', { name: 'สร้างข้อมูลทดสอบ', exact: true }).click();
    await expect(
      panel.getByRole('heading', { name: 'สร้างแล้วเรียบร้อย', exact: true }),
    ).toBeVisible();
    const customers = (await list('/customers')).filter((row) => !beforeCustomers.has(row.id));
    const riders = (await list('/riders')).filter((row) => !beforeRiders.has(row.id));
    const orders = (await list('/orders?date=' + date)).filter((row) => !beforeOrders.has(row.id));
    expect(customers.length).toBe(2);
    expect(customers.every((row) => row.simulated && Number.isFinite(row.location.latitude))).toBe(
      true,
    );
    expect(riders.length).toBe(1);
    expect(riders[0].active).toBe(true);
    expect(orders.length).toBe(3);
    expect(
      orders.every((row) => row.simulated && row.deliveryDate === date && row.status === 'pending'),
    ).toBe(true);
    await panel.getByRole('link', { name: 'ดูรายการส่ง', exact: true }).click();
    await expect(panel).not.toBeVisible();
    await expect(page.getByLabel('วันที่จัดส่ง', { exact: true })).toHaveValue('15/11/2096');
    await expect(page.locator('tbody tr')).toHaveCount(3);
  } finally {
    for (const row of await list('/orders?date=' + date))
      if (!beforeOrders.has(row.id))
        expect((await request.delete(api + '/orders/' + row.id, { headers })).ok()).toBe(true);
    for (const row of await list('/customers'))
      if (!beforeCustomers.has(row.id))
        expect((await request.delete(api + '/customers/' + row.id, { headers })).ok()).toBe(true);
    for (const row of await list('/riders'))
      if (!beforeRiders.has(row.id))
        expect((await request.delete(api + '/riders/' + row.id, { headers })).ok()).toBe(true);
  }
});
