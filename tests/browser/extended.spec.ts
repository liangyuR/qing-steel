import { test, expect } from '@playwright/test';

test('第二批桌面交互 → 建议选择、全表排序分页和设置浮层可用', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/showcase/');
  const device = page.getByRole('combobox', { name: '选择设备', exact: true });
  await device.fill('B');
  await device.press('ArrowDown');
  await device.press('Enter');
  await expect(device).toHaveValue('B 线 · 侧面相机');
  const remote = page.getByRole('combobox', { name: '异步设备搜索' });
  await remote.fill('C');
  await expect(page.getByRole('option', { name: 'C 线 · 轮廓相机' })).toBeVisible();
  await page.getByRole('option', { name: 'C 线 · 轮廓相机' }).click();
  await expect(remote).toHaveValue('C 线 · 轮廓相机');
  await page.getByRole('slider', { name: '补光强度' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('slider', { name: '补光强度' })).toHaveAttribute(
    'aria-valuenow',
    '41',
  );
  await page
    .locator('#advanced-inputs')
    .screenshot({ path: 'test-results/extended-inputs-dark.png' });
  const table = page.getByRole('table', { name: '检测记录示例' });
  await table.getByRole('checkbox', { name: '选择本页全部' }).check();
  await expect(page.getByText('已选择 5 条记录')).toBeVisible();
  await page.getByRole('button', { name: '下一页' }).click();
  await expect(table.getByRole('cell', { name: 'QS-006', exact: true })).toBeVisible();
  await table.getByRole('checkbox', { name: '选择 QS-006' }).check();
  await expect(page.getByText('已选择 6 条记录')).toBeVisible();
  await table.getByRole('button', { name: '测量值 / mm' }).click();
  await expect(page.getByRole('button', { name: '第 1 页' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.locator('#data-display').screenshot({ path: 'test-results/extended-data-dark.png' });
  const date = page.getByLabel(/^计划日期/);
  await date.fill('2026-11-01');
  expect(await date.evaluate((input: HTMLInputElement) => input.validity.rangeOverflow)).toBe(true);
  await date.fill('2026-10-20');
  await page.getByRole('button', { name: '调整显示' }).click();
  const popup = page.getByRole('dialog', { name: '表格显示设置' });
  await popup.getByRole('combobox', { name: '显示密度' }).click();
  await page.getByRole('option', { name: '紧凑', exact: true }).click();
  await popup.getByRole('button', { name: '应用显示偏好' }).click();
  await expect(popup).not.toBeVisible();
  await expect(page.getByText('当前：紧凑 · 显示单位')).toBeVisible();
  await page.getByRole('combobox', { name: '主题', exact: true }).click();
  await page.getByRole('option', { name: '浅色主题', exact: true }).click();
  await page
    .locator('#app-navigation')
    .screenshot({ path: 'test-results/extended-navigation-light.png' });
  await page
    .locator('#content-overlays')
    .screenshot({ path: 'test-results/extended-overlays-light.png' });
  expect(errors).toEqual([]);
});

test('第二批窄屏 → 表格局部滚动、导航收起和建议浮层不溢出屏幕', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/showcase/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: '收起导航' }).click();
  const nav = page.getByRole('navigation', { name: '展开导航示例' });
  await nav.getByRole('link', { name: '检测记录' }).click();
  await expect(nav.getByRole('link', { name: '检测记录' })).toHaveAttribute('aria-current', 'page');
  await nav.getByRole('button', { name: '展开导航' }).click();
  await page
    .locator('#app-navigation')
    .screenshot({ path: 'test-results/extended-navigation-mobile.png' });
  await page.getByRole('combobox', { name: '选择设备', exact: true }).click();
  const list = page.getByRole('listbox', { name: '选择设备建议' });
  await expect(list).toBeVisible();
  const box = await list.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '调整显示' }).click();
  const popup = page.getByRole('dialog', { name: '表格显示设置' });
  await expect(popup).toBeVisible();
  const popupBox = await popup.boundingBox();
  expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(390);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
