import { test, expect } from '@playwright/test';

test('数据行与折叠浮层 → 行操作、保留结果刷新、锁定区展开和悬停帮助在真实浏览器可用', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/showcase/');

  const history = page.getByRole('table', { name: '检测历史示例' });
  const rows = history.getByRole('row', { name: /^查看 SN GS2610/ });
  const snOf = async (index: number) =>
    (await rows.nth(index).getAttribute('aria-label'))!.replace(/^查看 SN | 的记录$/g, '');
  const sn = await snOf(0);
  await rows.nth(0).click();
  await expect(page.getByText(`打开 ${sn} 的检测记录`)).toBeVisible();
  const next = await snOf(1);
  await rows.nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(`打开 ${next} 的检测记录`)).toBeVisible();

  await page.locator('#data-display').getByRole('button', { name: '刷新', exact: true }).click();
  await expect(history).toHaveAttribute('aria-busy', 'true');
  await expect(history.getByRole('row', { name: `查看 SN ${sn} 的记录` })).toBeVisible();
  await expect(history).not.toHaveAttribute('aria-busy', 'true', { timeout: 3000 });
  await expect(history.getByRole('row', { name: `查看 SN ${sn} 的记录` })).toHaveCount(0);

  const limits = page.getByRole('table', { name: '判定限值示例' });
  const width = limits.getByRole('row').filter({ hasText: '胶宽' });
  await limits.getByRole('spinbutton', { name: '位置 · 下公差' }).click();
  await expect(limits.getByRole('row', { selected: true })).toContainText('位置');
  await width.getByText('不判胶宽').click();
  await expect(width).toHaveAttribute('aria-selected', 'true');
  await limits.getByRole('spinbutton', { name: '位置 · 下公差' }).fill('0.6');
  await expect(width).toHaveAttribute('aria-selected', 'true');

  const locked = page.locator('[data-shot=accordion-fieldset]');
  const lockedCard = page.locator('.demo-card').filter({ has: locked });
  const debug = locked.getByRole('button', { name: '高级参数（调试）' });
  await debug.click();
  await expect(debug).toHaveAttribute('aria-expanded', 'true');
  await expect(locked.getByRole('spinbutton', { name: /搜索半宽/ })).toBeDisabled();
  await lockedCard.getByRole('switch', { name: /锁定参数/ }).uncheck({ force: true });
  await locked.getByRole('textbox', { name: '调试备注' }).fill('现场备注');
  await debug.press('Enter');
  await expect(debug).toHaveAttribute('aria-expanded', 'false');
  await expect(locked.getByRole('textbox', { name: '调试备注' })).toBeHidden();
  await debug.press('Enter');
  await expect(locked.getByRole('textbox', { name: '调试备注' })).toHaveValue('现场备注');

  const help = page.getByRole('button', { name: '复位条件说明' });
  await help.hover();
  await expect(page.getByRole('tooltip')).toContainText('faultReset');
  await page.mouse.move(0, 0);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await help.click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('减少动态效果 → 折叠区与排序指示直接切换，没有运行中的动画', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/showcase/');
  const trigger = page.getByRole('button', { name: '键盘与交互' });
  await trigger.click();
  const sort = page.getByRole('table', { name: '检测记录示例' }).getByRole('button', {
    name: '测量值 / mm',
  });
  await sort.click();
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
  await expect(page.getByText('使用 Enter 展开当前项')).toBeVisible();
});
