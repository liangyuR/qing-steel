import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  memo,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { cx } from './core';
import { Alert } from './feedback';
import { EmptyState, Icon } from './primitives';

function motion(element: HTMLElement, frames: Keyframe[], durationToken: string) {
  if (!element.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const css = getComputedStyle(element);
  const token = css.getPropertyValue(durationToken).trim();
  const duration = parseFloat(token) * (token.endsWith('ms') ? 1 : 1000);
  if (!Number.isFinite(duration) || duration <= 0) return;
  return element.animate(frames, {
    duration,
    easing: css.getPropertyValue('--ease-decel').trim() || 'ease-out',
  });
}
export type InspectionVerdict = 'ok' | 'ng' | 'warn' | 'fault';
export interface InspectionResult {
  id: string;
  cycleId: string;
  verdict: InspectionVerdict;
  description?: string;
  serialNumber?: string;
  durationMs?: number;
}
export interface VerdictCardProps {
  result?: InspectionResult | null;
  cycleId?: string;
  state?: 'idle' | 'running' | 'fault';
  faultMessage?: string;
  size?: 'md' | 'lg';
  emphasize?: boolean;
  label?: string;
  className?: string;
}
const verdictLabels = {
  ok: ['OK', '检测合格'],
  ng: ['NG', '检测不合格'],
  warn: ['WARN', '需要复核'],
  fault: ['ERR', '检测异常'],
  idle: ['—', '等待检测'],
  running: ['RUN', '检测中'],
} as const;
export function VerdictCard({
  result,
  cycleId,
  state = 'idle',
  faultMessage,
  size = 'lg',
  emphasize = true,
  label = '整件判定',
  className,
}: VerdictCardProps) {
  const validResult =
    result && (cycleId === undefined || result.cycleId === cycleId) ? result : null;
  const outcome = state === 'fault' ? 'fault' : (validResult?.verdict ?? state);
  const [code, title] = verdictLabels[outcome];
  const description =
    state === 'fault'
      ? (faultMessage ?? '请检查设备或测量流程。')
      : (validResult?.description ??
        (result && !validResult
          ? '等待当前工件的检测结果。'
          : outcome === 'running'
            ? '正在采集与测量，尚未形成最终判定。'
            : '尚未收到检测结果。'));
  const ref = useRef<HTMLElement>(null);
  const key = `${outcome}:${validResult?.cycleId ?? cycleId ?? ''}:${validResult?.id ?? ''}`;
  const previous = useRef(key);
  useLayoutEffect(() => {
    const changed = previous.current !== key;
    previous.current = key;
    if (!changed || !emphasize || outcome !== 'ng' || !ref.current) return;
    const animation = motion(
      ref.current,
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.02)', offset: 0.4 },
        { transform: 'scale(1)' },
      ],
      '--dur-long',
    );
    return () => animation?.cancel();
  }, [key, outcome, emphasize]);
  return (
    <section
      ref={ref}
      aria-label={label}
      aria-live="polite"
      aria-atomic="true"
      data-verdict={outcome}
      className={cx(
        'qs-verdict',
        'qs-industrial-verdict',
        outcome === 'running' ? 'run' : outcome,
        size === 'lg' && 'xl',
        className,
      )}
    >
      <div className="qs-verdict-header">
        <span>{label}</span>
        <span className="qs-num">{cycleId ?? validResult?.cycleId ?? '未开始'}</span>
      </div>
      <div className="big">{code}</div>
      <div className="t">{title}</div>
      <div className="d">{description}</div>
      {validResult && state !== 'fault' && (
        <div className="foot">
          {validResult.serialNumber && <span>SN {validResult.serialNumber}</span>}
          <span>结果 {validResult.id}</span>
          {validResult.durationMs !== undefined && Number.isFinite(validResult.durationMs) && (
            <span>{validResult.durationMs} ms</span>
          )}
        </div>
      )}
    </section>
  );
}

