import { test, expect } from '@playwright/test';

test('快速切换指示器、退出浮层与恢复焦点', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/showcase/');
  const group = page.getByRole('group', { name: '运行方式', exact: true });
  await group.scrollIntoViewIfNeeded();
  for (const name of ['手动', '离线', '自动', '离线'])
    await group.getByRole('button', { name, exact: true }).click({ force: true });
  await expect(group.getByRole('button', { name: '离线', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect
    .poll(() =>
      group.evaluate(
        (el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
      ),
    )
    .toBe(0);
  const rects = await group.evaluate((el) => {
    const a = el.querySelector('.active')!.getBoundingClientRect(),
      b = el.querySelector('.selection-track-indicator')!.getBoundingClientRect();
    return Math.abs(a.x - b.x) + Math.abs(a.width - b.width);
  });
  expect(rects).toBeLessThan(2);
  await page.getByRole('button', { name: '打开对话框', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '删除示例项目？' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: '打开对话框', exact: true })).toBeFocused();
  await page.getByRole('button', { name: '打开计划日期选择' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '打开计划日期选择' }).click();
  await expect(page.getByRole('dialog', { name: '计划日期选择' })).toBeVisible();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('减少动效即时反馈、压力场景停止后不再更新', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/showcase/performance.html');
  await page.getByRole('button', { name: '开始更新' }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).qsPerformance.readingTicks))
    .toBeGreaterThan(5);
  await page.getByRole('button', { name: '停止更新' }).click();
  const before = await page.evaluate(() => ({ ...(window as any).qsPerformance }));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => ({ ...(window as any).qsPerformance }))).toEqual(before);
  await page.getByRole('button', { name: '打开秒精度时间选择' }).click();
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
