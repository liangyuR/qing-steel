import { test, expect } from '@playwright/test';

test('工业组件 → 判定切换、阶段故障与工件隔离可交互', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/showcase/#industrial-verdict');
  const verdict = page.locator('#industrial-verdict .qs-industrial-verdict').first();
  await page.getByRole('button', { name: '判定 NG', exact: true }).click();
  await expect(verdict).toHaveAttribute('data-verdict', 'ng');
  await page
    .locator('#industrial-verdict')
    .screenshot({ path: 'test-results/industrial-verdict-dark.png' });
  await page.getByRole('button', { name: '局部超差', exact: true }).click();
  await expect(verdict).toHaveAttribute('data-verdict', 'warn');
  await expect(verdict.locator('.big')).toHaveText('OK');
  await page.getByRole('switch', { name: '产线头部（SN 与 PLC 码）' }).check();
  await expect(
    page.getByRole('region', { name: '判定结果 · SN P-20261019-1042', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '下一件（保留旧结果）' }).click();
  await expect(verdict).toHaveAttribute('data-verdict', 'running');
  await expect(verdict.getByText('NG', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '模拟设备故障' }).click();
  await expect(verdict).toHaveAttribute('data-verdict', 'fault');
  await page.getByRole('button', { name: '注入阶段故障' }).click();
  await expect(page.getByRole('button', { name: '推进阶段' })).toBeDisabled();
  await expect(page.locator('#industrial-verdict [data-state="active"]')).toHaveCount(0);
  await page.getByRole('button', { name: '复位阶段' }).click();
  await page.getByRole('button', { name: '推进阶段' }).click();
  await expect(page.locator('#industrial-verdict [data-state="complete"]')).toHaveCount(1);
  await page.getByRole('button', { name: '侧面 · NG', exact: true }).click();
  await expect(page.getByRole('button', { name: '侧面 · NG', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page
    .locator('#industrial-cameras')
    .screenshot({ path: 'test-results/industrial-cameras-dark.png' });
  await page.getByRole('switch', { name: '切换到新工件' }).check();
  await expect(page.locator('#industrial-cameras .qs-camera-strip img')).toHaveCount(0);
  await expect(page.getByText('现有帧属于上一件，等待 C-1043 的采集结果。')).toBeVisible();
  await page.getByRole('button', { name: '模拟缺失读数' }).click();
  const reading = page.getByRole('group', { name: '胶宽', exact: true });
  await expect(reading).toHaveAttribute('data-state', 'pending');
  await page.getByRole('button', { name: '读数 +0.01' }).click();
  await page.getByRole('switch', { name: '标记历史读数' }).check();
  await expect(reading).toHaveAttribute('data-state', 'stale');
  const ngCount = page.getByRole('group', { name: 'NG', exact: true });
  const valueColor = (name: string) =>
    page
      .getByRole('group', { name, exact: true })
      .locator('.qs-stat-counter-value')
      .evaluate((node) => getComputedStyle(node).color);
  expect(await valueColor('NG')).toBe(await valueColor('今日'));
  await page.getByRole('button', { name: '记一件 NG' }).click();
  await expect(ngCount).toHaveAttribute('data-tone', 'ng');
  await expect(ngCount.locator('.qs-stat-counter-value')).not.toHaveCSS(
    'color',
    await valueColor('今日'),
  );
  await page.getByRole('combobox', { name: '主题', exact: true }).click();
  await page.getByRole('option', { name: '浅色主题', exact: true }).click();
  await page
    .locator('#industrial-readings')
    .screenshot({ path: 'test-results/industrial-readings-light.png' });
  expect(errors).toEqual([]);
});

test('工业组件窄屏 → 长标识、帧带与减少动效正确呈现', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/showcase/#industrial-cameras');
  const frame = page.getByRole('button', { name: '顶部 · OK', exact: true });
  await frame.focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('button', { name: '轮廓 · 采集中', exact: true })).toBeFocused();
  const strip = page.locator('#industrial-cameras .qs-camera-strip').first();
  expect(await strip.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  await expect(strip).toHaveAttribute('data-overflow-start', '');
  const side = page.getByRole('button', { name: '侧面 · NG', exact: true });
  await side.scrollIntoViewIfNeeded();
  const box = (await side.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect(await side.evaluate((node) => getComputedStyle(node).transform)).toBe('none');
  await page.mouse.up();
  await page.getByRole('button', { name: '网格', exact: true }).click();
  await page
    .locator('#industrial-cameras')
    .screenshot({ path: 'test-results/industrial-cameras-mobile.png' });
  await page.getByRole('button', { name: '判定 NG', exact: true }).click();
  await page.getByRole('switch', { name: '当前阶段呼吸点' }).check();
  expect(
    await page
      .locator('.qs-industrial-verdict')
      .first()
      .evaluate((node) => node.getAnimations().length),
  ).toBe(0);
  expect(
    await page
      .locator('#industrial-verdict .ph.cur .pulse')
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe('none');
  await page
    .locator('#industrial-verdict')
    .screenshot({ path: 'test-results/industrial-verdict-mobile.png' });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