export interface InspectionStep {
  id: string;
  label: string;
}
export interface InspectionStagesProps {
  steps: InspectionStep[];
  currentStepId?: string | null;
  completedStepIds?: string[];
  fault?: { stepId?: string; message: string } | null;
  pulse?: boolean;
  label?: string;
  className?: string;
}
export function InspectionStages({
  steps,
  currentStepId,
  completedStepIds = [],
  fault,
  pulse = false,
  label = '检测阶段',
  className,
}: InspectionStagesProps) {
  return (
    <section className={cx('qs-inspection-stages', className)} aria-label={label}>
      <ol className="qs-cycle">
        {steps.map((step, index) => {
          const failed = fault?.stepId === step.id;
          const current = !fault && step.id === currentStepId;
          const done = !failed && !current && completedStepIds.includes(step.id);
          const text = failed ? '故障' : current ? '进行中' : done ? '已完成' : '待执行';
          return (
            <li
              key={step.id}
              aria-current={current || failed ? 'step' : undefined}
              data-state={failed ? 'fault' : current ? 'active' : done ? 'complete' : 'pending'}
            >
              <span
                className={cx(
                  'ph',
                  done && 'done',
                  (current || failed) && 'cur',
                  failed && 'fault',
                )}
              >
                <span className="g" aria-hidden="true">
                  <span className="n">{index + 1}</span>
                  {done ? (
                    <Icon className="qs-ic">
                      <path d="m5 12 4 4L19 6" />
                    </Icon>
                  ) : (
                    <span className={cx('pulse', (!pulse || !!fault) && 'qs-no-pulse')} />
                  )}
                </span>
                {step.label}
                <span className="qs-sr-only">：{text}</span>
              </span>
              {index < steps.length - 1 && (
                <span aria-hidden="true" className={cx('ln', done && 'done')} />
              )}
            </li>
          );
        })}
      </ol>
      {fault && <Alert tone="fault">{fault.message}</Alert>}
    </section>
  );
}

export type CameraFrameState =
  'waiting' | 'capturing' | 'ok' | 'ng' | 'warn' | 'fault' | 'missing' | 'skipped';
export interface CameraFrame {
  id: string;
  cameraId: string;
  label: string;
  cycleId?: string;
  state: CameraFrameState;
  src?: string;
  alt?: string;
  preview?: ReactNode;
  detail?: string;
  channel?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  disabled?: boolean;
}
const frameLabels: Record<CameraFrameState, string> = {
  waiting: '等待采集',
  capturing: '采集中',
  ok: 'OK',
  ng: 'NG',
  warn: '待复核',
  fault: '测量异常',
  missing: '未收到帧',
  skipped: '不检测',
};
export interface CameraThumbnailProps {
  frame: CameraFrame;
  selected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}
