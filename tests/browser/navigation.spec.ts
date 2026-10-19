import { test, expect, type Locator, type Page } from '@playwright/test';

const settled = (page: Page) =>
  expect
    .poll(() =>
      page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === 'running').length +
          document.querySelectorAll('.qs-navigation[data-motion]').length,
      ),
    )
    .toBe(0);

async function open(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/showcase/');
  const drawer = page.getByRole('navigation', { name: '展开导航示例' });
  await drawer.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await settled(page);
  return { drawer, errors };
}

const indicatorOffset = (nav: Locator) =>
  nav.evaluate((el) => {
    const active = el.querySelector(
      ".qs-navigation-items .qs-navigation-item[aria-current='page']",
    );
    const indicator = el.querySelector('.qs-navigation-items > .selection-track-indicator');
    if (!active || !indicator) return Infinity;
    const a = active.getBoundingClientRect();
    const b = indicator.getBoundingClientRect();
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.height - b.height);
  });

test('收起导航抽屉 → 布局宽度只切换一次，图标列不横移，右侧内容连续跟随', async ({ page }) => {
  const { drawer, errors } = await open(page);
  const trace = await drawer.evaluate(async (nav) => {
    const icon = nav.querySelector('.qs-navigation-icon')!;
    const content = document.querySelector('.navigation-demo-content')!;
    const widths = new Set<number>();
    const iconCenters: number[] = [];
    const contentLefts: number[] = [];
    let overflow = 0;
    const root = document.documentElement;
    nav.querySelector<HTMLButtonElement>('.qs-navigation-toggle')!.click();
    const start = performance.now();
    while (performance.now() - start < 900) {
      await new Promise(requestAnimationFrame);
      widths.add((nav as HTMLElement).offsetWidth);
      const box = icon.getBoundingClientRect();
      iconCenters.push(box.left + box.width / 2);
      contentLefts.push(content.getBoundingClientRect().left);
      overflow = Math.max(overflow, root.scrollWidth - root.clientWidth);
    }
    return { widths: [...widths], iconCenters, contentLefts, overflow };
  });
  expect(trace.widths.sort((a, b) => a - b)).toEqual([72, 220]);
  expect(trace.overflow).toBe(0);
  expect(Math.max(...trace.iconCenters) - Math.min(...trace.iconCenters)).toBeLessThan(1.5);
  const jumps = trace.contentLefts
    .slice(1)
    .map((left, i) => Math.abs(left - trace.contentLefts[i]));
  expect(Math.max(...jumps)).toBeLessThan(80);
  expect(trace.contentLefts[0] - trace.contentLefts[trace.contentLefts.length - 1]).toBeGreaterThan(
    140,
  );
  await settled(page);
  const toggle = drawer.getByRole('button', { name: '展开导航' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(errors).toEqual([]);
});

test('切换过程中再次点击 → 立即反向并停在最后请求的状态，文字与指示器恢复可见', async ({
  page,
}) => {
  const { drawer, errors } = await open(page);
  const toggle = drawer.locator('.qs-navigation-toggle');
  await toggle.click();
  await page.waitForTimeout(200);
  await toggle.click();
  await settled(page);
  expect(await drawer.evaluate((el) => (el as HTMLElement).offsetWidth)).toBe(220);
  await expect(drawer.getByRole('button', { name: '收起导航' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  const opacity = await drawer.evaluate((el) =>
    [
      ...el.querySelectorAll(
        '.qs-navigation-label, .qs-navigation-items > .selection-track-indicator',
      ),
    ].map((node) => getComputedStyle(node).opacity),
  );
  expect(new Set(opacity)).toEqual(new Set(['1']));
  expect(
    await page.locator('.navigation-demo-content').evaluate((el) => getComputedStyle(el).transform),
  ).toBe('none');
  for (let i = 0; i < 3; i++) await toggle.click();
  await settled(page);
  expect(await drawer.evaluate((el) => (el as HTMLElement).offsetWidth)).toBe(72);
  expect(errors).toEqual([]);
});

test('展开途中反向收起 → 可见底板右缘从当前位置单调回到 72，不塌缩到 rail 以内', async ({
  page,
}) => {
  const { drawer, errors } = await open(page);
  const toggle = drawer.locator('.qs-navigation-toggle');
  await toggle.click();
  await settled(page);
  const edges = await drawer.evaluate(async (nav) => {
    const button = nav.querySelector<HTMLButtonElement>('.qs-navigation-toggle')!;
    const frame = nav.querySelector('.qs-navigation-surface')!;
    const fill = frame.firstElementChild!;
    const edge = () =>
      Math.min(fill.getBoundingClientRect().right, frame.getBoundingClientRect().right) -
      nav.getBoundingClientRect().left;
    const next = () => new Promise(requestAnimationFrame);
    button.click();
    const deadline = performance.now() + 1000;
    while (edge() < 110 && performance.now() < deadline) await next();
    const samples = [edge()];
    button.click();
    samples.push(edge());
    const start = performance.now();
    while (performance.now() - start < 700) {
      await next();
      samples.push(edge());
    }
    return samples;
  });
  expect(edges[0]).toBeGreaterThan(100);
  expect(Math.min(...edges)).toBeGreaterThanOrEqual(71);
  edges.slice(1).forEach((value, i) => expect(value).toBeLessThanOrEqual(edges[i] + 0.5));
  expect(edges[edges.length - 1]).toBeCloseTo(72, 0);
  expect(errors).toEqual([]);
});

test('宿主链接给出选中态 → 抽屉指示器跟随链接的 aria-current，底部项可成为当前项', async ({
  page,
}) => {
  const { drawer } = await open(page);
  const rail = page.getByRole('navigation', { name: '紧凑导航示例' });
  await rail.getByRole('link', { name: '参数设置' }).click();
  await expect(drawer.getByRole('link', { name: '参数设置' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect.poll(() => indicatorOffset(drawer)).toBeLessThan(2);
  await drawer.getByRole('link', { name: '系统设置' }).click();
  await expect(rail.getByRole('link', { name: '系统设置' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(drawer.locator(".qs-navigation-item[aria-current='page']")).toHaveCount(1);
  await expect(drawer.locator('.qs-navigation-items > .selection-track-indicator')).toHaveCount(0);
  await drawer.getByRole('link', { name: '工作概览' }).click();
  await expect.poll(() => indicatorOffset(drawer)).toBeLessThan(2);
});

test('收起时显示小字标签 → 标签可见且悬停不弹出提示；默认收起悬停才出提示', async ({ page }) => {
  const { drawer } = await open(page);
  await drawer.locator('.qs-navigation-toggle').click();
  await settled(page);
  await drawer.getByRole('link', { name: '参数设置' }).hover();
  await expect(page.getByRole('tooltip', { name: '参数设置' })).toBeVisible();
  await page.mouse.move(1, 1);
  await page.getByRole('switch', { name: '收起时显示小字标签' }).check({ force: true });
  await settled(page);
  const label = drawer.getByRole('link', { name: '参数设置' }).locator('.qs-navigation-label');
  expect((await label.boundingBox())!.width).toBeGreaterThan(20);
  await drawer.getByRole('link', { name: '参数设置' }).hover();
  await page.waitForTimeout(600);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('吸顶顶栏 → 内容滚到下方时升一级表面，回到顶部恢复', async ({ page }) => {
  await page.goto('/showcase/');
  const scroller = page.locator('.appbar-scroll-demo');
  const bar = scroller.locator('.qs-appbar-sticky');
  await scroller.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(bar).not.toHaveAttribute('data-stuck');
  await scroller.evaluate((el) => el.scrollTo(0, 120));
  await expect(bar).toHaveAttribute('data-stuck', '');
  await scroller.evaluate((el) => el.scrollTo(0, 0));
  await expect(bar).not.toHaveAttribute('data-stuck');
});

test('减少动态效果 → 收起展开立即完成，不播放位移动画', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { drawer } = await open(page);
  await drawer.locator('.qs-navigation-toggle').click();
  expect(await drawer.evaluate((el) => (el as HTMLElement).offsetWidth)).toBe(72);
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
  await expect(drawer).not.toHaveAttribute('data-motion');
});
