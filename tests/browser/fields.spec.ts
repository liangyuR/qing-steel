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

test('强制色模式 → 选中的单选圆点以系统文字色填充，禁用项使用禁用色边框', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/showcase/#selection');
  const strict = page.getByRole('radio', { name: '严格' });
  const custom = page.getByRole('radio', { name: '自定义' });
  await expect(custom).toBeDisabled();
  await strict.check({ timeout: 5000 });
  const mark = (radio: typeof strict) =>
    radio.locator('xpath=following-sibling::*[contains(@class, "qs-radio-mark")]');
  const dot = await mark(strict).evaluate((el) => getComputedStyle(el, '::before').backgroundColor);
  const system = await page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.color = 'CanvasText';
    document.body.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  });
  expect(dot).toBe(system);
  const border = (radio: typeof strict) =>
    mark(radio).evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(await border(custom)).not.toBe(await border(strict));
});

test('FormField 内直接放置复选框 → 聚焦时选项文字保持原色，字段标题仍随焦点变色', async ({
  page,
}) => {
  await page.goto('/showcase/#selection');
  await page.evaluate(() => {
    const host = document.createElement('div');
    host.innerHTML =
      '<div class="qs-field qs-invalid" id="probe-field"><label for="probe-box">选项</label>' +
      '<label class="qs-choice qs-checkbox" id="probe-choice"><input id="probe-box" type="checkbox">' +
      '<span class="qs-checkbox-box"></span><span>启用复检</span></label></div>';
    document.body.append(host);
  });
  const color = (selector: string) =>
    page.locator(selector).evaluate((el) => getComputedStyle(el).color);
  const resting = await color('#probe-choice');
  const ng = await page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.color = 'var(--ng)';
    document.body.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  });
  await page.locator('#probe-box').focus();
  await expect.poll(() => color('#probe-field > label[for]')).toBe(ng);
  expect(await color('#probe-choice')).toBe(resting);
});

test('受控文件输入 → 宿主丢弃的文件不会留在原生 input，拒绝整批选择时恢复原值', async ({
  page,
}) => {
  await page.goto('/showcase/#forms');
  const native = page.getByLabel('样本组原图');
  const held = () =>
    native.evaluate((input: HTMLInputElement) =>
      Array.from(input.files ?? [], (file) => file.name),
    );
  const zone = page.locator('.qs-file.dropzone');
  await zone.evaluate((element) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['a'], 'a.png', { type: 'image/png' }));
    transfer.items.add(new File(['b'], 'b.txt', { type: 'text/plain' }));
    element.dispatchEvent(
      new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }),
    );
  });
  await expect(zone.locator('li')).toHaveText([/a\.png/]);
  await expect.poll(held).toEqual(['a.png']);
  await native.setInputFiles('tokens.json');
  await expect(zone.locator('li')).toHaveText([/a\.png/]);
  await expect.poll(held).toEqual(['a.png']);
});