function CameraThumbnailView({ frame, selected, onSelect, className }: CameraThumbnailProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageFailed = !!frame.src && failedSrc === frame.src;
  const unavailable =
    frame.state === 'waiting' ||
    frame.state === 'capturing' ||
    frame.state === 'missing' ||
    frame.state === 'skipped';
  const preview = unavailable ? (
    <span>{frameLabels[frame.state]}</span>
  ) : frame.src ? (
    imageFailed ? (
      <span>图像加载失败</span>
    ) : (
      <img
        key={frame.src}
        src={frame.src}
        alt={frame.alt ?? `${frame.label}采集图像`}
        onError={() => setFailedSrc(frame.src!)}
      />
    )
  ) : (
    (frame.preview ?? <span>暂无预览</span>)
  );
  const content = (
    <>
      <span className="qs-camera-heading">
        <span className="qs-num">{frame.label}</span>
        <span className={`qs-frame-state qs-frame-${frame.state}`}>{frameLabels[frame.state]}</span>
      </span>
      <span className="qs-camera-preview">{preview}</span>
      <span className="qs-camera-meta">
        <span
          className="qs-channel-dot"
          aria-hidden="true"
          style={{ background: `var(--cam-${frame.channel ?? 1})` }}
        />
        <span>{frame.cameraId}</span>
        <span className="qs-camera-frame-id">{frame.id}</span>
      </span>
      {frame.detail && <span className="qs-camera-detail">{frame.detail}</span>}
      {imageFailed && !unavailable && (
        <span className="qs-camera-detail qs-error">预览不可用，检测状态未改变</span>
      )}
    </>
  );
  const classes = cx('qs-camera-thumbnail', selected && 'qs-camera-selected', className);
  return onSelect ? (
    <button
      type="button"
      className={classes}
      disabled={frame.disabled}
      aria-label={`${frame.label} · ${frameLabels[frame.state]}`}
      aria-pressed={!!selected}
      onClick={() => onSelect(frame.id)}
      data-frame-id={frame.id}
    >
      {content}
    </button>
  ) : (
    <div
      className={classes}
      role="group"
      aria-label={`${frame.label} · ${frameLabels[frame.state]}`}
      data-frame-id={frame.id}
    >
      {content}
    </div>
  );
}
export const CameraThumbnail = memo(
  CameraThumbnailView,
  (a, b) =>
    a.selected === b.selected &&
    a.onSelect === b.onSelect &&
    a.className === b.className &&
    Object.keys(a.frame).length === Object.keys(b.frame).length &&
    (Object.keys(a.frame) as (keyof CameraFrame)[]).every((key) => a.frame[key] === b.frame[key]),
);
export interface CameraStripProps {
  frames: CameraFrame[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string) => void;
  cycleId?: string;
  layout?: 'strip' | 'grid';
  label?: string;
  className?: string;
}
export function CameraStrip({
  frames,
  value,
  defaultValue = null,
  onValueChange,
  cycleId,
  layout = 'strip',
  label = '相机帧',
  className,
}: CameraStripProps) {
  const [localSelection, setLocalSelection] = useState({ cycleId, id: defaultValue });
  const selected =
    value === undefined ? (localSelection.cycleId === cycleId ? localSelection.id : null) : value;
  const setSelected = useCallback(
    (id: string) => {
      if (value === undefined) setLocalSelection({ cycleId, id });
      onValueChange?.(id);
    },
    [value, cycleId, onValueChange],
  );
  const root = useRef<HTMLDivElement>(null);
  const shown = frames.map((frame) =>
    cycleId !== undefined && frame.cycleId !== cycleId
      ? {
          ...frame,
          state: 'waiting' as const,
          src: undefined,
          preview: undefined,
          detail: '等待当前工件采集',
        }
      : frame,
  );
  useEffect(() => {
    if (layout !== 'strip') return;
    const container = root.current;
    const reveal = () => {
      const active = container?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!active || !container) return;
      const rect = active.getBoundingClientRect();
      const parent = container.getBoundingClientRect();
      if (rect.left < parent.left) container.scrollLeft -= parent.left - rect.left;
      else if (rect.right > parent.right) container.scrollLeft += rect.right - parent.right;
    };
    reveal();
    let frame = 0;
    const schedule = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          reveal();
        });
    };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    if (container) observer?.observe(container);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [selected, cycleId, layout, frames.map((frame) => frame.id).join('\0')]);
  if (!frames.length)
    return <EmptyState title="暂无相机帧" description="收到采集帧后将在此显示。" />;
  return (
    <div
      ref={root}
      role="group"
      aria-label={label}
      className={cx('qs-camera-strip', layout === 'grid' && 'qs-camera-grid', className)}
      onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const buttons = Array.from(
          root.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
        );
        const index = buttons.indexOf(event.target as HTMLButtonElement);
        if (index < 0) return;
        event.preventDefault();
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? buttons.length - 1
              : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next].focus();
        buttons[next].click();
      }}
    >
      {shown.map((frame) => (
        <CameraThumbnail
          key={`${cycleId ?? ''}:${frame.id}`}
          frame={frame}
          selected={selected === frame.id}
          onSelect={(id) => setSelected(id)}
        />
      ))}
    </div>
  );
}

