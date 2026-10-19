import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Select, ThemeProvider } from '../src';

const options = [
  {
    label: '在线环境',
    options: [
      { value: 'production', label: '生产环境' },
      { value: 'debug', label: '调试环境' },
      { value: 'archive', label: '归档环境', disabled: true },
    ],
  },
];

it('分组菜单保留原生 change、表单值与重置，禁用项不可选', async () => {
  const user = userEvent.setup();
  const changed = vi.fn();
  const { container } = render(
    <ThemeProvider>
      <form>
        <Select
          label="环境"
          name="env"
          defaultValue="debug"
          options={options}
          onChange={(event) => changed(event.target.value)}
        />
        <button type="reset">重置</button>
      </form>
    </ThemeProvider>,
  );
  await user.click(screen.getByRole('combobox', { name: '环境' }));
  expect(screen.getByRole('group', { name: '在线环境' })).toBeVisible();
  expect(screen.getByRole('option', { name: '归档环境' })).toHaveAttribute('aria-disabled', 'true');
  await user.click(screen.getByRole('option', { name: '生产环境' }));
  expect(changed).toHaveBeenCalledExactlyOnceWith('production');
  expect(new FormData(container.querySelector('form')!).get('env')).toBe('production');
  await user.click(screen.getByRole('button', { name: '重置' }));
  expect(screen.getByRole('combobox', { name: '环境' })).toHaveTextContent('调试环境');
  expect(new FormData(container.querySelector('form')!).get('env')).toBe('debug');
});

it('必填空值阻止提交并聚焦可见控件，受控值和禁用状态同步', async () => {
  const { container, rerender } = render(
    <Select label="环境" required placeholder="选择环境" options={options} value="" />,
  );
  const select = container.querySelector('select.qs-select-native')! as HTMLSelectElement;
  expect(select.checkValidity()).toBe(false);
  fireEvent.invalid(select);
  expect(screen.getByRole('combobox', { name: '环境' })).toHaveFocus();
  rerender(<Select label="环境" required options={options} value="debug" disabled />);
  expect(screen.getByRole('combobox', { name: '环境' })).toBeDisabled();
  expect(screen.getByRole('combobox', { name: '环境' })).toHaveTextContent('调试环境');
});
