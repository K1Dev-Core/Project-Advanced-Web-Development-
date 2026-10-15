import { choose } from './select';
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
  throw new Error('Only the isolated local database may be used.');
const api = 'http://127.0.0.1:3000/api';
test('simple frontend: actual customer, rider and order CRUD → road plan → rider delivery', async ({
  page,
  request,
  browser,
}) => {
  let token = '',
    customerId = 0,
    riderId = 0,
    orderId = 0,
    planId = 0;
  const name = 'Simple ' + Date.now();
  const date = '2098-12-' + String((Date.now() % 27) + 1).padStart(2, '0');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto('/admin/login');
    await page.getByLabel('ชื่อผู้ใช้', { exact: true }).fill(env['OWNER_USERNAME']);
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill(env['OWNER_PASSWORD']);
    await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
    await expect(page.locator('.stats')).toBeVisible();
    token = await page.evaluate(() => sessionStorage.getItem('khaokong-owner-token-v2') || '');
    const headers = { Authorization: `Bearer ${token}` };
    await page.getByRole('link', { name: 'ลูกค้า', exact: true }).first().click();
    await page.getByRole('button', { name: 'เพิ่มลูกค้า', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('ชื่อ', { exact: true }).fill(name);
    await dialog.getByLabel('เบอร์โทร', { exact: true }).fill('0895554321');
    await dialog.getByLabel('ที่อยู่', { exact: true }).fill('อาคารทดสอบ มหาวิทยาลัยมหาสารคาม');
    await dialog.locator('.leaflet-container').click({ position: { x: 210, y: 130 } });
    await dialog.getByRole('button', { name: 'บันทึก', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    const customer = (
      await (
        await request.get(api + '/customers?search=' + encodeURIComponent(name), { headers })
      ).json()
    ).data[0];
    console.log('Customer saved');
    customerId = customer.id;
    expect(customer.location.latitude).not.toBe(16.246825);
    await page.getByRole('link', { name: 'ไรเดอร์', exact: true }).first().click();
    await page.getByRole('button', { name: 'เพิ่มไรเดอร์', exact: true }).click();
    await dialog.getByLabel('ชื่อไรเดอร์', { exact: true }).fill(name);
    await dialog.getByLabel('เบอร์โทร', { exact: true }).fill('0895554321');
    await dialog.getByRole('button', { name: 'บันทึก', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    riderId = (
      await (
        await request.get(api + '/riders?search=' + encodeURIComponent(name), { headers })
      ).json()
    ).data[0].id;
    console.log('Rider saved');
    await page.getByRole('link', { name: 'รายการส่ง', exact: true }).first().click();
    await page.getByLabel('วันที่จัดส่ง', { exact: true }).fill(date);
    await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
    await page.getByRole('button', { name: 'เพิ่มรายการส่ง', exact: true }).click();
    await choose(dialog.getByLabel('ลูกค้าผู้รับ', { exact: true }), {
      label: name + ' · 0895554321',
    });
    await dialog.getByLabel('จำนวนกล่อง', { exact: true }).fill('2');
    await dialog.getByRole('button', { name: 'บันทึก', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    orderId = (await (await request.get(api + '/orders?date=' + date, { headers })).json()).data[0]
      .id;
    console.log('Order saved');
    await page.getByRole('link', { name: 'แผนจัดส่ง', exact: true }).first().click();
    await expect(page.locator('h1')).toHaveText('แผนจัดส่ง');
    await page.getByLabel('วันที่จัดส่ง', { exact: true }).fill(date);
    await page.getByLabel('วันที่จัดส่ง', { exact: true }).press('Tab');
    await page.getByRole('button', { name: 'คำนวณเส้นทาง', exact: true }).click();
    await page.getByRole('button', { name: 'บันทึกแผนร่าง', exact: true }).click();
    console.log('Plan saved');
    await expect(page.locator('route-card')).toHaveCount(1);
    await choose(
      page.locator('route-card').getByRole('combobox', { name: 'ไรเดอร์', exact: true }),
      { label: name },
    );
    await page.getByRole('button', { name: 'ยืนยันแผน', exact: true }).click();
    await expect(page.getByRole('link', { name: /เปิดใบงาน/ })).toBeVisible();
    const plan = (await (await request.get(api + '/plans?date=' + date, { headers })).json())
      .data[0];
    planId = plan.id;
    const detail = (await (await request.get(api + '/plans/' + planId, { headers })).json()).data;
    expect(detail.summary.distanceSource).toBe('road');
    expect(detail.routes[0].geometry.length).toBeGreaterThan(0);
    const loaded = page.locator('.leaflet-tile-loaded');
    await expect(loaded.first()).toBeVisible();
    const context = await browser.newContext();
    const rider = await context.newPage();
    await rider.goto('http://127.0.0.1:4201/rider/jobs/' + detail.routes[0].jobCode);
    await rider.getByRole('button', { name: 'เริ่มออกส่ง', exact: true }).click();
    await rider.getByRole('button', { name: 'ส่งสำเร็จ', exact: true }).click();
    await expect(rider.getByText('ส่งอาหารครบทุกจุดแล้ว', { exact: true })).toBeVisible();
    expect(
      (await (await request.get(api + '/orders/' + orderId, { headers })).json()).data.status,
    ).toBe('delivered');
    expect(errors).toEqual([]);
    await context.close();
  } finally {
    if (token) {
      const headers = { Authorization: `Bearer ${token}` };
      if (!planId) {
        const plans = (await (await request.get(api + '/plans?date=' + date, { headers })).json())
          .data;
        planId = plans?.[0]?.id || 0;
      }
      if (planId) {
        const plan = (await (await request.get(api + '/plans/' + planId, { headers })).json()).data;
        if (['draft', 'confirmed'].includes(plan?.status))
          await request.post(api + `/plans/${planId}/cancel`, { headers, data: {} });
        await request.delete(api + '/plans/' + planId, { headers });
      }
      if (orderId) await request.delete(api + '/orders/' + orderId, { headers });
      if (customerId) await request.delete(api + '/customers/' + customerId, { headers });
      if (riderId) await request.delete(api + '/riders/' + riderId, { headers });
    }
  }
});

test('settings UI persists real local changes and restores original shop settings', async ({
  page,
  request,
}) => {
  let token = '';
  let original: any;
  try {
    await page.goto('/admin/login');
    await page.getByLabel('ชื่อผู้ใช้', { exact: true }).fill(env['OWNER_USERNAME']);
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill(env['OWNER_PASSWORD']);
    await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
    await expect(page.locator('.stats')).toBeVisible();
    token = await page.evaluate(() => sessionStorage.getItem('khaokong-owner-token-v2') || '');
    const headers = { Authorization: `Bearer ${token}` };
    original = (await (await request.get(api + '/settings', { headers })).json()).data;
    await page.getByRole('link', { name: 'ตั้งค่าร้าน', exact: true }).click();
    const name = 'ทดสอบตั้งค่าร้าน ' + Date.now();
    await page.getByLabel('ชื่อร้าน', { exact: true }).fill(name);
    await page.getByRole('button', { name: 'บันทึกการตั้งค่า', exact: true }).click();
    await expect(page.getByText('บันทึกการตั้งค่าแล้ว', { exact: true })).toBeVisible();
    expect((await (await request.get(api + '/settings', { headers })).json()).data.shopName).toBe(
      name,
    );
    await page.reload();
    await expect(page.getByLabel('ชื่อร้าน', { exact: true })).toHaveValue(name);
  } finally {
    if (original && token) {
      const { updatedAt, ...body } = original;
      body.departureTime = String(body.departureTime).slice(0, 5);
      const response = await request.patch(api + '/settings', {
        headers: { Authorization: `Bearer ${token}` },
        data: body,
      });
      expect(response.ok()).toBe(true);
    }
  }
});