const numberFormats = new Map<string, Intl.NumberFormat>();
const decimalMarks = new Map<string, string>();
function formatNumber(
  value: number | null | undefined,
  precision: number,
  locale: string,
  useGrouping: boolean,
) {
  if (value == null || !Number.isFinite(value)) return null;
  const digits = Number.isFinite(precision) ? Math.max(0, Math.min(20, Math.trunc(precision))) : 2;
  const normalized = Number(value.toFixed(digits)) === 0 ? 0 : value;
  const key = JSON.stringify([locale, digits, useGrouping]);
  let formatter = numberFormats.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping,
    });
    if (numberFormats.size >= 32) numberFormats.delete(numberFormats.keys().next().value!);
    numberFormats.set(key, formatter);
  }
  return formatter.format(normalized);
}
const NumberCharacter = memo(function NumberCharacter({
  character,
  animate,
}: {
  character: string;
  animate: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(character);
  const lastChange = useRef<number | null>(null);
  useLayoutEffect(() => {
    const old = previous.current;
    previous.current = character;
    if (!animate || old === character || !/\d/.test(old) || !/\d/.test(character) || !ref.current)
      return;
    const now = performance.now();
    const token = getComputedStyle(ref.current).getPropertyValue('--dur-short').trim();
    const minimum = parseFloat(token) * (token.endsWith('ms') ? 1 : 1000);
    const rapid = lastChange.current !== null && now - lastChange.current < minimum;
    lastChange.current = now;
    if (rapid) return; // Streaming values stay legible instead of repeatedly fading to 25%.
    const animation = motion(
      ref.current,
      [
        { transform: 'translateY(60%)', opacity: 0.25 },
        { transform: 'translateY(0)', opacity: 1 },
      ],
      '--dur-medium',
    );
    return () => animation?.cancel();
  }, [character, animate]);
  return (
    <span className="qs-reading-character">
      <span ref={ref}>{character}</span>
    </span>
  );
});
export interface AnimatedNumberProps {
  value: number | null | undefined;
  precision?: number;
  locale?: string;
  useGrouping?: boolean;
  animate?: boolean;
  placeholder?: string;
  className?: string;
}
export function AnimatedNumber({
  value,
  precision = 2,
  locale = 'zh-CN',
  useGrouping = false,
  animate = true,
  placeholder = '—',
  className,
}: AnimatedNumberProps) {
  const text = formatNumber(value, precision, locale, useGrouping);
  let decimal = decimalMarks.get(locale);
  if (!decimal) {
    decimal =
      new Intl.NumberFormat(locale).formatToParts(1.1).find((part) => part.type === 'decimal')
        ?.value ?? '.';
    if (decimalMarks.size >= 32) decimalMarks.delete(decimalMarks.keys().next().value!);
    decimalMarks.set(locale, decimal);
  }
  const decimalIndex = text?.indexOf(decimal) ?? -1;
  return (
    <span className={cx('qs-animated-number', 'qs-num', className)}>
      <span className="qs-sr-only">{text ?? placeholder}</span>
      <span aria-hidden="true">
        {text === null
          ? placeholder
          : [...text].map((character, index) => (
              <NumberCharacter
                key={decimalIndex >= 0 ? index - decimalIndex : index - text.length}
                character={character}
                animate={animate}
              />
            ))}
      </span>
    </span>
  );
}
export interface MeasurementReadingProps extends AnimatedNumberProps {
  label: string;
  unit?: string;
  status?: 'neutral' | InspectionVerdict;
  stale?: boolean;
  limits?: { min?: number; max?: number };
  description?: ReactNode;
  size?: 'md' | 'lg';
}
function MeasurementReadingView({
  label,
  unit,
  status = 'neutral',
  stale = false,
  limits,
  description,
  size = 'lg',
  className,
  ...number
}: MeasurementReadingProps) {
  const id = useId();
  const available = number.value != null && Number.isFinite(number.value);
  const effective = stale ? 'stale' : !available && status !== 'fault' ? 'pending' : status;
  const labels = {
    neutral: '',
    ok: 'OK',
    ng: 'NG',
    warn: '待复核',
    fault: '测量异常',
    pending: '未测',
    stale: '历史值',
  };
  const formatLimit = (value: number | undefined) =>
    formatNumber(
      value,
      number.precision ?? 2,
      number.locale ?? 'zh-CN',
      number.useGrouping ?? false,
    ) ?? '—';
  return (
    <div
      role="group"
      aria-labelledby={id}
      className={cx(
        'qs-measurement',
        `qs-measurement-${effective}`,
        size === 'md' && 'qs-measurement-md',
        className,
      )}
      data-state={effective}
    >
      <div className="qs-measurement-heading">
        <span id={id}>{label}</span>
        {labels[effective] && <span className="qs-measurement-state">{labels[effective]}</span>}
      </div>
      <div className="qs-measurement-value">
        <AnimatedNumber {...number} />
        <span className="qs-measurement-unit">{unit}</span>
      </div>
      {limits && (
        <div className="qs-measurement-limits">
          范围{' '}
          <span className="qs-num">
            {formatLimit(limits.min)} – {formatLimit(limits.max)}
          </span>
          {unit && ` ${unit}`}
        </div>
      )}
      {description && <div className="qs-measurement-description">{description}</div>}
    </div>
  );
}
export const MeasurementReading = memo(MeasurementReadingView);
export interface MeasurementItem extends MeasurementReadingProps {
  id: string;
}
export function MeasurementReadings({
  items,
  label = '测量读数',
  minWidth = 160,
  className,
}: {
  items: MeasurementItem[];
  label?: string;
  minWidth?: number;
  className?: string;
}) {
  return (
    <section
      aria-label={label}
      className={cx('qs-measurement-grid', className)}
      style={{ '--measurement-min': `${minWidth}px` } as CSSProperties}
    >
      {items.map(({ id, ...item }) => (
        <MeasurementReading key={id} {...item} />
      ))}
    </section>
  );
}
