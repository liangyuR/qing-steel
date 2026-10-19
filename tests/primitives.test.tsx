import { createRef, forwardRef, type AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Card, Chip, IconButton } from '../src';

const RouterLink = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; onNavigate: (to: string) => void }
>(function RouterLink({ to, onNavigate, onClick, ...props }, ref) {
  return (
    <a
      {...props}
      ref={ref}
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        onNavigate(to);
      }}
    />
  );
});

describe('按钮的链接形态', () => {
  it('asChild 包住路由 Link → 渲染为带 href 的链接，点击时宿主与子元素的回调都执行并导航', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const hostClick = vi.fn();
    const linkClick = vi.fn();
    render(
      <Button asChild onClick={hostClick}>
        <RouterLink to="/recipe" onNavigate={navigate} onClick={linkClick}>
          打开配方库
        </RouterLink>
      </Button>,
    );
    const link = screen.getByRole('link', { name: '打开配方库' });
    expect(link).toHaveAttribute('href', '/recipe');
    await user.click(link);
    expect(linkClick).toHaveBeenCalledTimes(1);
    expect(hostClick).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/recipe');
  });
  it('asChild 子元素自带 ref → 宿主 ref 与子元素 ref 都指向同一个链接', () => {
    const hostRef = createRef<HTMLButtonElement>();
    const childRef = createRef<HTMLAnchorElement>();
    render(
      <IconButton asChild aria-label="返回历史列表" ref={hostRef}>
        <RouterLink to="/history" onNavigate={() => {}} ref={childRef}>
          ←
        </RouterLink>
      </IconButton>,
    );
    const link = screen.getByRole('link', { name: '返回历史列表' });
    expect(childRef.current).toBe(link);
    expect(hostRef.current).toBe(link);
  });
  it.each(['href', 'asChild'] as const)(
    '禁用的链接形态按钮（%s）→ 点击不导航、不触发回调，键盘 Tab 跳过',
    async (mode) => {
      const user = userEvent.setup();
      const navigate = vi.fn();
      const onClick = vi.fn();
      render(
        <>
          <Button>前一个</Button>
          {mode === 'href' ? (
            <Button href="/inspect" disabled onClick={onClick}>
              候选未就绪
            </Button>
          ) : (
            <Button asChild disabled onClick={onClick}>
              <RouterLink to="/inspect" onNavigate={navigate}>
                候选未就绪
              </RouterLink>
            </Button>
          )}
          <Button>后一个</Button>
        </>,
      );
      const link = screen.getByRole('link', { name: '候选未就绪' });
      expect(link).toHaveAttribute('aria-disabled', 'true');
      if (mode === 'href') expect(link).not.toHaveAttribute('href');
      await user.click(link);
      expect(onClick).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
      screen.getByRole('button', { name: '前一个' }).focus();
      await user.tab();
      expect(screen.getByRole('button', { name: '后一个' })).toHaveFocus();
    },
  );
});

describe('标签', () => {
  it('静态 Chip 带 title 等原生属性 → 透传到标签上，且不渲染为按钮', () => {
    render(
      <Chip title="型号由 PLC 下发的产品代码匹配" data-field="recipe">
        A-01 · v3
      </Chip>,
    );
    const chip = screen.getByTitle('型号由 PLC 下发的产品代码匹配');
    expect(chip).toHaveTextContent('A-01 · v3');
    expect(chip).toHaveAttribute('data-field', 'recipe');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('键值 Chip 用作筛选 → 可访问名称同时包含键与值', () => {
    render(
      <Chip label="相机 2" selected onClick={() => {}}>
        12 / 12 张
      </Chip>,
    );
    expect(screen.getByRole('button', { name: /相机 2\s*12 \/ 12 张/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('卡片语义', () => {
  it('as=section 带标题 → 以标题命名为区域，标题旁的操作可在区域内找到', () => {
    render(
      <Card
        as="section"
        title="触发接线"
        actions={
          <IconButton size="xs" aria-label="刷新接线状态">
            ↻
          </IconButton>
        }
      >
        内容
      </Card>,
    );
    const region = screen.getByRole('region', { name: '触发接线' });
    expect(within(region).getByRole('button', { name: '刷新接线状态' })).toBeInTheDocument();
  });
  it('默认 div 带标题 → 不暴露为区域，保持 0.8.0 的语义', () => {
    render(<Card title="触发接线">内容</Card>);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.getByText('触发接线').closest('[aria-labelledby]')).toBeNull();
  });
});
