import { test, expect } from '@playwright/test';
import { fixtures } from './fixtures';
import { choose } from './select';
test('themed dropdown supports keyboard and still works after closing Dev tools', async ({
  page,
}) => {
  await fixtures(page);
  await page.goto('/admin/plans');
  const objective = page.getByRole('combobox', { name: 'เป้าหมาย', exact: true });
  await objective.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await page.getByRole('button', { name: 'เปิด Dev tools', exact: true }).click();
  const dev = page.getByRole('dialog', { name: 'Dev tools', exact: true });
  await dev.getByRole('button', { name: 'เลือกวันที่', exact: true }).click();
  await expect(page.locator('mat-calendar')).toBeVisible();
  await page.locator('mat-datepicker-content').evaluate(async (el) => {
    await Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished));
  });
  await page.keyboard.press('Escape');
  await expect(page.locator('mat-calendar')).toHaveCount(0);
  await expect(dev).toBeVisible();
  await dev.getByRole('button', { name: 'ปิด Dev tools', exact: true }).click();
  await objective.click();
  await expect(page.getByRole('option', { name: 'ประหยัดที่สุด', exact: true })).toBeVisible();
  await page.screenshot({ path: 'review/themed-select.png' });
  await page.keyboard.press('Escape');
});
test('themed calendar and numeric select work inside the mobile editor and preserve API payloads', async ({
  page,
}) => {
  await fixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  let body: Record<string, unknown> | undefined;
  await page.route('**/api/orders', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    body = route.request().postDataJSON();
    await route.fulfill({ json: { data: { id: 900 } } });
  });
  await page.goto('/admin/orders');
  await page.getByRole('button', { name: 'เพิ่มรายการส่ง', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'เพิ่มรายการส่ง', exact: true });
  await choose(editor.getByRole('combobox', { name: 'ลูกค้าผู้รับ', exact: true }), {
    label: 'พิมพ์ชนก ใจดี · 0812345600',
  });
  await editor.getByRole('button', { name: 'เลือกวันที่', exact: true }).click();
  const calendar = page.locator('mat-calendar');
  await expect(calendar).toBeVisible();
  const popup = await page.locator('.mat-datepicker-content').boundingBox();
  expect(popup!.x).toBeGreaterThanOrEqual(0);
  expect(popup!.x + popup!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'review/themed-calendar-mobile.png' });
  await calendar
    .locator('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)')
    .nth(19)
    .click();
  await expect(calendar).toHaveCount(0);
  await editor.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(editor).not.toBeVisible();
  expect(typeof body!['customerId']).toBe('number');
  expect(body!['deliveryDate']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});
test('themed confirmation cancels without writes and deletes only after confirmation', async ({
  page,
}) => {
  await fixtures(page);
  let writes = 0;
  await page.route('**/api/customers/*', async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    writes++;
    await route.fulfill({ json: { data: null } });
  });
  await page.goto('/admin/customers');
  await page.getByRole('button', { name: 'ลบ', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'ลบรายการนี้?', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'ยกเลิก', exact: true })).toBeFocused();
  await page.screenshot({ path: 'review/themed-confirm.png' });
  await dialog.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  expect(writes).toBe(0);
  await page.getByRole('button', { name: 'ลบ', exact: true }).first().click();
  await dialog.getByRole('button', { name: 'ลบรายการ', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(writes).toBe(1);
});
