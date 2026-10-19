import { test, expect } from '@playwright/test';

test('桌面展示 → 主题、表单、抽屉与检索可用，运行中无页面错误', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/showcase/');
  await expect(page.getByRole('heading', { name: '让精密，触手可及。' })).toBeVisible();
  await page.screenshot({ path: 'test-results/showcase-dark.png', fullPage: true });
  await page.getByRole('combobox', { name: '主题', exact: true }).click();
  await page.getByRole('option', { name: '浅色主题', exact: true }).click();
  await expect(page.locator('.qs-root')).toHaveAttribute('data-theme', 'light');
  await page.screenshot({ path: 'test-results/showcase-light.png', fullPage: true });
  await page.getByRole('button', { name: '打开设置抽屉' }).click();
  const drawer = page.getByRole('dialog', { name: '显示设置' });
  await expect(drawer).toBeVisible();
  const initial = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  expect(initial).toBe('关闭');
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  await expect(page.getByRole('button', { name: '打开设置抽屉' })).toBeFocused();
  await page.getByRole('textbox', { name: /方案名称/ }).fill('');
  await page.locator('#forms').getByRole('button', { name: '保存配置' }).click();
  await expect(page.getByText('请输入方案名称')).toBeVisible();
  await page.getByRole('textbox', { name: /方案名称/ }).fill('验收方案');
  await page.locator('#forms').getByRole('button', { name: '保存配置' }).click();
  await expect(page.getByText('当前配置已保存')).toBeVisible();
  await page.getByRole('textbox', { name: '搜索组件' }).fill('NumberField');
  await expect(page.locator('.showcase-section')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: '输入与表单' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('窄屏与减少动效 → 页面没有水平溢出，菜单与对话框可操作', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/showcase/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/showcase-mobile.png', fullPage: true });
  await page.getByRole('button', { name: '更多操作' }).click();
  await page.getByRole('menuitem', { name: '创建副本' }).click();
  await expect(page.getByText('已创建项目副本')).toBeVisible();
  await page.getByRole('button', { name: '打开对话框' }).click();
  const dialog = page.getByRole('dialog', { name: '删除示例项目？' });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await dialog.getByRole('button', { name: '取消' }).click();
  await expect(dialog).not.toBeVisible();
});
