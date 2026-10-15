import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const phase = process.argv[2] || 'before';
const folder = `review/layout-${phase}`;
mkdirSync(folder, { recursive: true });
const env = Object.fromEntries(
  readFileSync('../backend/.env', 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
if (env.DB_NAME !== 'songsook_local') throw new Error('Only isolated local project data.');
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const runtimeErrors = [];
page.on('pageerror', (e) => runtimeErrors.push(e.message));
await page.goto('http://127.0.0.1:4201/admin/login');
await page.getByLabel('ชื่อผู้ใช้', { exact: true }).fill(env.OWNER_USERNAME);
await page.getByLabel('รหัสผ่าน', { exact: true }).fill(env.OWNER_PASSWORD);
await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
await page.locator('.stats-grid').waitFor();
await page.evaluate(() => document.fonts.ready);
const token = await page.evaluate(() => sessionStorage.getItem('khaokong-owner-token-v2'));
const order = (
  await (
    await context.request.get('http://127.0.0.1:3000/api/orders?limit=1', {
      headers: { Authorization: `Bearer ${token}` },
    })
  ).json()
).data[0];
const cases = [
  ['customer', '/customer'],
  ['tracking-empty', '/customer/tracking'],
  ['tracking', '/customer/tracking/' + order.trackingCode],
  ['login', '/admin/login'],
  ['rider-entry', '/rider'],
  ['rider-job', '/rider'],
  ['dashboard', '/admin'],
  ['orders', '/admin/orders'],
  ['customers', '/admin/customers'],
  ['riders', '/admin/riders'],
  ['plans', '/admin/plans'],
  ['settings', '/admin/settings'],
];
const report = [];
async function capture(name, width) {
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `${folder}/${name}-${width}.png` });
  if ((width === 390 || width === 1440) && !name.endsWith('-form') && name !== 'order-detail')
    await page.screenshot({ path: `${folder}/${name}-${width}-full.png`, fullPage: true });
  const metrics = await page.evaluate(() => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const visible = (el) =>
      !el.classList.contains('sr-only') &&
      !!el.getClientRects().length &&
      getComputedStyle(el).visibility !== 'hidden';
    const escaped = [
      ...document.querySelectorAll(
        'h1,h2,h3,label,.button,.service-tile,.mobile-nav a span,.route-card,.stat-card',
      ),
    ]
      .filter(visible)
      .flatMap((el) => {
        const r = el.getBoundingClientRect();
        if (r.left < -1 || r.right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 2)
          return [
            {
              element: el.tagName,
              class: el.className,
              text: (el.textContent || '').trim().slice(0, 85),
              ...box(el),
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
            },
          ];
        return [];
      });
    const navOverlap = [...document.querySelectorAll('.mobile-nav a')]
      .filter(visible)
      .flatMap((a) => {
        const t = a.querySelector('span');
        if (!t) return [];
        const ar = a.getBoundingClientRect(),
          tr = t.getBoundingClientRect();
        return tr.width > ar.width
          ? [{ label: t.textContent, linkWidth: ar.width, textWidth: tr.width }]
          : [];
      });
    return {
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      heading: document.querySelector('h1') ? box(document.querySelector('h1')) : null,
      escaped,
      navOverlap,
    };
  });
  report.push({ name, width, ...metrics });
}
for (const width of [320, 390, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  for (const [name, url] of cases) {
    await page.goto('http://127.0.0.1:4201' + url);
    await page.locator('h1:visible,h2:visible').first().waitFor();
    if (name === 'rider-job')
      await page.getByRole('button', { name: 'ดูตัวอย่างใบงานไรเดอร์' }).click();
    await page.locator('.loading-state').waitFor({ state: 'hidden' });
    await page.waitForTimeout(100);
    await capture(name, width);
    if (['orders', 'customers', 'riders'].includes(name)) {
      await page
        .getByRole('button', {
          name:
            name === 'orders'
              ? 'เพิ่มรายการ'
              : name === 'customers'
                ? 'เพิ่มลูกค้า'
                : 'เพิ่มไรเดอร์',
          exact: true,
        })
        .click();
      await capture(name + '-form', width);
      await page.keyboard.press('Escape');
    }
    if (name === 'orders') {
      await page.getByRole('button', { name: 'ดูรายการ ' + order.id, exact: true }).click();
      await capture('order-detail', width);
      await page.keyboard.press('Escape');
    }
  }
}
writeFileSync(`${folder}/metrics.json`, JSON.stringify({ report, runtimeErrors }, null, 2));
console.log(
  JSON.stringify(
    {
      screenshots: report.length,
      documentOverflow: report.filter((r) => r.documentWidth > r.width),
      issues: report
        .filter((r) => r.escaped.length || r.navOverlap.length)
        .map((r) => ({
          name: r.name,
          width: r.width,
          escaped: r.escaped,
          navOverlap: r.navOverlap,
        })),
      runtimeErrors,
    },
    null,
    2,
  ),
);
await browser.close();
