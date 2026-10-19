import { createRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { DatePicker, TimePicker, ThemeProvider } from '../src';

it('直接输入保留 onChange、onValueChange、ref 和原生表单校验', () => {
  const ref = createRef<HTMLInputElement>();
  const change = vi.fn();
  const valueChange = vi.fn();
  render(
    <DatePicker
      ref={ref}
      label="日期"
      name="date"
      required
      min="2024-02-01"
      max="2024-02-29"
      onChange={(e) => change(e.target.value)}
      onValueChange={valueChange}
    />,
  );
  fireEvent.change(ref.current!, { target: { value: '2024-02-29' } });
  expect(change).toHaveBeenCalledWith('2024-02-29');
  expect(valueChange).toHaveBeenCalledWith('2024-02-29');
  expect(ref.current!.validity.valid).toBe(true);
  fireEvent.change(ref.current!, { target: { value: '2024-03-01' } });
  expect(ref.current!.validity.rangeOverflow).toBe(true);
});

it('受控时间确认只发出一次原生事件，取消不提交', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  function Demo() {
    const [value, setValue] = useState('09:30');
    return (
      <ThemeProvider>
        <TimePicker
          label="时间"
          value={value}
          onValueChange={setValue}
          onChange={(e) => change(e.target.value)}
        />
      </ThemeProvider>
    );
  }
  render(<Demo />);
  await user.click(screen.getByRole('button', { name: '打开时间选择' }));
  await user.click(screen.getAllByRole('radio', { name: /^10$/ })[0]);
  await user.click(screen.getByRole('button', { name: '确认' }));
  expect(screen.getByLabelText('时间', { exact: true })).toHaveValue('10:30');
  expect(change).toHaveBeenCalledExactlyOnceWith('10:30');
});

it('日期面板打开时点开另一个时间选择 → 旧面板关闭后不抢回焦点，新面板保持打开可继续选择', async () => {
  const user = userEvent.setup();
  render(
    <ThemeProvider>
      <DatePicker label="日期" />
      <TimePicker label="时间" defaultValue="09:30" />
    </ThemeProvider>,
  );
  await user.click(screen.getByRole('button', { name: '打开日期选择' }));
  await user.click(screen.getByRole('button', { name: '打开时间选择' }));
  await user.click(screen.getAllByRole('radio', { name: /^10$/ })[0]);
  const picker = screen.getByRole('dialog', { name: '时间选择' });
  expect(screen.queryByRole('dialog', { name: '日期选择' })).toBeNull();
  expect(picker).toContainElement(document.activeElement as HTMLElement);
});

it('表单重置恢复初始值，只读和禁用控件不开启面板', async () => {
  const user = userEvent.setup();
  render(
    <form>
      <TimePicker label="时间" name="time" defaultValue="08:00" />
      <DatePicker label="只读日期" readOnly />
      <TimePicker label="禁用时间" disabled />
      <button type="reset">重置</button>
    </form>,
  );
  fireEvent.change(screen.getByLabelText('时间', { exact: true }), { target: { value: '12:00' } });
  await user.click(screen.getByRole('button', { name: '重置' }));
  expect(screen.getByLabelText('时间', { exact: true })).toHaveValue('08:00');
  expect(screen.getByRole('button', { name: '打开只读日期选择' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '打开禁用时间选择' })).toBeDisabled();
});
