import { test, expect } from '@playwright/test';

test('参数对话框 size=lg → 桌面宽 720 px、窄屏不超出视口，焦点落在首个可编辑输入', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/showcase/');
  await page.getByRole('button', { name: '参数编辑', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '编辑拍照点参数' });
  await expect(dialog.getByRole('spinbutton', { name: '曝光时长' })).toBeFocused();
  await expect.poll(async () => Math.round((await dialog.boundingBox())!.width)).toBe(720);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await dialog.boundingBox())!.width).toBeLessThanOrEqual(390 - 32);
});

test('容器内顶部堆叠 → 提示贴容器顶部，超出上限后保留最新三条且最新在上', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/showcase/');
  const card = page
    .locator('.demo-card')
    .filter({ has: page.locator('code', { hasText: /^SnackbarProvider$/ }) });
  await card.scrollIntoViewIfNeeded();
  for (let i = 0; i < 4; i++) await card.getByRole('button', { name: '追加提示' }).click();
  const statuses = card.getByRole('status');
  await expect(statuses).toHaveCount(3);
  await expect
    .poll(() =>
      card.evaluate(
        (el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
      ),
    )
    .toBe(0);
  const stage = await card.locator('.qs-snackbars').evaluate((el) => {
    const box = el.parentElement!.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom };
  });
  const boxes = await statuses.evaluateAll((nodes) =>
    nodes
      .map((node) => ({ top: node.getBoundingClientRect().top, text: node.textContent ?? '' }))
      .sort((a, b) => a.top - b.top),
  );
  expect(boxes[0].top - stage.top).toBeGreaterThanOrEqual(8);
  expect(boxes[0].top - stage.top).toBeLessThanOrEqual(24);
  expect(boxes[0].text).toContain('标定结果超过 7 天');
  expect(boxes.at(-1)!.top).toBeLessThan(stage.bottom);
  expect(errors).toEqual([]);
});
