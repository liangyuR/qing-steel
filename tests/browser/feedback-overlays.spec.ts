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

test('首个字段在折叠区 → 焦点落在首个可见字段并被限制在对话框内', async ({ page }) => {
  await page.goto('/tests/browser/probe/');
  await page.getByRole('button', { name: '打开折叠对话框' }).click();
  const dialog = page.getByRole('dialog', { name: '折叠字段对话框' });
  await expect(dialog.getByRole('spinbutton', { name: '可见字段' })).toBeFocused();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
});

test('标签切换到更宽的标签 → 指示器只位移与改宽，短线内缩不被缩放变形', async ({ page }) => {
  await page.goto('/tests/browser/probe/');
  const list = page.getByRole('tablist', { name: '探针标签' });
  await list.scrollIntoViewIfNeeded();
  const final = await list.getByRole('tab', { name: '一个很长很长很长的标签页' }).boundingBox();
  await list.getByRole('tab', { name: '一个很长很长很长的标签页' }).click();
  const sample = await list.evaluate(async (el) => {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const indicator = el.querySelector('.selection-track-indicator')!;
    return {
      transform: getComputedStyle(indicator).transform,
      width: indicator.getBoundingClientRect().width,
      running: indicator.getAnimations().length,
    };
  });
  expect(sample.running).toBe(1);
  expect(sample.transform.startsWith('matrix(1, 0, 0, 1')).toBe(true);
  expect(sample.width).toBeLessThan(final!.width - 1);
});

test('Provider 按帧重渲染 → 追加提示后补位动画在 dur-medium 内结束', async ({ page }) => {
  await page.goto('/tests/browser/probe/');
  const append = page.getByRole('button', { name: '追加提示' });
  for (let i = 0; i < 4; i++) await append.click();
  await expect(page.getByRole('status')).toHaveCount(3);
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            document
              .querySelector('.qs-snackbars')!
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === 'running').length,
        ),
      { timeout: 1000 },
    )
    .toBe(0);
});
