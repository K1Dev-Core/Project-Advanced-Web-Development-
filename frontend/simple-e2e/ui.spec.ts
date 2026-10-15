import { test, expect, Page } from '@playwright/test';
import { fixtures } from './fixtures';
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
}
test('public entry and permissions are clear', async ({ page }) => {
  await page.goto('/customer');
  await expect(page.getByRole('heading', { name: 'จัดส่งมื้อเที่ยง', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'วิธีใช้งาน', exact: true })).toHaveCount(0);
  await expect(page.getByRole('navigation').getByRole('link')).toHaveText([
    'หน้าหลัก',
    'ร้านค้า',
    'ไรเดอร์',
  ]);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'review/simple-home.png', fullPage: true });
  await page.getByRole('link', { name: 'เข้าสู่ระบบร้าน', exact: true }).click();
  await expect(page.getByLabel('ชื่อผู้ใช้', { exact: true })).toBeVisible();
  await page.goto('/admin/orders');
  await expect(page).toHaveURL(/admin\/login$/);
  await page.goto('/rider');
  await expect(page.getByLabel('เลขใบงาน', { exact: true })).toBeVisible();
});
test('simulated records appear as normal orders without a test badge', async ({ page }) => {
  await fixtures(page);
  await page.goto('/admin/orders');
  await expect(page.locator('.table-scroll tbody tr').first()).toBeVisible();
  await expect(page.getByText('ข้อมูลทดสอบ', { exact: true })).toHaveCount(0);
});
for (const width of [320, 390, 768, 1024, 1440, 1920])
  test(`simple screens and forms fit at ${width}px`, async ({ page }) => {
    test.setTimeout(60000);
    await fixtures(page);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const path of [
      '/customer',
      '/admin',
      '/admin/orders',
      '/admin/customers',
      '/admin/riders',
      '/admin/plans',
      '/admin/settings',
      '/rider',
      '/rider/jobs/AB12CD',
    ]) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByText('กำลังดำเนินการ…', { exact: true })).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      await noOverflow(page);
      await page.screenshot({ path: `review/simple/${path.replaceAll('/', '-')}-${width}.png` });
    }
    await page.goto('/admin/customers');
    await page.getByRole('button', { name: 'เพิ่มลูกค้า', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const save = await dialog.getByRole('button', { name: 'บันทึก', exact: true }).boundingBox();
    expect(save!.y + save!.height).toBeLessThanOrEqual(900);
    await noOverflow(page);
    expect(errors).toEqual([]);
    await expect(dialog.getByLabel('ชื่อ', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    expect(errors).toEqual([]);
  });
test('API validation errors remain visible and login preserves input', async ({ page }) => {
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({ status: 401, json: { error: { code: 'INVALID_CREDENTIALS' } } }),
  );
  await page.goto('/admin/login');
  await page.getByLabel('ชื่อผู้ใช้', { exact: true }).fill('owner');
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  await expect(page.getByLabel('ชื่อผู้ใช้', { exact: true })).toHaveValue('owner');
});
test('simple pages meet scoped automated accessibility checks', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  for (const path of ['/customer', '/admin/login', '/rider']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
    ).toEqual([]);
  }
  await fixtures(page);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'จัดการรายการ', exact: true })).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
});

test('shared forms validate required values and send a real boolean for rider availability', async ({
  page,
}) => {
  await fixtures(page);
  await page.goto('/admin/customers');
  await page.getByRole('button', { name: 'เพิ่มลูกค้า', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(dialog.getByLabel('ชื่อ', { exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await page.goto('/admin/riders');
  let body: Record<string, unknown> | undefined;
  await page.route('**/api/riders', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    body = route.request().postDataJSON();
    await route.fulfill({ status: 201, json: { data: { id: 20, ...body } } });
  });
  await page.getByRole('button', { name: 'เพิ่มไรเดอร์', exact: true }).click();
  await expect(dialog.getByLabel('พร้อมรับงาน', { exact: true })).toBeChecked();
  await dialog.getByLabel('พร้อมรับงาน', { exact: true }).uncheck();
  await dialog.getByLabel('ชื่อไรเดอร์', { exact: true }).fill('ทดสอบฟอร์ม');
  await dialog.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(body).toMatchObject({ name: 'ทดสอบฟอร์ม', active: false });
});

test('real navigation has icons, no test menu, and stays fully visible on small screens', async ({
  page,
}) => {
  await fixtures(page);
  for (const viewport of [
    { width: 320, height: 640 },
    { width: 844, height: 390 },
    { width: 2560, height: 1440 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/admin');
    const nav = page.getByRole('navigation', { name: 'เมนูหลัก' });
    await expect(nav.getByRole('link')).toHaveCount(6);
    await expect(nav.locator('ui-icon')).toHaveCount(6);
    expect(await nav.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    for (const link of await nav.getByRole('link').all()) {
      const box = await link.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    }
    await expect(page.getByText(/เวอร์ชัน|โหมดสาธิต|จำลองรายการ/)).toHaveCount(0);
    await noOverflow(page);
  }
  await page.goto('/admin/orders');
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'รายการส่ง', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  const logo = page.locator('.brand-logo');
  await expect(logo).toBeVisible();
  expect(
    await logo.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
  ).toBeTruthy();
});

test('halftone background stays subtle and adapts to the system appearance', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/customer');
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body, '::before').backgroundImage))
    .toContain('radial-gradient');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe(
    'rgb(242, 242, 247)',
  );
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe(
    'rgb(25, 25, 30)',
  );
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body, '::after').backgroundImage))
    .toContain('radial-gradient');
});
