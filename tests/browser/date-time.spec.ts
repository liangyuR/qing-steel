import { test, expect } from '@playwright/test';

test('日期和时间面板保留直接输入、范围校验与取消行为', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/showcase/#advanced-inputs');
  const date = page.getByLabel(/^计划日期/).and(page.locator('input'));
  await page.getByRole('button', { name: '打开计划日期选择', exact: true }).click();
  const calendar = page.getByRole('dialog', { name: '计划日期选择', exact: true });
  await expect(calendar).toBeVisible();
  await calendar.screenshot({ path: 'test-results/calendar-dark.png' });
  await calendar.locator('[data-day="2026-10-20"] button').click();
  await expect(date).toHaveValue('2026-10-20');
  await expect(date).toBeFocused();
  await date.fill('2026-11-01');
  expect(await date.evaluate((el: HTMLInputElement) => el.validity.rangeOverflow)).toBe(true);
  await date.fill('2026-10-20');
  await date.press('Alt+ArrowDown');
  await calendar.getByRole('button', { name: '下个月', exact: true }).click();
  await expect(calendar.locator('[data-day="2026-11-01"] button')).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(date).toHaveValue('2026-10-20');

  const time = page.getByLabel(/^开始时间/).and(page.locator('input'));
  await page.getByRole('button', { name: '打开开始时间选择' }).click();
  const picker = page.getByRole('dialog', { name: '开始时间选择', exact: true });
  await picker
    .getByRole('radiogroup', { name: '时', exact: true })
    .getByRole('radio', { name: '10', exact: true })
    .click();
  await picker
    .getByRole('radiogroup', { name: '分', exact: true })
    .getByRole('radio', { name: '45', exact: true })
    .click();
  await expect(time).toHaveValue('09:30');
  await picker.screenshot({ path: 'test-results/time-dark.png' });
  await picker.getByRole('button', { name: '确认', exact: true }).click();
  await expect(time).toHaveValue('10:45');
  await page.getByRole('button', { name: '打开开始时间选择' }).click();
  await picker
    .getByRole('radiogroup', { name: '时', exact: true })
    .getByRole('radio', { name: '11', exact: true })
    .click();
  await page.keyboard.press('Escape');
  await expect(time).toHaveValue('10:45');

  await page.getByRole('button', { name: '打开巡检时间选择' }).click();
  const scheduled = page.getByRole('dialog', { name: '巡检时间选择', exact: true });
  await expect(
    scheduled
      .getByRole('radiogroup', { name: '分', exact: true })
      .getByRole('radio', { name: '01', exact: true }),
  ).toBeDisabled();
  await scheduled
    .getByRole('radiogroup', { name: '分', exact: true })
    .getByRole('radio', { name: '15', exact: true })
    .click();
  await scheduled.getByRole('button', { name: '确认', exact: true }).click();
  await expect(page.getByLabel('巡检时间', { exact: true })).toHaveValue('08:15');
  await page.getByRole('button', { name: '打开精确采集时间选择' }).click();
  const precise = page.getByRole('dialog', { name: '精确采集时间选择', exact: true });
  await precise
    .getByRole('radiogroup', { name: '秒', exact: true })
    .getByRole('radio', { name: '20', exact: true })
    .click();
  await precise.getByRole('button', { name: '确认', exact: true }).click();
  await expect(page.getByLabel('精确采集时间', { exact: true })).toHaveValue('09:30:20');
  expect(errors).toEqual([]);
});

test('浅色和窄屏日历保持在视口内', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/showcase/');
  await page.getByRole('combobox', { name: '主题', exact: true }).click();
  await page.getByRole('option', { name: '浅色主题' }).click();
  await page.getByRole('button', { name: '打开计划日期选择' }).click();
  const calendar = page.getByRole('dialog', { name: '计划日期选择', exact: true });
  const box = await calendar.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await calendar.screenshot({ path: 'test-results/calendar-light-mobile.png' });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '打开开始时间选择' }).click();
  await page
    .getByRole('dialog', { name: '开始时间选择', exact: true })
    .screenshot({ path: 'test-results/time-light-mobile.png' });
});
