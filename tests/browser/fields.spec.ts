import { expect, test } from '@playwright/test';

test('自绘的开关、复选与单选 → 原生控件仍接收指针，已开启的开关可直接点击关闭', async ({
  page,
}) => {
  await page.goto('/showcase/#selection');
  const running = page.getByRole('switch', { name: '自动运行' });
  await expect(running).toBeChecked();
  await running.uncheck({ timeout: 5000 });
  await expect(running).not.toBeChecked();
  const record = page.getByRole('checkbox', { name: '保存检测记录' });
  await record.uncheck({ timeout: 5000 });
  await expect(record).not.toBeChecked();
  const strict = page.getByRole('radio', { name: '严格' });
  await strict.check({ timeout: 5000 });
  await expect(strict).toBeChecked();
});

test('文档中的按值选择方式 → Playwright 操作原生 select 后触发按钮同步', async ({ page }) => {
  await page.goto('/showcase/#forms');
  const trigger = page.getByRole('combobox', { name: '运行环境' });
  const field = page.locator('.qs-select').filter({ has: trigger });
  await field.locator('select').selectOption('local');
  await expect(trigger).toHaveAttribute('data-value', 'local');
  await expect(trigger).toHaveText('本地回放');
  await expect(field.locator('select')).toHaveValue('local');
});

test('文件输入 → 按标签 setInputFiles 显示文件名，拖放多张图片进入原生 input', async ({ page }) => {
  await page.goto('/showcase/#forms');
  await page.getByLabel('标定原图').setInputFiles('tokens.json');
  await expect(page.locator('.qs-file-name', { hasText: 'tokens.json' })).toBeVisible();
  const zone = page.locator('.qs-file.dropzone');
  await zone.evaluate((element) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['a'], 'k1.png', { type: 'image/png' }));
    transfer.items.add(new File(['b'], 'k2.png', { type: 'image/png' }));
    element.dispatchEvent(
      new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }),
    );
  });
  await expect(zone.locator('li')).toHaveText([/k1\.png/, /k2\.png/]);
  expect(
    await page.getByLabel('样本组原图').evaluate((input: HTMLInputElement) => input.files?.length),
  ).toBe(2);
});
