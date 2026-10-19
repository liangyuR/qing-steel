import { test, expect, type Locator, type Page } from '@playwright/test';

async function pressed(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(200);
  const style = await target.evaluate((el) => {
    const s = getComputedStyle(el);
    return { transform: s.transform, radius: s.borderTopLeftRadius };
  });
  await page.mouse.up();
  return style;
}

test('按压按钮 → 只缩放不改圆角；减少动效时不缩放', async ({ page }) => {
  await page.goto('/showcase/');
  const button = page.locator('#actions').getByRole('button', { name: '新建项目' });
  const rest = await button.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  const press = await pressed(page, button);
  expect(press.transform).toMatch(/^matrix\(0\.98, 0, 0, 0\.98/);
  expect(press.radius).toBe(rest);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await pressed(page, button)).transform).toBe('none');
});

test('按钮渲染为 button 与链接 → 字重字号一致，Chip 静态与可点一致', async ({ page }) => {
  await page.goto('/showcase/');
  const font = (target: Locator) =>
    target.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.fontWeight} ${s.fontSize}`;
    });
  const actions = page.locator('#actions');
  expect(await font(actions.getByRole('link', { name: '打开配方库' }))).toBe(
    await font(actions.getByRole('button', { name: '保存配置' })),
  );
  expect(await font(actions.getByRole('button', { name: '应用推荐参数' }))).toBe(
    await font(actions.locator('span.qs-chip', { hasText: '只读标签' })),
  );
});

test('紧凑图标按钮放进卡片标题行 → 标题行保持 24 px，不被按钮撑高', async ({ page }) => {
  await page.goto('/showcase/');
  const region = page.getByRole('region', { name: '相机列表 3 / 8' });
  const button = region.getByRole('button', { name: '刷新相机列表' });
  const heading = region.locator('.qs-card-heading');
  expect(await button.boundingBox()).toMatchObject({ width: 24, height: 24 });
  expect((await heading.boundingBox())!.height).toBe(24);
});
