import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FileInput,
  NumberField,
  SegmentedControl,
  Select,
  ThemeProvider,
  type SelectOption,
} from '../src';

const cameras: SelectOption<ReactNode>[] = [
  {
    value: 'cam-1',
    label: (
      <>
        <i className="dot ok" />
        CAM-01 <small>顶部相机</small>
      </>
    ),
    textValue: 'CAM-01',
    'aria-label': '顶部相机 CAM-01',
  },
  {
    value: 'cam-2',
    label: (
      <>
        <i className="dot warn" />
        CAM-02 <small>侧面相机</small>
      </>
    ),
    textValue: 'CAM-02',
    'aria-label': '侧面相机 CAM-02',
  },
];

describe('Select 的可测试性与可访问性', () => {
  it('按值操作原生 select → 触发按钮的 data-value 与可见文字同步更新', async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(
      <Select
        label="环境"
        defaultValue="production"
        onValueChange={changed}
        options={[
          { value: 'production', label: '生产环境' },
          { value: 'debug', label: '调试环境' },
        ]}
      />,
    );
    const trigger = screen.getByRole('combobox', { name: '环境' });
    expect(trigger).toHaveAttribute('data-value', 'production');
    const field = trigger.closest('.qs-select') as HTMLElement;
    await user.selectOptions(field.querySelector('select')!, 'debug');
    expect(changed).toHaveBeenCalledExactlyOnceWith('debug');
    expect(trigger).toHaveAttribute('data-value', 'debug');
    expect(trigger).toHaveTextContent('调试环境');
  });

  it('选项 label 为节点 → 选项按 aria-label 命名，原生 option 使用 textValue', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ThemeProvider>
        <Select aria-label="当前相机" name="camera" options={cameras} />
      </ThemeProvider>,
    );
    expect(
      Array.from(container.querySelectorAll('select option')).map((item) => item.textContent),
    ).toEqual(['CAM-01', 'CAM-02']);
    await user.click(screen.getByRole('combobox', { name: '当前相机' }));
    await user.click(screen.getByRole('option', { name: '侧面相机 CAM-02' }));
    expect(screen.getByRole('combobox', { name: '当前相机' })).toHaveAttribute(
      'data-value',
      'cam-2',
    );
    expect(container.querySelector('select')).toHaveValue('cam-2');
  });

  it('位于禁用的 fieldset 内 → 指针按下不打开选项列表', () => {
    render(
      <ThemeProvider>
        <fieldset disabled>
          <Select label="检测模式" options={[{ value: 'strict', label: '严格' }]} />
        </fieldset>
      </ThemeProvider>,
    );
    fireEvent.pointerDown(screen.getByRole('combobox', { name: '检测模式' }), {
      button: 0,
      ctrlKey: false,
      pointerType: 'mouse',
    });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

it('分段选项 label 为节点并带 aria-label → 按 aria-label 定位与切换', async () => {
  const user = userEvent.setup();
  function Demo() {
    const [value, setValue] = useState('cam-1');
    return (
      <SegmentedControl label="切换相机" value={value} onValueChange={setValue} options={cameras} />
    );
  }
  render(<Demo />);
  const group = screen.getByRole('group', { name: '切换相机' });
  await user.click(within(group).getByRole('button', { name: '侧面相机 CAM-02' }));
  expect(within(group).getByRole('button', { name: '侧面相机 CAM-02' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(within(group).getByRole('button', { name: '顶部相机 CAM-01' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

it('数字输入 clamp={false} 越界 → 失焦后保留输入、标记无效并提示范围，回到范围内恢复', () => {
  render(
    <form>
      <NumberField label="曝光" unit="μs" min={100} max={5000} step="any" clamp={false} />
    </form>,
  );
  const input = screen.getByRole('spinbutton', { name: '曝光' }) as HTMLInputElement;
  fireEvent.change(input, { target: { value: '6200' } });
  fireEvent.blur(input);
  expect(input).toHaveValue(6200);
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('应在 100–5000 μs 之间');
  expect(input.form!.checkValidity()).toBe(false);
  fireEvent.change(input, { target: { value: '1234.567' } });
  fireEvent.blur(input);
  expect(input).toHaveValue(1234.567);
  expect(input).not.toHaveAttribute('aria-invalid');
  expect(input.form!.checkValidity()).toBe(true);
});

describe('FileInput', () => {
  const png = (name: string) => new File(['x'], name, { type: 'image/png' });

  it('选择文件 → 通知文件列表并显示文件名，表单重置后清空', async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(
      <form>
        <FileInput label="k1 原图" accept=".png" onFilesChange={changed} />
        <button type="reset">重置</button>
      </form>,
    );
    const input = screen.getByLabelText('k1 原图');
    await user.upload(input, png('k1.png'));
    expect(changed).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'k1.png' })]);
    expect(screen.getByText('k1.png')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重置' }));
    expect(changed).toHaveBeenLastCalledWith([]);
    expect(screen.queryByText('k1.png')).not.toBeInTheDocument();
  });

  it('拖放多个文件到单选输入 → 只取第一个；禁用时忽略拖放', () => {
    const changed = vi.fn();
    const { rerender, container } = render(
      <FileInput label="样本" dropzone onFilesChange={changed} />,
    );
    const zone = container.querySelector('.qs-file')!;
    const drop = () =>
      fireEvent.drop(zone, {
        dataTransfer: { files: [png('a.png'), png('b.png')], types: ['Files'] },
      });
    drop();
    expect(changed).toHaveBeenCalledExactlyOnceWith([expect.objectContaining({ name: 'a.png' })]);
    rerender(<FileInput label="样本" dropzone disabled onFilesChange={changed} />);
    drop();
    expect(changed).toHaveBeenCalledOnce();
  });
});
