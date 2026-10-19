import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AnimatedNumber,
  CameraStrip,
  CameraThumbnail,
  InspectionStages,
  KpiGroup,
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
  it('等待状态开启 keepPreview → 保留预览并叠加自定义状态；未开启时用文字替换预览', () => {
    const preview = <svg role="img" aria-label="示教中线" />;
    const waiting: CameraFrame = {
      id: 'k3',
      cameraId: 'camera-2',
      label: 'k3',
      state: 'waiting',
      stateLabel: '未示教',
      preview,
    };
    const { rerender } = render(<CameraThumbnail frame={{ ...waiting, keepPreview: true }} />);
    expect(screen.getByRole('img', { name: '示教中线' })).toBeInTheDocument();
    expect(screen.getByRole('group')).toHaveAccessibleName('k3 · 未示教');
    expect(screen.getByRole('group').querySelector('.qs-camera-overlay')).toHaveTextContent(
      '未示教',
    );
    rerender(<CameraThumbnail frame={waiting} />);
    expect(screen.queryByRole('img', { name: '示教中线' })).not.toBeInTheDocument();
  });
  it('传入 aria-label、aria-pressed 与 onClick → 覆盖默认名称和按下态，点击仍触发选择', async () => {
    const onSelect = vi.fn();
    const onClick = vi.fn();
    render(
      <CameraThumbnail
        frame={frames[0]}
        selected
        onSelect={onSelect}
        onClick={onClick}
        aria-label="拍照点 k1 检测图"
        aria-pressed="mixed"
      />,
    );
    const button = screen.getByRole('button', { name: '拍照点 k1 检测图' });
    expect(button).toHaveAttribute('aria-pressed', 'mixed');
    await userEvent.setup().click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('one');
  });
  it('宿主渲染预览遇到其它工件的帧 → 只为本件帧调用，旧帧不显示宿主内容', () => {
    const renderPreview = vi.fn((frame: CameraFrame) => <canvas aria-label={`${frame.id} 实时`} />);
    render(
      <CameraStrip
        frames={[frames[0], { ...frames[1], cycleId: 'cycle-0' }]}
        cycleId="cycle-1"
        renderPreview={renderPreview}
      />,
    );
    expect(screen.getByLabelText('one 实时')).toBeInTheDocument();
    expect(screen.queryByLabelText('two 实时')).not.toBeInTheDocument();
    expect(renderPreview.mock.calls.every(([frame]) => frame.id === 'one')).toBe(true);
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
  it('无值且 pendingLabel 为 null → 只显示占位横线，不显示未测文字', () => {
    render(<MeasurementReading label="收尾耗时" value={null} unit="ms" pendingLabel={null} />);
    const reading = screen.getByRole('group', { name: '收尾耗时' });
    expect(reading).toHaveTextContent('—');
    expect(reading).not.toHaveTextContent('未测');
  });
  it('文字读数 → 作为有效值按状态显示，不进入未测', () => {
    render(<MeasurementReading label="最近出图" value="刚刚" status="ok" />);
    const reading = screen.getByRole('group', { name: '最近出图' });
    expect(reading).toHaveAttribute('data-state', 'ok');
    expect(within(reading).getByText('刚刚')).toBeVisible();
  });
  it('指定空格分组符 → 读数与范围都按空格千分位显示', () => {
    render(
      <MeasurementReading
        label="帧计数"
        value={1234567}
        precision={0}
        groupSeparator=" "
        limits={{ max: 20000 }}
      />,
    );
    const reading = screen.getByRole('group', { name: '帧计数' });
    expect(reading.querySelector('.qs-sr-only')).toHaveTextContent(/^1 234 567$/);
    expect(reading.querySelector('.qs-measurement-limits')).toHaveTextContent('20 000');
  });
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
  it('连续 NG 结果 → 仅新结果 ID 到达时强调一次；普通重绘或故障恢复后的同一结果不再强调', () => {
    const original = HTMLElement.prototype.animate;
    const animate = vi.fn(
      (_frames: Keyframe[] | PropertyIndexedKeyframes | null) =>
        ({ cancel: vi.fn() }) as unknown as Animation,
    );
    HTMLElement.prototype.animate = animate;
    const emphasis = () =>
      animate.mock.calls.filter(([frames]) => JSON.stringify(frames).includes('scale(1.02)'))
        .length;
    try {
      const { rerender, unmount } = render(<VerdictCard result={result} />);
      const card = screen.getByRole('region');
      card.style.setProperty('--dur-long', '400ms');
      card.style.setProperty('--dur-medium', '240ms');
      rerender(<VerdictCard result={{ ...result }} />);
      expect(animate).not.toHaveBeenCalled();
      rerender(<VerdictCard result={{ ...result, id: 'result-2' }} />);
      expect(emphasis()).toBe(1);
      rerender(<VerdictCard result={{ ...result, id: 'result-2', description: '更新说明' }} />);
      rerender(<VerdictCard result={{ ...result, id: 'result-2' }} state="fault" />);
      rerender(<VerdictCard result={{ ...result, id: 'result-2' }} />);
      expect(card).toHaveAttribute('data-verdict', 'ng');
      expect(emphasis()).toBe(1);
      unmount();
    } finally {
      HTMLElement.prototype.animate = original;
    }
  });
});

