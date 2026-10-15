import { test, expect } from '@playwright/test';
import { fixtures } from './fixtures';

test('Dev tools requires owner login and restores focus without creating anything', async ({
  page,
}) => {
  const writes: string[] = [];
  page.on('request', (req) => {
    if (req.method() === 'POST') writes.push(req.url());
  });
  await page.goto('/customer');
  const trigger = page.getByRole('button', { name: 'เปิด Dev tools', exact: true });
  await trigger.click();
  const panel = page.getByRole('dialog', { name: 'Dev tools', exact: true });
  await expect(panel.getByRole('heading', { name: 'เข้าสู่ระบบร้านก่อน' })).toBeVisible();
  await expect(panel.getByRole('button', { name: 'สร้างข้อมูลทดสอบ', exact: true })).toHaveCount(0);
  await expect(panel.getByText('ตรวจ API', { exact: true })).toHaveCount(0);
  await expect(panel.locator('iframe')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(panel).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(writes).toEqual([]);
});

test('bundle creates customers, riders and orders through owner APIs and refreshes the current list', async ({
  page,
}) => {
  await fixtures(page);
  const writes: { path: string; body: any }[] = [];
  let reads = 0;
  await page.route('**/api/customers?*', async (route) => {
    reads++;
    await route.fallback();
  });
  await page.route('**/api/simulations/*', async (route) => {
    expect(route.request().headers()['authorization']).toBe('Bearer ui-fixture');
    expect(route.request().method()).toBe('POST');
    const body = route.request().postDataJSON();
    writes.push({ path: new URL(route.request().url()).pathname, body });
    await route.fulfill({ json: { data: { created: body.count, seed: 42, customersCreated: 0 } } });
  });
  await page.goto('/admin/customers');
  await expect(page.locator('.table-scroll')).toBeVisible();
  await page.getByRole('button', { name: 'เปิด Dev tools', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Dev tools', exact: true });
  await panel.getByLabel('จำนวนลูกค้า', { exact: true }).fill('5');
  await panel.getByLabel('จำนวนไรเดอร์', { exact: true }).fill('2');
  await panel.getByLabel('จำนวนรายการสั่งอาหาร', { exact: true }).fill('7');
  await panel.getByLabel('วันที่จัดส่งข้อมูลทดสอบ', { exact: true }).fill('2097-10-15');
  await panel.getByLabel('วันที่จัดส่งข้อมูลทดสอบ', { exact: true }).press('Tab');
  await panel.getByText('ตัวเลือกเพิ่มเติม', { exact: true }).click();
  await panel.getByLabel('Seed (ไม่บังคับ)', { exact: true }).fill('42');
  await panel.getByRole('button', { name: 'สร้างข้อมูลทดสอบ', exact: true }).click();
  await expect(
    panel.getByRole('heading', { name: 'สร้างแล้วเรียบร้อย', exact: true }),
  ).toBeVisible();
  expect(writes.map((w) => w.path)).toEqual([
    '/api/simulations/customers',
    '/api/simulations/riders',
    '/api/simulations/orders',
  ]);
  expect(writes[0].body).toEqual({ count: 5, radiusKm: 3, minRadiusKm: 0.2, seed: 42 });
  expect(writes[1].body).toEqual({ count: 2, seed: 42 });
  expect(writes[2].body).toEqual({
    count: 7,
    deliveryDate: '2097-10-15',
    clearExisting: false,
    ensureCustomers: true,
    uniqueCustomers: true,
    seed: 42,
  });
  await expect(panel).not.toContainText('ui-fixture');
  await page.screenshot({ path: 'review/dev-data-desktop.png', animations: 'disabled' });
  const beforeClose = reads;
  await panel.getByRole('button', { name: 'ปิด Dev tools', exact: true }).click();
  await expect.poll(() => reads).toBeGreaterThan(beforeClose);
});

test('mobile single generator validates counts, blocks duplicate requests and cannot close mid-write', async ({
  page,
}) => {
  await fixtures(page);
  await page.setViewportSize({ width: 320, height: 800 });
  let writes = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/api/simulations/riders', async (route) => {
    writes++;
    await pending;
    await route.fulfill({ json: { data: { created: 2, seed: 99 } } });
  });
  await page.goto('/admin/riders');
  await page.getByRole('button', { name: 'เปิด Dev tools', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Dev tools', exact: true });
  await panel.getByRole('button', { name: 'ไรเดอร์', exact: true }).click();
  const count = panel.getByLabel('จำนวนไรเดอร์', { exact: true });
  await count.fill('101');
  await panel.getByRole('button', { name: 'สร้างข้อมูลทดสอบ', exact: true }).click();
  await expect(count).toBeFocused();
  expect(writes).toBe(0);
  await count.fill('2');
  await panel.getByRole('button', { name: 'สร้างข้อมูลทดสอบ', exact: true }).click();
  await expect(
    panel.getByRole('button', { name: 'กำลังสร้างข้อมูล…', exact: true }),
  ).toBeDisabled();
  await expect(panel.getByRole('button', { name: 'ปิด Dev tools', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(panel).toBeVisible();
  release();
  await expect(
    panel.getByRole('heading', { name: 'สร้างแล้วเรียบร้อย', exact: true }),
  ).toBeVisible();
  expect(writes).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: 'review/dev-data-mobile.png', animations: 'disabled' });
});

test('partial bundle failure retains completed results and stops before creating orders', async ({
  page,
}) => {
  await fixtures(page);
  const paths: string[] = [];
  await page.route('**/api/simulations/*', async (route) => {
    const path = new URL(route.request().url()).pathname;
    paths.push(path);
    await route.fulfill(
      path.endsWith('/riders')
        ? { status: 503, json: { error: { code: 'DATABASE_UNAVAILABLE' } } }
        : { json: { data: { created: 20, seed: 3 } } },
    );
  });
  await page.goto('/admin');
  await page.getByRole('button', { name: 'เปิด Dev tools', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Dev tools', exact: true });
  await panel.getByRole('button', { name: 'สร้างข้อมูลทดสอบ', exact: true }).click();
  await expect(panel.getByRole('alert')).toContainText('ฐานข้อมูลไม่พร้อมใช้งาน');
  await expect(panel.getByRole('heading', { name: 'สร้างแล้วบางส่วน', exact: true })).toBeVisible();
  await expect(panel.locator('.dev-results')).toContainText('ลูกค้า 20 รายการ');
  expect(paths).toEqual(['/api/simulations/customers', '/api/simulations/riders']);
});
