import { useRef, type RefObject } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Alert,
  Button,
  Dialog,
  NumberField,
  SnackbarProvider,
  TextField,
  ThemeProvider,
  Tooltip,
  useSnackbar,
  type DialogInitialFocus,
} from '../src';

function Show({ texts }: { texts: string[] }) {
  const { show } = useSnackbar();
  return (
    <>
      {texts.map((text) => (
        <Button key={text} onClick={() => show({ text, duration: 0 })}>
          {`显示${text}`}
        </Button>
      ))}
    </>
  );
}
const statusTexts = () =>
  screen.getAllByRole('status').map((node) => node.querySelector('.msg')?.textContent);

describe('全局提示的宿主与堆叠', () => {
  it('container 为子树挂载的 ref → 提示渲染进宿主容器', async () => {
    const user = userEvent.setup();
    function Host() {
      const anchor = useRef<HTMLDivElement>(null);
      return (
        <SnackbarProvider placement="top" container={anchor}>
          <section>
            <div data-testid="anchor" ref={anchor} />
            <Show texts={['已保存']} />
          </section>
        </SnackbarProvider>
      );
    }
    render(<Host />);
    await user.click(screen.getByRole('button', { name: '显示已保存' }));
    expect(within(screen.getByTestId('anchor')).getByRole('status')).toHaveTextContent('已保存');
  });
  it('堆叠上限为 2 时连续显示三条 → 只保留最新两条', async () => {
    const user = userEvent.setup();
    render(
      <SnackbarProvider max={2}>
        <Show texts={['A', 'B', 'C']} />
      </SnackbarProvider>,
    );
    for (const name of ['显示A', '显示B', '显示C'])
      await user.click(screen.getByRole('button', { name }));
    expect(statusTexts()).toEqual(['B', 'C']);
  });
  it('堆叠模式下关闭其中一条 → 其余提示保持显示', async () => {
    const user = userEvent.setup();
    render(
      <SnackbarProvider max={3}>
        <Show texts={['A', 'B', 'C']} />
      </SnackbarProvider>,
    );
    for (const name of ['显示A', '显示B', '显示C'])
      await user.click(screen.getByRole('button', { name }));
    const second = screen.getAllByRole('status')[1];
    await user.click(within(second).getByRole('button', { name: '关闭提示' }));
    expect(statusTexts()).toEqual(['A', 'C']);
  });
  it('没有 SnackbarProvider 时显示提示 → 不抛错，只警告一次', async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(<Show texts={['A', 'B']} />);
      await user.click(screen.getByRole('button', { name: '显示A' }));
      await user.click(screen.getByRole('button', { name: '显示B' }));
      expect(warn).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    } finally {
      warn.mockRestore();
    }
  });
});

describe('持续提示的播报角色', () => {
  it.each([
    ['warn', undefined, 'status'],
    ['ng', undefined, 'alert'],
    ['warn', 'alert', 'alert'],
  ] as const)('tone=%s role=%s → 以 %s 播报', (tone, role, expected) => {
    render(
      <Alert tone={tone} role={role}>
        胶宽接近上限
      </Alert>,
    );
    expect(screen.getByRole(expected)).toHaveTextContent('胶宽接近上限');
  });
});

describe('对话框初始焦点', () => {
  function Form({ confirm }: { confirm?: RefObject<HTMLButtonElement | null> }) {
    return (
      <>
        <TextField label="批次" disabled />
        <TextField label="编号" defaultValue="SHOT-03" readOnly />
        <NumberField label="曝光" defaultValue={1200} />
        <NumberField label="增益" id="gain" defaultValue={2} />
        <Button id="locked" disabled>
          锁定
        </Button>
        <Button ref={confirm}>确认</Button>
      </>
    );
  }
  it.each<
    [
      string,
      (confirm: RefObject<HTMLButtonElement | null>) => DialogInitialFocus,
      () => HTMLElement,
    ]
  >([
    [
      'first-field 跳过禁用与只读',
      () => 'first-field',
      () => screen.getByRole('spinbutton', { name: '曝光' }),
    ],
    ['选择器', () => '#gain', () => screen.getByRole('spinbutton', { name: '增益' })],
    ['ref', (confirm) => confirm, () => screen.getByRole('button', { name: '确认' })],
    [
      '选择器无匹配时回退默认',
      () => 'textarea',
      () => screen.getByRole('button', { name: '关闭' }),
    ],
    [
      '选择器指向无法聚焦的禁用按钮时回退默认',
      () => '#locked',
      () => screen.getByRole('button', { name: '关闭' }),
    ],
  ])('initialFocus 为%s → 聚焦目标，关闭后回到触发按钮', async (_, focus, expected) => {
    const user = userEvent.setup();
    function Demo() {
      const confirm = useRef<HTMLButtonElement>(null);
      return (
        <Dialog title="编辑参数" trigger={<Button>打开</Button>} initialFocus={focus(confirm)}>
          <Form confirm={confirm} />
        </Dialog>
      );
    }
    render(
      <ThemeProvider>
        <Demo />
      </ThemeProvider>,
    );
    const trigger = screen.getByRole('button', { name: '打开' });
    await user.click(trigger);
    expect(expected()).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe('可固定的提示气泡', () => {
  it('点击固定后移开指针与失焦仍显示 → Escape、再次点击或外部点击收起', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Tooltip pinnable content="曝光时长说明">
          <Button>说明</Button>
        </Tooltip>
        <Button>其他</Button>
      </ThemeProvider>,
    );
    const trigger = screen.getByRole('button', { name: '说明' });
    const other = screen.getByRole('button', { name: '其他' });
    await user.click(trigger);
    await user.unhover(trigger);
    await user.tab();
    expect(other).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('曝光时长说明');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await user.click(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await user.click(trigger);
    await user.click(other);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
