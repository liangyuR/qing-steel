import { test, expect, type Locator } from '@playwright/test';

const layer = (target: Locator) => target.evaluate((el) => getComputedStyle(el, '::after').opacity);

test('媒体误报不可悬停 → 按钮与标签各渲染路径仍响应鼠标，触摸清除悬停层', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true });
  try {
    const page = await context.newPage();
    await page.goto('/showcase/');
    expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
    const actions = page.locator('#actions');
    const controls = [
      actions.getByRole('button', { name: '新建项目', exact: true }),
      actions.getByRole('button', { name: '订阅通知', exact: true }),
      actions.getByRole('link', { name: '回到本节', exact: true }),
      actions.getByRole('link', { name: '打开配方库', exact: true }),
      actions.getByRole('button', { name: '仅显示异常', exact: true }),
    ];
    for (const control of controls) {
      await control.hover();
      await expect.poll(() => layer(control)).toBe('0.08');
      await control.tap();
      await expect.poll(() => layer(control)).toBe('0');
    }
    for (const name of ['不可操作', '不可操作标签']) {
      const disabled = actions.getByRole('button', { name, exact: true });
      await disabled.hover({ force: true });
      expect(await disabled.evaluate((el) => getComputedStyle(el, '::after').display)).toBe('none');
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await controls[0].hover();
    await expect.poll(() => layer(controls[0])).toBe('0.08');
    const box = (await controls[0].boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    expect(await controls[0].evaluate((el) => getComputedStyle(el).transform)).toBe('none');
    await page.mouse.up();
  } finally {
    await context.close();
  }
});
