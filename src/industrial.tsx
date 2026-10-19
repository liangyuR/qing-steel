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
  type HTMLAttributes,
} from 'react';
import { cx } from './core';
import { Alert } from './feedback';
import { EmptyState, Icon } from './primitives';

function tokenMs(css: CSSStyleDeclaration, name: string) {
  const token = css.getPropertyValue(name).trim();
  const value = parseFloat(token) * (token.endsWith('ms') ? 1 : 1000);
  return Number.isFinite(value) ? value : 0;
}
const reducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const easingOf = (css: CSSStyleDeclaration, easing: string, fallback: string) =>
  easing.startsWith('--') ? css.getPropertyValue(easing).trim() || fallback : easing;

function motion(
  element: HTMLElement,
  frames: Keyframe[],
  durationToken: string,
  {
    easing = '--ease-decel',
    delay = 0,
    source = element,
  }: { easing?: string; delay?: number; source?: HTMLElement } = {},
) {
  if (!element.animate || reducedMotion()) return;
  const css = getComputedStyle(source);
  const duration = tokenMs(css, durationToken);
  if (duration <= 0) return;
  return element.animate(
    frames.map((frame) =>
      typeof frame.easing === 'string'
        ? { ...frame, easing: easingOf(css, frame.easing, 'ease') }
        : frame,
    ),
    {
      duration,
      delay,
      easing: easingOf(css, easing, 'ease-out'),
      fill: delay > 0 ? 'backwards' : 'none',
    },
  );
}
export type InspectionVerdict = 'ok' | 'ng' | 'warn' | 'fault';
export interface InspectionResult {
  id: string;
  cycleId: string;
  verdict: InspectionVerdict;
  code?: string;
  title?: string;
  description?: string;
  serialNumber?: string;
  durationMs?: number;
}
export type VerdictCardState = 'idle' | 'running' | 'fault';
export interface VerdictContent {
  code?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
}
export interface VerdictCardProps {
  result?: InspectionResult | null;
  cycleId?: string;
  state?: VerdictCardState;
  faultMessage?: string;
  keepResultOnFault?: boolean;
  stateContent?: Partial<Record<VerdictCardState, VerdictContent>>;
  serialPlacement?: 'footer' | 'header';
  meta?: ReactNode | ((result: InspectionResult | null) => ReactNode);
  showFooter?: boolean;
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
const emphasisFrames: Keyframe[] = [
  { transform: 'scale(1)', easing: '--ease-decel' },
  { transform: 'scale(1.02)', offset: 0.35, easing: '--ease-standard' },
  { transform: 'scale(1)' },
];
const enterFrames: Keyframe[] = [
  { opacity: 0, transform: 'translateY(6px)' },
  { opacity: 1, transform: 'none' },
];
export function VerdictCard({
  result,
  cycleId,
  state = 'idle',
  faultMessage,
  keepResultOnFault = false,
  stateContent,
  serialPlacement = 'footer',
  meta,
  showFooter = true,
  size = 'lg',
  emphasize = true,
  label = '整件判定',
  className,
}: VerdictCardProps) {
  const validResult =
    result && (cycleId === undefined || result.cycleId === cycleId) ? result : null;
  const shown = validResult && (state !== 'fault' || keepResultOnFault) ? validResult : null;
  const outcome = shown ? shown.verdict : state;
  const custom = shown ? undefined : stateContent?.[state];
  const code = shown
    ? (shown.code ?? verdictLabels[outcome][0])
    : (custom?.code ?? verdictLabels[outcome][0]);
  const title = shown
    ? (shown.title ?? verdictLabels[outcome][1])
    : (custom?.title ?? verdictLabels[outcome][1]);
  const description: ReactNode = shown
    ? shown.description
    : state === 'fault'
      ? (faultMessage ?? custom?.description ?? '请检查设备或测量流程。')
      : custom?.description !== undefined
        ? custom.description
        : result && !validResult
          ? '等待当前工件的检测结果。'
          : state === 'running'
            ? '正在采集与测量，尚未形成最终判定。'
            : '尚未收到检测结果。';
  const serial = serialPlacement === 'header' ? shown?.serialNumber : undefined;
  const heading = serial ? `${label} · SN ${serial}` : label;
  const ref = useRef<HTMLElement>(null);
  const key = `${outcome}:${shown?.cycleId ?? cycleId ?? ''}:${shown?.id ?? ''}`;
  const previous = useRef(key);
  const emphasized = useRef(outcome === 'ng' ? (shown?.id ?? null) : null);
  useLayoutEffect(() => {
    const changed = previous.current !== key;
    previous.current = key;
    const node = ref.current;
    if (!changed || !node) return;
    const step = tokenMs(getComputedStyle(node), '--dur-short') / 4;
    const animations = Array.from(
      node.querySelectorAll<HTMLElement>(':scope > .big, :scope > .t, :scope > .d, :scope > .foot'),
      (part, index) =>
        motion(part, enterFrames, '--dur-medium', { delay: index * step, source: node }),
    );
    if (emphasize && outcome === 'ng' && shown && emphasized.current !== shown.id) {
      emphasized.current = shown.id;
      animations.push(motion(node, emphasisFrames, '--dur-long', { easing: 'linear' }));
    }
    return () => animations.forEach((animation) => animation?.cancel());
  }, [key]);
  const metaContent =
    typeof meta === 'function'
      ? meta(shown)
      : (meta ?? <span className="qs-num">{cycleId ?? validResult?.cycleId ?? '未开始'}</span>);
  return (
    <section
      ref={ref}
      aria-label={heading}
      aria-live="polite"
      aria-atomic="true"
      data-verdict={outcome}
      data-device-state={state}
      className={cx(
        'qs-verdict',
        'qs-industrial-verdict',
        outcome === 'running' ? 'run' : outcome,
        size === 'lg' && 'xl',
        className,
      )}
    >
      <div className="qs-verdict-header">
        <span className="qs-verdict-label" title={serial ? heading : undefined}>
          {serial ? (
            <>
              {label} · SN <span className="qs-num">{serial}</span>
            </>
          ) : (
            label
          )}
        </span>
        {metaContent != null && metaContent !== false && (
          <span className="qs-verdict-meta">{metaContent}</span>
        )}
      </div>
      <div className="big">{code}</div>
      <div className="t">{title}</div>
      {description != null && description !== false && description !== '' && (
        <div className="d">{description}</div>
      )}
      {showFooter && shown && (
        <div className="foot">
          {shown.serialNumber && !serial && <span>SN {shown.serialNumber}</span>}
          <span>结果 {shown.id}</span>
          {shown.durationMs !== undefined && Number.isFinite(shown.durationMs) && (
            <span>{shown.durationMs} ms</span>
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
                  ) : failed ? (
                    <Icon className="qs-ic">
                      <path d="M12 6v7M12 18h.01" />
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
  stateLabel?: string;
  src?: string;
  alt?: string;
  preview?: ReactNode;
  keepPreview?: boolean;
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
const cssLength = (value: number | string | undefined) =>
  typeof value === 'number' ? `${value}px` : value;
function cameraSize(width?: number | string, previewHeight?: number | string) {
  const style: Record<string, string> = {};
  const w = cssLength(width);
  const h = cssLength(previewHeight);
  if (w) style['--qs-camera-w'] = w;
  if (h) style['--qs-camera-preview-h'] = h;
  return style as CSSProperties;
}
export interface CameraThumbnailProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onSelect' | 'children'
> {
  frame: CameraFrame;
  selected?: boolean;
  onSelect?: (id: string) => void;
  renderPreview?: (frame: CameraFrame) => ReactNode;
  width?: number | string;
  previewHeight?: number | string;
}
function CameraThumbnailView({
  frame,
  selected,
  onSelect,
  renderPreview,
  width,
  previewHeight,
  className,
  style,
  onClick,
  ...rest
}: CameraThumbnailProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageFailed = !!frame.src && failedSrc === frame.src;
  const unavailable =
    frame.state === 'waiting' ||
    frame.state === 'capturing' ||
    frame.state === 'missing' ||
    frame.state === 'skipped';
  const stateText = frame.stateLabel ?? frameLabels[frame.state];
  const hosted = renderPreview?.(frame);
  const visual =
    hosted != null && hosted !== false ? (
      hosted
    ) : frame.src ? (
      imageFailed ? null : (
        <img
          key={frame.src}
          src={frame.src}
          alt={frame.alt ?? `${frame.label}采集图像`}
          onError={() => setFailedSrc(frame.src!)}
        />
      )
    ) : (
      frame.preview
    );
  const hasVisual = visual != null && visual !== false;
  const overlay = unavailable && !!frame.keepPreview && hasVisual;
  const preview = overlay ? (
    <>
      <span className="qs-camera-visual">{visual}</span>
      <span className="qs-camera-overlay">{stateText}</span>
    </>
  ) : unavailable ? (
    <span>{stateText}</span>
  ) : hasVisual ? (
    visual
  ) : (
    <span>{imageFailed ? '图像加载失败' : '暂无预览'}</span>
  );
  const content = (
    <>
      <span className="qs-camera-heading">
        <span className="qs-num">{frame.label}</span>
        <span className={`qs-frame-state qs-frame-${frame.state}`}>{stateText}</span>
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
  const sized = { ...cameraSize(width, previewHeight), ...style };
  const name = `${frame.label} · ${stateText}`;
  return onSelect ? (
    <button
      type="button"
      className={classes}
      disabled={frame.disabled}
      aria-label={name}
      aria-pressed={!!selected}
      data-frame-id={frame.id}
      data-state={frame.state}
      style={sized}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onSelect(frame.id);
      }}
    >
      {content}
    </button>
  ) : (
    <div
      className={classes}
      role="group"
      aria-label={name}
      data-frame-id={frame.id}
      data-state={frame.state}
      style={sized}
      onClick={onClick}
      {...rest}
    >
      {content}
    </div>
  );
}
function shallowEqual<T extends object>(a: T | undefined, b: T | undefined) {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a) as (keyof T)[];
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}
export const CameraThumbnail = memo(CameraThumbnailView, (a, b) => {
  const keys = Object.keys(a) as (keyof CameraThumbnailProps)[];
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) =>
      key === 'frame' || key === 'style' ? shallowEqual<object>(a[key], b[key]) : a[key] === b[key],
    )
  );
});
export interface CameraStripProps {
  frames: CameraFrame[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string) => void;
  cycleId?: string;
  layout?: 'strip' | 'grid';
  label?: string;
  renderPreview?: (frame: CameraFrame) => ReactNode;
  thumbnailWidth?: number | string;
  previewHeight?: number | string;
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
  renderPreview,
  thumbnailWidth,
  previewHeight,
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
          stateLabel: undefined,
          src: undefined,
          preview: undefined,
          keepPreview: undefined,
          detail: '等待当前工件采集',
        }
      : frame,
  );
  const current = useCallback(
    (frame: CameraFrame) =>
      cycleId !== undefined && frame.cycleId !== cycleId ? null : renderPreview?.(frame),
    [cycleId, renderPreview],
  );
  const lastReveal = useRef<string | null>(null);
  useEffect(() => {
    const container = root.current;
    if (layout !== 'strip' || !container) {
      container?.removeAttribute('data-overflow-start');
      container?.removeAttribute('data-overflow-end');
      return;
    }
    const measure = () => {
      const max = container.scrollWidth - container.clientWidth;
      container.toggleAttribute('data-overflow-start', container.scrollLeft > 1);
      container.toggleAttribute('data-overflow-end', container.scrollLeft < max - 1);
    };
    const reveal = (smooth: boolean) => {
      const active = container.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!active) return;
      const rect = active.getBoundingClientRect();
      const parent = container.getBoundingClientRect();
      const inset = parseFloat(getComputedStyle(container).scrollPaddingInlineStart) || 0;
      const delta =
        rect.left < parent.left + inset
          ? rect.left - parent.left - inset
          : rect.right > parent.right - inset
            ? rect.right - parent.right + inset
            : 0;
      if (!delta) return;
      const left = container.scrollLeft + delta;
      if (smooth && !reducedMotion() && typeof container.scrollTo === 'function')
        container.scrollTo({ left, behavior: 'smooth' });
      else container.scrollLeft = left;
    };
    const target = `${cycleId ?? ''}\0${selected ?? ''}`;
    reveal(lastReveal.current !== null && lastReveal.current !== target);
    lastReveal.current = target;
    measure();
    let resized = 0;
    let scrolled = 0;
    const onResize = () => {
      if (!resized)
        resized = requestAnimationFrame(() => {
          resized = 0;
          reveal(false);
          measure();
        });
    };
    const onScroll = () => {
      if (!scrolled)
        scrolled = requestAnimationFrame(() => {
          scrolled = 0;
          measure();
        });
    };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    observer?.observe(container);
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      observer?.disconnect();
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(resized);
      cancelAnimationFrame(scrolled);
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
      style={cameraSize(thumbnailWidth, previewHeight)}
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
          onSelect={setSelected}
          renderPreview={renderPreview ? current : undefined}
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
  groupSeparator?: string,
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
  if (!useGrouping || groupSeparator === undefined) return formatter.format(normalized);
  return formatter
    .formatToParts(normalized)
    .map((part) => (part.type === 'group' ? groupSeparator : part.value))
    .join('');
}
const NumberCharacter = memo(function NumberCharacter({
  character,
  animate,
  direction,
}: {
  character: string;
  animate: boolean;
  direction: 1 | -1;
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
    const css = getComputedStyle(ref.current);
    const settle = tokenMs(css, '--dur-medium') + tokenMs(css, '--dur-short');
    const rapid = lastChange.current !== null && now - lastChange.current < settle;
    lastChange.current = now;
    if (rapid) return;
    const animation = motion(
      ref.current,
      [
        { transform: `translateY(${direction * 40}%)`, opacity: 0.3 },
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
  groupSeparator?: string;
  animate?: boolean;
  placeholder?: string;
  className?: string;
}
export function AnimatedNumber({
  value,
  precision = 2,
  locale = 'zh-CN',
  useGrouping,
  groupSeparator,
  animate = true,
  placeholder = '—',
  className,
}: AnimatedNumberProps) {
  const grouping = useGrouping ?? groupSeparator !== undefined;
  const text = formatNumber(value, precision, locale, grouping, groupSeparator);
  const previousValue = useRef(value);
  const direction: 1 | -1 =
    value != null && previousValue.current != null && value < previousValue.current ? -1 : 1;
  useEffect(() => {
    previousValue.current = value;
  }, [value]);
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
                direction={direction}
              />
            ))}
      </span>
    </span>
  );
}
export interface MeasurementReadingProps extends Omit<AnimatedNumberProps, 'value'> {
  label: string;
  value: number | string | null | undefined;
  unit?: string;
  status?: 'neutral' | InspectionVerdict;
  stale?: boolean;
  limits?: { min?: number; max?: number };
  description?: ReactNode;
  pendingLabel?: string | null;
  size?: 'md' | 'lg';
}
const readingLabels = {
  neutral: '',
  ok: 'OK',
  ng: 'NG',
  warn: '待复核',
  fault: '测量异常',
  pending: '未测',
  stale: '历史值',
};
function MeasurementReadingView({
  label,
  unit,
  status = 'neutral',
  stale = false,
  limits,
  description,
  pendingLabel = readingLabels.pending,
  size = 'lg',
  className,
  value,
  ...number
}: MeasurementReadingProps) {
  const id = useId();
  const textValue = typeof value === 'string' ? value.trim() || null : null;
  const available = textValue !== null || (typeof value === 'number' && Number.isFinite(value));
  const effective = stale ? 'stale' : !available && status !== 'fault' ? 'pending' : status;
  const stateText = effective === 'pending' ? (pendingLabel ?? '') : readingLabels[effective];
  const grouping = number.useGrouping ?? number.groupSeparator !== undefined;
  const formatLimit = (limit: number | undefined) =>
    formatNumber(
      limit,
      number.precision ?? 2,
      number.locale ?? 'zh-CN',
      grouping,
      number.groupSeparator,
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
        {stateText && <span className="qs-measurement-state">{stateText}</span>}
      </div>
      <div className="qs-measurement-value">
        {textValue !== null ? (
          <span className="qs-measurement-text">{textValue}</span>
        ) : (
          <AnimatedNumber {...number} value={typeof value === 'number' ? value : null} />
        )}
        {unit && <span className="qs-measurement-unit">{unit}</span>}
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

export type StatTone = 'neutral' | 'ok' | 'ng' | 'warn' | 'fault';
export interface StatCounterProps extends Omit<AnimatedNumberProps, 'value' | 'precision'> {
  label: ReactNode;
  value: number | string | null | undefined;
  unit?: ReactNode;
  tone?: StatTone;
  toneWhenZero?: boolean;
  precision?: number;
  description?: ReactNode;
  span?: number;
  size?: 'md' | 'lg';
}
function StatCounterView({
  label,
  value,
  unit,
  tone = 'neutral',
  toneWhenZero = false,
  precision = 0,
  description,
  span,
  size = 'lg',
  className,
  ...number
}: StatCounterProps) {
  const id = useId();
  const textValue = typeof value === 'string' ? value.trim() || null : null;
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : null;
  const empty = textValue === null && numeric === null;
  const quiet = empty || (numeric !== null && numeric === 0 && !toneWhenZero);
  const effective = quiet ? 'neutral' : tone;
  return (
    <div
      role="group"
      aria-labelledby={id}
      className={cx('qs-stat-counter', size === 'md' && 'qs-stat-counter-md', className)}
      data-tone={effective}
      style={
        span && span > 1 ? ({ gridColumn: `span ${Math.trunc(span)}` } as CSSProperties) : undefined
      }
    >
      <span className="qs-stat-counter-label" id={id}>
        {label}
      </span>
      <span className="qs-stat-counter-value">
        {textValue !== null ? (
          <span className="qs-stat-counter-text">{textValue}</span>
        ) : (
          <AnimatedNumber {...number} value={numeric} precision={precision} />
        )}
        {unit != null && unit !== false && !empty && (
          <span className="qs-stat-counter-unit">{unit}</span>
        )}
      </span>
      {description && <span className="qs-stat-counter-description">{description}</span>}
    </div>
  );
}
export const StatCounter = memo(StatCounterView);
export interface KpiItem extends StatCounterProps {
  id: string;
}
export interface KpiGroupProps {
  items: KpiItem[];
  label?: string;
  columns?: number;
  minWidth?: number;
  className?: string;
}
export function KpiGroup({
  items,
  label = '统计',
  columns,
  minWidth = 112,
  className,
}: KpiGroupProps) {
  const style: Record<string, string> = { '--kpi-min': `${minWidth}px` };
  if (columns && columns > 0) style['--kpi-columns'] = String(Math.trunc(columns));
  return (
    <section
      aria-label={label}
      className={cx('qs-kpi-group', !!columns && columns > 0 && 'qs-kpi-columns', className)}
      style={style as CSSProperties}
    >
      {items.map(({ id, ...item }) => (
        <StatCounter key={id} {...item} />
      ))}
    </section>
  );
}
