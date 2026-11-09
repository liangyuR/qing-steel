import { test, expect, type Locator } from '@playwright/test';

const transform = (card: Locator) => card.evaluate((el) => getComputedStyle(el).transform);
const stateLayer = (card: Locator) =>
  card.evaluate((el) => getComputedStyle(el, '::before').opacity);

test('显式启用卡片悬停 → 放大但不改变布局，普通卡片保持静态，菜单操作后恢复', async ({ page }) => {
  await page.goto('/showcase/');
  const card = page.locator('.qs-card-hover');
  const plain = page.getByRole('region', { name: '普通配方卡片', exact: true });
  await plain.hover();
  expect(await transform(plain)).toBe('none');
  const size = await card.evaluate((el) => [el.clientWidth, el.clientHeight]);
  await card.hover();
  await expect.poll(() => transform(card)).toBe('matrix(1.02, 0, 0, 1.02, 0, -4)');
  expect(await card.evaluate((el) => [el.clientWidth, el.clientHeight])).toEqual(size);
  expect(await card.evaluate((el) => getComputedStyle(el).boxShadow)).toBe('none');
  const trigger = card.getByRole('button', { name: '更多配方操作' });
  await trigger.click();
  const copy = page.getByRole('menuitem', { name: '复制配方' });
  await copy.hover();
  await expect.poll(() => transform(card)).toBe('matrix(1.02, 0, 0, 1.02, 0, -4)');
  await copy.click();
  await expect(card.getByRole('status')).toHaveText('配方已复制');
  await expect(trigger).toBeFocused();
  await plain.hover();
  await expect.poll(() => transform(card)).toBe('none');
});

test('减少动态效果与键盘操作 → 无缩放位移，保留状态反馈且按钮可操作', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/showcase/');
  const card = page.locator('.qs-card-hover');
  await card.hover();
  expect(await transform(card)).toBe('none');
  expect(await stateLayer(card)).toBe('0.08');
  await page.mouse.move(0, 0);
  const open = card.getByRole('button', { name: '打开配方' });
  await open.focus();
  expect(await stateLayer(card)).toBe('0.08');
  await page.keyboard.press('Enter');
  await expect(card.getByRole('status')).toHaveText('配方已打开');
});

test('触摸设备操作卡片 → 按钮生效且不残留悬停缩放', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true });
  try {
    const page = await context.newPage();
    await page.goto('/showcase/');
    const card = page.locator('.qs-card-hover');
    await card.getByRole('button', { name: '打开配方' }).tap();
    await expect(card.getByRole('status')).toHaveText('配方已打开');
    expect(await transform(card)).toBe('none');
  } finally {
    await context.close();
  }
});
