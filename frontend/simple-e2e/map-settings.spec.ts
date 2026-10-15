import { test, expect } from '@playwright/test';
import { fixtures } from './fixtures';
import { settings } from './fixtures-data';
import { SettingsSchemas } from '../../backend/src/modules/settings/SettingsSchemas';

test('settings saves only writable fields, normalizes database time, and hides coordinate inputs', async ({
  page,
}) => {
  await fixtures(page);
  let writes = 0;
  let body: any;
  await page.route('**/api/settings', async (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({
        json: {
          data: { ...settings, departureTime: '11:30:00', updatedAt: '2026-10-15T00:00:00Z' },
        },
      });
    body = route.request().postDataJSON();
    const parsed = SettingsSchemas.update.safeParse(body);
    writes++;
    await route.fulfill({
      status: parsed.success ? 200 : 400,
      json: parsed.success
        ? { data: body }
        : {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request data is invalid',
              details: parsed.error.issues,
            },
          },
    });
  });
  await page.goto('/admin/settings');
  await expect(page.getByLabel('เวลาออกส่ง', { exact: true })).toHaveValue('11:30');
  await expect(page.getByLabel('ละติจูด', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('ลองจิจูด', { exact: true })).toHaveCount(0);
  await page.getByLabel('ชื่อร้าน', { exact: true }).fill('ข้าวกล่อง ทดสอบ');
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'บันทึกการตั้งค่าแล้ว' })).toBeVisible();
  await page.locator('app-notice .notification').screenshot({ path: 'review/notification-success.png', animations: 'disabled' });
  expect(writes).toBe(1);
  expect(body.updatedAt).toBeUndefined();
  expect(body.departureTime).toBe('11:30');
  expect(body.shopLocation).toEqual(settings.shopLocation);
  await page.getByRole('button', { name: 'ปิดแจ้งเตือน' }).click();
  await expect(page.locator('app-notice')).toHaveCount(0);
});

test('map pins are compact, draggable and keyboard adjustable without instructional overlays', async ({
  page,
}) => {
  await fixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  let body: any;
  await page.route('**/api/settings', async (route) => {
    if (route.request().method() === 'GET') return route.fallback();
    body = route.request().postDataJSON();
    await route.fulfill({ json: { data: body } });
  });
  await page.goto('/admin/settings');
  const mapShell = page.locator('.real-map-shell');
  await expect(mapShell).toHaveClass(/clear-map-theme/);
  await page.getByRole('button', { name: 'ใช้สีแผนที่ปกติ', exact: true }).click();
  await expect(mapShell).not.toHaveClass(/clear-map-theme/);
  await page.getByRole('button', { name: 'ใช้ธีมแผนที่สว่างชัด', exact: true }).click();
  await expect(mapShell).toHaveClass(/clear-map-theme/);
  const marker = page.locator('.delivery-marker');
  await expect(marker).toBeVisible();
  const box = await marker.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(32);
  expect(box!.width).toBeLessThan(44);
  expect(box!.height).toBeLessThan(44);
  await expect(page.getByText('แตะเพื่อปักหมุด หรือลากหมุดเพื่อปรับตำแหน่ง')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'ปักหมุดตรงกลางแผนที่' })).toHaveCount(0);
  await expect(marker).toHaveClass(/leaflet-marker-draggable/);
  const start = await marker.boundingBox();
  await page.mouse.move(start!.x + 24, start!.y + 22);
  await page.mouse.down();
  await page.mouse.move(start!.x + 49, start!.y - 8, { steps: 10 });
  await page.mouse.up();
  await expect(marker).toBeVisible();
  await expect.poll(async () => (await marker.boundingBox())?.x ?? start!.x).not.toBe(start!.x);
  await marker.focus();
  await page.keyboard.press('Shift+ArrowRight');
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า', exact: true }).click();
  await expect(page.getByText('บันทึกการตั้งค่าแล้ว', { exact: true })).toBeVisible();
  expect(body.shopLocation.longitude).not.toBe(settings.shopLocation.longitude);
  await page.getByRole('button', { name: 'ปิดแจ้งเตือน' }).click();
  await page.getByRole('button', { name: 'ขยายแผนที่', exact: true }).click();
  await expect(page.locator('.real-map-shell')).toHaveClass(/expanded/);
  await page.getByRole('button', { name: 'ย่อแผนที่', exact: true }).click();
  await page.locator('h1').click();
  await page.screenshot({ path: 'review/map-settings-mobile.png', fullPage: true });
});

test('real map location permissions fail clearly and tiles can be retried', async ({
  page,
  context,
}) => {
  await fixtures(page);
  await context.clearPermissions();
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        watchPosition: (_ok: any, fail: any) => {
          setTimeout(() => fail({ code: 1 }), 0);
          return 1;
        },
        clearWatch: () => {},
      },
    }),
  );
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
  await page.goto('/admin/settings');
  await page.getByRole('button', { name: 'ใช้ตำแหน่งปัจจุบัน', exact: true }).click();
  await expect(
    page.getByText('เปิดสิทธิ์ตำแหน่งในเบราว์เซอร์ หรือแตะบนแผนที่เพื่อปักหมุด', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('แผนที่พื้นหลังโหลดไม่สำเร็จ', { exact: false })).toBeVisible();
  await page.locator('.map-error').getByRole('button', { name: 'ลองอีกครั้ง' }).click();
  await expect(
    page.locator('.map-error').filter({ hasText: 'แผนที่พื้นหลังโหลดไม่สำเร็จ' }),
  ).toBeVisible();
});

test('pending data uses skeleton; validation errors name affected Thai fields and remain dismissible', async ({
  page,
}) => {
  await fixtures(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/api/settings', async (route) => {
    if (route.request().method() === 'GET') {
      await pending;
      return route.fulfill({ json: { data: settings } });
    }
    return route.fulfill({
      status: 400,
      json: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request data is invalid',
          details: [{ field: 'shopName', message: 'Invalid' }],
        },
      },
    });
  });
  await page.goto('/admin/settings');
  await expect(page.getByRole('status', { name: 'กำลังโหลดข้อมูล' })).toBeVisible();
  release();
  await expect(page.locator('.request-skeleton')).toHaveCount(0);
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('กรุณาตรวจสอบ ชื่อร้าน');
  await expect(page.getByRole('alert')).not.toContainText('Request data is invalid');
  await page.getByRole('button', { name: 'ปิดแจ้งเตือน' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('order searches reuse reference data and rider lists skip irrelevant shop settings', async ({
  page,
}) => {
  await fixtures(page);
  let settingsGets = 0,
    customersGets = 0;
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/settings') settingsGets++;
    if (path === '/api/customers') customersGets++;
    await route.fallback();
  });
  await page.goto('/admin/orders');
  await expect(page.locator('.table-scroll')).toBeVisible();
  expect(settingsGets).toBe(1);
  expect(customersGets).toBe(1);
  await page.getByLabel('ค้นหา', { exact: true }).fill('test');
  await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
  await expect(page.locator('.table-scroll')).toBeVisible();
  expect(settingsGets).toBe(1);
  expect(customersGets).toBe(1);
  await page.getByRole('link', { name: 'ไรเดอร์', exact: true }).first().click();
  await expect(page.locator('.table-scroll')).toBeVisible();
  expect(settingsGets).toBe(1);
});
