import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('../backend/.env', 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
if (env.DB_NAME !== 'songsook_local') throw new Error('Only isolated local data may be captured.');
mkdirSync('review', { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:4201/admin/login');
await page.getByLabel('ชื่อผู้ใช้', { exact: true }).fill(env.OWNER_USERNAME);
await page.getByLabel('รหัสผ่าน', { exact: true }).fill(env.OWNER_PASSWORD);
await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
await page.locator('.stats-grid').waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'review/live-admin-desktop.png', fullPage: true });
await page.locator('.sidebar nav').getByRole('link', { name: 'รายการส่ง', exact: true }).click();
await page.locator('tbody tr').first().waitFor();
await page.screenshot({ path: 'review/live-orders-desktop.png', fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => scrollTo(0, 0));
await page.screenshot({ path: 'review/live-orders-mobile.png', fullPage: true });
await page.setViewportSize({ width: 1440, height: 1000 });
await page.locator('.sidebar nav').getByRole('link', { name: 'แผนจัดส่ง', exact: true }).click();
await page.locator('.plan-map').waitFor();
await page.locator('.leaflet-tile-loaded').first().waitFor({ timeout: 20000 });
await page.evaluate(() => scrollTo(0, 0));
await page.screenshot({ path: 'review/live-planning-desktop.png', fullPage: true });
await page.screenshot({ path: 'review/preview.png' });
await page.goto('http://127.0.0.1:4201/customer');
await page.locator('.home-intro').waitFor();
await page.evaluate(() => scrollTo(0, 0));
await page.screenshot({ path: 'review/customer-desktop.png', fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: 'review/customer-mobile.png', fullPage: true });
const token = await page.evaluate(() => sessionStorage.getItem('khaokong-owner-token-v2'));
const response = await context.request.get('http://127.0.0.1:3000/api/orders?limit=1', {
  headers: { Authorization: `Bearer ${token}` },
});
const order = (await response.json()).data[0];
await page.goto('http://127.0.0.1:4201/customer/tracking/' + order.trackingCode);
await page.locator('.tracking-page').waitFor();
await page.locator('.leaflet-tile-loaded').first().waitFor({ timeout: 20000 });
await page.evaluate(() => scrollTo(0, 0));
await page.screenshot({ path: 'review/live-tracking-mobile.png', fullPage: true });
await browser.close();
if (errors.length) throw new Error(errors.join('\n'));
console.log('Saved live database screens with real map tiles. No browser runtime errors.');
