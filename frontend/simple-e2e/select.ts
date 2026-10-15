import { Locator, expect } from '@playwright/test';
export async function choose(control: Locator, selection: string | { label: string }) {
  const page = control.page();
  await control.and(page.getByRole('combobox')).click();
  const option =
    typeof selection === 'string'
      ? page.locator('mat-option[data-value=' + JSON.stringify(selection) + ']')
      : page.getByRole('option', { name: selection.label, exact: true });
  await option.click();
  await expect(page.getByRole('listbox')).toHaveCount(0);
}
