import { expect, test } from '@playwright/test';

test('下拉菜单深浅主题、分组、键盘选择与窄屏边界', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/showcase/#forms');
  const select = page.getByRole('combobox', { name: '运行环境' });
  await select.click();
  await expect(page.getByRole('group', { name: '在线环境' })).toBeVisible();
  await expect(page.getByRole('option', { name: '归档环境（不可用）' })).toBeDisabled();
  await page.screenshot({ path: 'test-results/select-dark.png' });
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(select).toHaveText('本地回放');
  await expect(select).toBeFocused();
  await page.getByRole('combobox', { name: '主题', exact: true }).click();
  await page.getByRole('option', { name: '浅色主题' }).click();
  await select.click();
  await expect(page.getByRole('option', { name: '本地回放' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.screenshot({ path: 'test-results/select-light.png' });
  await page.keyboard.press('Escape');
  await expect(select).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await select.click();
  const box = await page.getByRole('listbox').boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/select-mobile.png' });
});
