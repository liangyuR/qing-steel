import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Button,
  TextField,
  FormField,
  NumberField,
  SegmentedControl,
  Dialog,
  Drawer,
  ThemeProvider,
  Snackbar,
  SnackbarProvider,
  useSnackbar,
  Tabs,
  Menu,
} from '../src';

describe('表单与选择的对外契约', () => {
  it('操作按钮位于表单内 → 默认不提交，加载时不能重复操作', async () => {
    const user = userEvent.setup();
    let actions = 0;
    let submissions = 0;
    render(
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submissions++;
        }}
      >
        <Button onClick={() => actions++}>保存</Button>
        <Button loading onClick={() => actions++}>
          执行中
        </Button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: '保存' }));
    await user.click(screen.getByRole('button', { name: '执行中' }));
    expect(actions).toBe(1);
    expect(submissions).toBe(0);
  });
  it('独立表单项包含错误 → 标签、必填与错误描述关联到原生输入', () => {
    render(
      <FormField label="方案名称" error="名称已被使用" required>
        <TextField />
      </FormField>,
    );
    const input = screen.getByRole('textbox', { name: /方案名称/ });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('名称已被使用');
    expect(screen.getByText('方案名称')).toHaveAttribute('for', input.id);
  });
  it('数字输入清空、越界或含多位小数 → 保留空值，失焦时限制范围并取精度', () => {
    render(<NumberField label="阈值" defaultValue={2.5} min={0} max={10} precision={2} />);
    const input = screen.getByRole('spinbutton', { name: '阈值' });
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(input).toHaveValue(null);
    fireEvent.change(input, { target: { value: '12.346' } });
    fireEvent.blur(input);
    expect(input).toHaveValue(10);
    fireEvent.change(input, { target: { value: '1.234' } });
    fireEvent.blur(input);
    expect(input).toHaveValue(1.23);
  });
  it('受控多选分段 → 切换单项保留其他项，禁用项不可加入', async () => {
    const user = userEvent.setup();
    function Demo() {
      const [value, setValue] = useState(['a']);
      return (
        <SegmentedControl
          label="视图"
          multiple
          value={value}
          onValueChange={setValue}
          options={[
            { value: 'a', label: '图像' },
            { value: 'b', label: '读数' },
            { value: 'c', label: '日志', disabled: true },
          ]}
        />
      );
    }
    render(<Demo />);
    await user.click(screen.getByRole('button', { name: /读数/ }));
    expect(screen.getByRole('button', { name: /图像/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /读数/ })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: /图像/ }));
    await user.click(screen.getByRole('button', { name: /日志/ }));
    expect(screen.getByRole('button', { name: /图像/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /日志/ })).toHaveAttribute('aria-pressed', 'false');
  });
});
describe('浮层集成', () => {
  it('外部按钮受控打开对话框 → 关闭后返回实际触发按钮', async () => {
    const user = userEvent.setup();
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>外部打开</Button>
          <Dialog title="受控对话框" open={open} onOpenChange={setOpen}>
            内容
          </Dialog>
        </>
      );
    }
    render(
      <ThemeProvider>
        <Demo />
      </ThemeProvider>,
    );
    const button = screen.getByRole('button', { name: '外部打开' });
    await user.click(button);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });
  it.each([Dialog, Drawer])(
    '浮层打开并关闭 → 继承局部主题、关联说明，焦点返回触发按钮',
    async (Component) => {
      const user = userEvent.setup();
      render(
        <ThemeProvider defaultTheme="light">
          <Component title="编辑配置" description="保存后生效" trigger={<Button>打开</Button>}>
            <TextField label="备注" />
          </Component>
        </ThemeProvider>,
      );
      const trigger = screen.getByRole('button', { name: '打开' });
      await user.click(trigger);
      const dialog = screen.getByRole('dialog', { name: '编辑配置' });
      expect(dialog).toHaveAccessibleDescription('保存后生效');
      expect(dialog.closest('.qs-scheme-light')).not.toBeNull();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    },
  );
  it('禁止关闭的对话框 → Escape 和关闭按钮不会丢弃正在执行的操作', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Dialog defaultOpen closeDisabled title="处理中">
          <p>请稍候</p>
        </Dialog>
      </ThemeProvider>,
    );
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '关闭' })).toBeDisabled();
  });
  it('菜单键盘选择 → 禁用项被跳过，业务操作执行并关闭菜单', async () => {
    const user = userEvent.setup();
    function Demo() {
      const [result, setResult] = useState('原始配置');
      return (
        <>
          <p>{result}</p>
          <Menu
            trigger={<Button>操作</Button>}
            items={[
              { id: 'locked', label: '锁定项', disabled: true },
              { id: 'copy', label: '复制', onSelect: () => setResult('配置副本') },
            ]}
          />
        </>
      );
    }
    render(
      <ThemeProvider>
        <Demo />
      </ThemeProvider>,
    );
    screen.getByRole('button', { name: '操作' }).focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{Enter}');
    expect(screen.getByText('配置副本')).toBeVisible();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
  it('标签页方向键导航 → 跳过禁用页并展示对应内容', async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        label="详情"
        items={[
          { value: 'a', label: '概览', content: '概览内容' },
          { value: 'b', label: '历史', disabled: true, content: '历史内容' },
          { value: 'c', label: '参数', content: '参数内容' },
        ]}
      />,
    );
    screen.getByRole('tab', { name: '概览' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: '参数' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('参数内容');
  });
});
describe('瞬时反馈计时', () => {
  it('悬停与聚焦同时存在 → 两者都结束后才恢复剩余计时', () => {
    vi.useFakeTimers();
    try {
      function Demo() {
        const [open, setOpen] = useState(true);
        return open ? (
          <Snackbar
            duration={4000}
            onDismiss={() => setOpen(false)}
            action={{ label: '撤销', onClick: () => {} }}
          >
            已保存
          </Snackbar>
        ) : (
          <p>已关闭</p>
        );
      }
      render(<Demo />);
      const snack = screen.getByRole('status');
      act(() => vi.advanceTimersByTime(1000));
      fireEvent.mouseEnter(snack);
      fireEvent.focus(screen.getByRole('button', { name: '撤销' }));
      act(() => vi.advanceTimersByTime(5000));
      fireEvent.mouseLeave(snack);
      act(() => vi.advanceTimersByTime(5000));
      expect(screen.getByText('已保存')).toBeVisible();
      fireEvent.blur(screen.getByRole('button', { name: '撤销' }), {
        relatedTarget: document.body,
      });
      act(() => vi.advanceTimersByTime(2999));
      expect(screen.getByText('已保存')).toBeVisible();
      act(() => vi.advanceTimersByTime(1));
      expect(screen.getByText('已关闭')).toBeVisible();
    } finally {
      vi.useRealTimers();
    }
  });
  it('新提示替换旧提示 → 旧计时器不能关闭新提示，撤销动作执行', () => {
    vi.useFakeTimers();
    try {
      function Demo() {
        const { show } = useSnackbar();
        const [value, setValue] = useState('已保存');
        return (
          <>
            <p>{value}</p>
            <Button onClick={() => show({ text: '旧提示', duration: 2000 })}>旧</Button>
            <Button
              onClick={() =>
                show({
                  text: '新提示',
                  duration: 4000,
                  action: { label: '撤销', onClick: () => setValue('已撤销') },
                })
              }
            >
              新
            </Button>
          </>
        );
      }
      render(
        <SnackbarProvider>
          <Demo />
        </SnackbarProvider>,
      );
      fireEvent.click(screen.getByRole('button', { name: '旧' }));
      act(() => vi.advanceTimersByTime(1000));
      fireEvent.click(screen.getByRole('button', { name: '新' }));
      act(() => vi.advanceTimersByTime(1500));
      expect(screen.queryByText('旧提示')).not.toBeInTheDocument();
      expect(screen.getByText('新提示')).toBeVisible();
      fireEvent.click(within(screen.getByRole('status')).getByRole('button', { name: '撤销' }));
      expect(screen.getByText('已撤销')).toBeVisible();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
