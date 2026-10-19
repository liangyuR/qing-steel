import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AnimatedNumber,
  CameraStrip,
  CameraThumbnail,
  InspectionStages,
  MeasurementReading,
  VerdictCard,
  type CameraFrame,
  type InspectionResult,
} from '../src';

const result: InspectionResult = {
  id: 'result-1',
  cycleId: 'cycle-1',
  verdict: 'ng',
  serialNumber: 'old-serial',
  description: '旧工件不合格',
  durationMs: 123,
};
const frames: CameraFrame[] = [
  {
    id: 'one',
    cameraId: 'camera-1',
    label: '顶部',
    cycleId: 'cycle-1',
    state: 'ok',
    src: '/top.png',
  },
  {
    id: 'two',
    cameraId: 'camera-2',
    label: '侧面',
    cycleId: 'cycle-1',
    state: 'ng',
    src: '/side.png',
  },
  {
    id: 'three',
    cameraId: 'camera-3',
    label: '禁用',
    cycleId: 'cycle-1',
    state: 'skipped',
    disabled: true,
  },
];
describe('工件与判定隔离', () => {
  it('工件编号变化但保留旧结果 → 只展示本件运行态，不泄露旧判定和序列号', () => {
    const { rerender } = render(<VerdictCard result={result} cycleId="cycle-1" />);
    expect(screen.getByRole('region', { name: '整件判定' })).toHaveAttribute('data-verdict', 'ng');
    rerender(<VerdictCard result={result} cycleId="cycle-2" state="running" />);
    expect(screen.getByRole('region', { name: '整件判定' })).toHaveAttribute(
      'data-verdict',
      'running',
    );
    expect(screen.queryByText('NG')).not.toBeInTheDocument();
    expect(screen.queryByText(/old-serial/)).not.toBeInTheDocument();
    expect(screen.queryByText('旧工件不合格')).not.toBeInTheDocument();
  });
  it('设备故障与旧 OK 结果同时存在 → ERR 优先，恢复后才能显示判定', () => {
    const { rerender } = render(
      <VerdictCard result={{ ...result, verdict: 'ok' }} state="fault" faultMessage="相机断开" />,
    );
    expect(screen.getByText('ERR')).toBeVisible();
    expect(screen.getByText('相机断开')).toBeVisible();
    expect(screen.queryByText('OK')).not.toBeInTheDocument();
    rerender(<VerdictCard result={{ ...result, verdict: 'ok' }} />);
    expect(screen.getByText('OK')).toBeVisible();
  });
  it('已完成步骤未连续或当前步骤故障 → 不推断其它步骤已完成，不保留运行态', () => {
    const steps = [
      { id: 'a', label: '校验' },
      { id: 'b', label: '采集' },
      { id: 'c', label: '判定' },
    ];
    const { container, rerender } = render(
      <InspectionStages steps={steps} currentStepId="c" completedStepIds={['a']} />,
    );
    expect(container.querySelectorAll('[data-state="complete"]')).toHaveLength(1);
    expect(screen.getByText('采集').closest('li')).toHaveAttribute('data-state', 'pending');
    rerender(
      <InspectionStages
        steps={steps}
        currentStepId="c"
        completedStepIds={['a']}
        fault={{ stepId: 'c', message: '测量超时' }}
        pulse
      />,
    );
    expect(container.querySelectorAll('[data-state="active"]')).toHaveLength(0);
    expect(screen.getByText('判定').closest('li')).toHaveAttribute('data-state', 'fault');
    expect(screen.getByRole('alert')).toHaveTextContent('测量超时');
  });
});
describe('相机帧状态', () => {
  it('方向键选择且帧重新排序 → 按稳定 ID 保持选择，跳过禁用帧；新工件清除非受控选择', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CameraStrip frames={frames} defaultValue="one" cycleId="cycle-1" />,
    );
    screen.getByRole('button', { name: '顶部 · OK' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: '侧面 · NG' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    rerender(
      <CameraStrip
        frames={[frames[1], frames[0], frames[2]]}
        defaultValue="one"
        cycleId="cycle-1"
      />,
    );
    expect(screen.getByRole('button', { name: '侧面 · NG' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    screen.getByRole('button', { name: '顶部 · OK' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: '侧面 · NG' })).toHaveFocus();
    rerender(<CameraStrip frames={frames} defaultValue="one" cycleId="cycle-2" />);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(
      screen
        .getAllByRole('button')
        .every((button) => button.getAttribute('aria-pressed') === 'false'),
    ).toBe(true);
    expect(screen.queryByText('NG')).not.toBeInTheDocument();
  });
  it('图片加载失败 → 给出预览错误，保留检测结论；换来源后可以重新加载', () => {
    const { rerender } = render(<CameraThumbnail frame={frames[1]} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('图像加载失败')).toBeVisible();
    expect(screen.getByText('NG')).toBeVisible();
    rerender(<CameraThumbnail frame={{ ...frames[1], src: '/retry.png' }} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/retry.png');
    expect(screen.queryByText('图像加载失败')).not.toBeInTheDocument();
    rerender(<CameraThumbnail frame={{ ...frames[1], state: 'missing' }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('group')).toHaveAccessibleName('侧面 · 未收到帧');
  });
});
describe('读数和变化动效', () => {
  it.each([null, undefined, NaN, Infinity])(
    '无效数值 %s → 显示未测和破折号，不能误报为零或 OK',
    (value) => {
      render(<MeasurementReading label="胶宽" value={value} unit="mm" status="ok" />);
      const reading = screen.getByRole('group', { name: '胶宽' });
      expect(reading).toHaveAttribute('data-state', 'pending');
      expect(within(reading).getByText('未测')).toBeVisible();
      expect(reading).not.toHaveTextContent('OK');
      expect(reading).not.toHaveTextContent('0.00');
    },
  );
  it('舍入为负零或显式历史值 → 规范化零值，历史状态覆盖正常状态', () => {
    const { rerender } = render(
      <MeasurementReading label="偏移" value={-0.0001} precision={2} status="ok" stale />,
    );
    const reading = screen.getByRole('group', { name: '偏移' });
    expect(reading).toHaveAttribute('data-state', 'stale');
    expect(reading).toHaveTextContent('历史值');
    expect(reading).not.toHaveTextContent('-0.00');
    rerender(<MeasurementReading label="偏移" value={0} precision={2} status="ok" />);
    expect(screen.getByRole('group')).toHaveAttribute('data-state', 'ok');
  });
  it('相同读数重绘或仅末位变化 → 只动画变化数字，不在挂载或相同值时播放', () => {
    const original = HTMLElement.prototype.animate;
    const animate = vi.fn(() => ({ cancel: vi.fn() }) as unknown as Animation);
    HTMLElement.prototype.animate = animate;
    try {
      const { container, rerender, unmount } = render(<AnimatedNumber value={12.34} />);
      container
        .querySelectorAll<HTMLElement>('.qs-reading-character > span')
        .forEach((node) => node.style.setProperty('--dur-medium', '240ms'));
      expect(animate).not.toHaveBeenCalled();
      rerender(<AnimatedNumber value={12.34} />);
      expect(animate).not.toHaveBeenCalled();
      rerender(<AnimatedNumber value={12.35} />);
      expect(animate).toHaveBeenCalledTimes(1);
      unmount();
    } finally {
      HTMLElement.prototype.animate = original;
    }
  });
  it('连续 NG 结果 → 仅新结果 ID 到达时强调一次，普通重绘不重复', () => {
    const original = HTMLElement.prototype.animate;
    const animate = vi.fn(() => ({ cancel: vi.fn() }) as unknown as Animation);
    HTMLElement.prototype.animate = animate;
    try {
      const { rerender, unmount } = render(<VerdictCard result={result} />);
      screen.getByRole('region').style.setProperty('--dur-long', '400ms');
      rerender(<VerdictCard result={{ ...result }} />);
      expect(animate).not.toHaveBeenCalled();
      rerender(<VerdictCard result={{ ...result, id: 'result-2' }} />);
      expect(animate).toHaveBeenCalledTimes(1);
      rerender(<VerdictCard result={{ ...result, id: 'result-2', description: '更新说明' }} />);
      expect(animate).toHaveBeenCalledTimes(1);
      unmount();
    } finally {
      HTMLElement.prototype.animate = original;
    }
  });
});