describe('判定卡宿主文案与产线头部', () => {
  const excursion: InspectionResult = {
    id: 'r-7',
    cycleId: 'cycle-7',
    verdict: 'warn',
    code: 'OK',
    title: '局部超差',
    serialNumber: 'SN-007',
  };
  it('结果自带大字与副标题且 SN 放在头部 → 显示 OK 与局部超差，可访问名称带 SN，页脚不重复 SN', () => {
    render(
      <VerdictCard
        label="判定结果"
        cycleId="cycle-7"
        result={excursion}
        serialPlacement="header"
        meta={(shown) => `PLC ${shown ? 1 : '—'}`}
      />,
    );
    const card = screen.getByRole('region', { name: '判定结果 · SN SN-007' });
    expect(card).toHaveAttribute('data-verdict', 'warn');
    expect(within(card).getByText('OK')).toBeVisible();
    expect(within(card).getByText('局部超差')).toBeVisible();
    expect(within(card).getByText('PLC 1')).toBeVisible();
    expect(within(card).getAllByText(/SN-007/)).toHaveLength(1);
    expect(card).not.toHaveTextContent('尚未收到检测结果');
  });
  it('切换到新工件而旧结果仍在 → 头部不带旧 SN，meta 收到 null，运行描述用宿主文案', () => {
    const meta = vi.fn((shown: InspectionResult | null) => (shown ? 'PLC 1' : 'PLC —'));
    render(
      <VerdictCard
        label="判定结果"
        cycleId="cycle-8"
        state="running"
        result={excursion}
        serialPlacement="header"
        meta={meta}
        stateContent={{ running: { description: 'SN SN-008 · 帧 3 / 12' } }}
      />,
    );
    const card = screen.getByRole('region', { name: '判定结果' });
    expect(meta).toHaveBeenLastCalledWith(null);
    expect(card).toHaveTextContent('PLC —');
    expect(card).toHaveTextContent('SN SN-008 · 帧 3 / 12');
    expect(card).not.toHaveTextContent('SN-007');
    expect(card).not.toHaveTextContent('等待当前工件的检测结果');
  });
  it('故障时保留本件判定 → 有效结果继续显示；没有本件结果时仍显示 ERR', () => {
    const { rerender } = render(
      <VerdictCard cycleId="cycle-7" result={excursion} state="fault" keepResultOnFault />,
    );
    const card = screen.getByRole('region');
    expect(card).toHaveAttribute('data-verdict', 'warn');
    expect(card).toHaveAttribute('data-device-state', 'fault');
    rerender(<VerdictCard cycleId="cycle-8" result={excursion} state="fault" keepResultOnFault />);
    expect(card).toHaveAttribute('data-verdict', 'fault');
    expect(within(card).getByText('ERR')).toBeVisible();
  });
});

describe('计数与 KPI', () => {
  it.each([
    [0, 'neutral'],
    [3, 'ng'],
  ])('NG 计数为 %s → 色调 %s，标签只出现一次', (count, tone) => {
    render(
      <KpiGroup
        label="今日统计"
        items={[
          { id: 'ok', label: 'OK', value: 12, tone: 'ok' },
          { id: 'ng', label: 'NG', value: count, tone: 'ng' },
        ]}
      />,
    );
    const stat = screen.getByRole('group', { name: 'NG' });
    expect(stat).toHaveAttribute('data-tone', tone);
    expect(
      within(screen.getByRole('region', { name: '今日统计' })).getAllByText('NG'),
    ).toHaveLength(1);
    expect(stat).toHaveTextContent(String(count));
  });
});
