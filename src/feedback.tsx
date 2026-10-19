import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  type ReactNode,
  type CSSProperties,
  type HTMLAttributes,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cx, type Tone } from './core';
import { Button, CloseIcon, Icon, IconButton } from './primitives';

declare const process: { env: { NODE_ENV?: string } };

function tokenMs(element: Element, name: string) {
  const token = getComputedStyle(element).getPropertyValue(name).trim();
  const value = parseFloat(token) * (token.endsWith('ms') ? 1 : 1000);
  return Number.isFinite(value) ? value : 0;
}
const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export type AlertTone = Tone | 'tertiary';
const alertIcons: Record<AlertTone, ReactNode> = {
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5v.01" />
    </>
  ),
  ok: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.2 12.4 2.6 2.6 5-5.6" />
    </>
  ),
  warn: (
    <>
      <path d="M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4M12 16.8v.01" />
    </>
  ),
  ng: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9.2 9.2 5.6 5.6m0-5.6-5.6 5.6" />
    </>
  ),
  fault: (
    <>
      <path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3Z" strokeLinejoin="miter" />
      <path d="M12 7.8v5M12 16.2v.01" />
    </>
  ),
  tertiary: (
    <>
      <path d="M5.5 21V4" />
      <path d="M5.5 4.5h11.5l-2.4 4.2 2.4 4.3H5.5" />
    </>
  ),
};
export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  tone?: AlertTone;
  title?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
  icon?: ReactNode;
}
export function Alert({
  tone = 'info',
  title,
  children,
  action,
  onClose,
  icon,
  className,
  role,
  ...props
}: AlertProps) {
  return (
    <div
      {...props}
      className={cx('qs-banner', tone, className)}
      role={role ?? (tone === 'ng' || tone === 'fault' ? 'alert' : 'status')}
    >
      {icon === undefined ? (
        <Icon size={16} strokeWidth={2} className="qs-alert-icon">
          {alertIcons[tone] ?? alertIcons.info}
        </Icon>
      ) : (
        icon && (
          <span className="qs-alert-icon" aria-hidden="true">
            {icon}
          </span>
        )
      )}
      <div className="qs-alert-copy">
        {title && <b>{title}</b>}
        <div>{children}</div>
      </div>
      {action}
      {onClose && (
        <IconButton aria-label="关闭提示" size="sm" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      )}
    </div>
  );
}
export function Progress({
  value,
  max = 100,
  variant = 'linear',
  label = '进度',
  tone = 'info',
}: {
  value?: number;
  max?: number;
  variant?: 'linear' | 'circular';
  label?: string;
  tone?: Tone;
}) {
  const limit = Number.isFinite(max) && max > 0 ? max : 100;
  const clamped =
    value === undefined
      ? undefined
      : Math.max(0, Math.min(limit, Number.isFinite(value) ? value : 0));
  const ratio = (clamped ?? limit * 0.3) / limit;
  const color = tone === 'info' ? 'var(--primary)' : `var(--${tone})`;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={clamped}
      className={cx(
        variant === 'linear' ? 'qs-progress' : 'qs-circular-progress',
        value === undefined && 'qs-indeterminate',
      )}
      style={{ '--v': ratio, '--progress-color': color } as CSSProperties}
    >
      {variant === 'linear' ? (
        <i />
      ) : (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="16" />
          <circle
            cx="20"
            cy="20"
            r="16"
            pathLength="100"
            strokeDasharray={`${ratio * 100} 100`}
            data-empty={ratio > 0 ? undefined : ''}
          />
        </svg>
      )}
    </div>
  );
}
export interface SnackbarProps {
  children: ReactNode;
  duration?: number;
  onDismiss: () => void;
  tone?: Tone;
  action?: { label: string; onClick: () => void };
  className?: string;
}
export function Snackbar({
  children,
  duration = 4000,
  onDismiss,
  tone = 'ok',
  action,
  className,
}: SnackbarProps) {
  const callback = useRef(onDismiss);
  callback.current = onDismiss;
  const remaining = useRef(duration);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const held = useRef({ focus: false, hover: false });
  const stop = () => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current);
      timer.current = undefined;
      remaining.current = Math.max(0, remaining.current - (Date.now() - started.current));
    }
  };
  const arm = () => {
    if (duration <= 0 || timer.current !== undefined || held.current.focus || held.current.hover)
      return;
    started.current = Date.now();
    timer.current = setTimeout(() => {
      timer.current = undefined;
      callback.current();
    }, remaining.current);
  };
  useEffect(() => {
    remaining.current = duration;
    arm();
    return stop;
  }, [duration]);
  return (
    <div
      className={cx('qs-snackbar', tone, className)}
      role="status"
      aria-live="polite"
      onMouseEnter={() => {
        held.current.hover = true;
        stop();
      }}
      onMouseLeave={() => {
        held.current.hover = false;
        arm();
      }}
      onFocus={() => {
        held.current.focus = true;
        stop();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          held.current.focus = false;
          arm();
        }
      }}
    >
      <span className="msg">{children}</span>
      {action && (
        <Button
          variant="text"
          onClick={() => {
            action.onClick();
            callback.current();
          }}
        >
          {action.label}
        </Button>
      )}
      <IconButton aria-label="关闭提示" onClick={() => callback.current()}>
        <CloseIcon />
      </IconButton>
    </div>
  );
}
export interface SnackbarMessage {
  text: string;
  tone?: Tone;
  duration?: number;
  action?: SnackbarProps['action'];
}
export interface SnackbarApi {
  show: (message: string | SnackbarMessage) => void;
  clear: () => void;
}
const SnackbarContext = createContext<SnackbarApi | null>(null);
let warnedMissingProvider = false;
const missingProvider: SnackbarApi = {
  show: () => {
    if (warnedMissingProvider) return;
    warnedMissingProvider = true;
    let dev = true;
    try {
      dev = process.env.NODE_ENV !== 'production';
    } catch {}
    if (dev) console.warn('[qing-steel] useSnackbar 没有找到 SnackbarProvider，提示已忽略。');
  },
  clear: () => {},
};
type SnackbarEntry = SnackbarMessage & { id: number; leaving?: boolean; swap?: boolean };
function LeavingSnackbar({ item, onDone }: { item: SnackbarEntry; onDone: (id: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { id } = item;
  useEffect(() => {
    const duration = ref.current && !reducedMotion() ? tokenMs(ref.current, '--dur-short') : 0;
    const timer = setTimeout(() => onDone(id), duration ? duration + 50 : 0);
    return () => clearTimeout(timer);
  }, [id, onDone]);
  return (
    <div
      ref={ref}
      className={cx('qs-snackbar-exit', item.swap && 'swap')}
      aria-hidden="true"
      inert
      onAnimationEnd={() => onDone(id)}
    >
      <div className={cx('qs-snackbar', item.tone ?? 'ok')}>
        <span className="msg">{item.text}</span>
        {item.action && (
          <Button variant="text" disabled>
            {item.action.label}
          </Button>
        )}
        <IconButton aria-label="关闭提示" disabled>
          <CloseIcon />
        </IconButton>
      </div>
    </div>
  );
}
export interface SnackbarProviderProps {
  children: ReactNode;
  placement?: 'top' | 'bottom';
  container?: HTMLElement | null | RefObject<HTMLElement | null>;
  max?: number;
}
const isRef = (value: unknown): value is RefObject<HTMLElement | null> =>
  !!value && typeof value === 'object' && 'current' in value;
export function SnackbarProvider({
  children,
  placement = 'bottom',
  container,
  max = 1,
}: SnackbarProviderProps) {
  const limit = Number.isFinite(max) ? Math.max(1, Math.floor(max)) : 1;
  const stacked = limit > 1;
  const [entries, setEntries] = useState<SnackbarEntry[]>([]);
  const serial = useRef(0);
  const limitRef = useRef(limit);
  limitRef.current = limit;
  const [refTarget, setRefTarget] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (isRef(container)) setRefTarget(container.current);
  });
  const target = isRef(container) ? refTarget : (container ?? null);
  const dismiss = useCallback(
    (id: number) =>
      setEntries((list) =>
        list.map((entry) =>
          entry.id === id && !entry.leaving ? { ...entry, leaving: true, swap: false } : entry,
        ),
      ),
    [],
  );
  const clear = useCallback(
    () =>
      setEntries((list) =>
        list.map((entry) => (entry.leaving ? entry : { ...entry, leaving: true, swap: false })),
      ),
    [],
  );
  const finish = useCallback(
    (id: number) => setEntries((list) => list.filter((entry) => entry.id !== id)),
    [],
  );
  const show = useCallback((message: string | SnackbarMessage) => {
    const next = typeof message === 'string' ? { text: message } : message;
    if (!next.text) return;
    const id = ++serial.current;
    setEntries((list) => {
      if (limitRef.current <= 1) {
        const current = list.find((entry) => !entry.leaving);
        return current
          ? [
              { ...current, leaving: true, swap: true },
              { ...next, id, swap: true },
            ]
          : [{ ...next, id }];
      }
      const active = list.filter((entry) => !entry.leaving);
      const overflow = new Set(
        active.slice(0, Math.max(0, active.length + 1 - limitRef.current)).map((e) => e.id),
      );
      return [
        ...list.map((entry) => (overflow.has(entry.id) ? { ...entry, leaving: true } : entry)),
        { ...next, id },
      ];
    });
  }, []);
  const context = useMemo(() => ({ show, clear }), [show, clear]);
  const layer = useRef<HTMLDivElement>(null);
  const tops = useRef(new Map<string, number>());
  const moves = useRef(new Map<string, Animation>());
  useLayoutEffect(() => {
    const host = layer.current;
    if (!stacked || !host) return;
    const next = new Map<string, number>();
    const animate = !reducedMotion();
    const edge = host.getBoundingClientRect();
    const base = placement === 'top' ? edge.top : edge.bottom;
    for (const slot of host.querySelectorAll<HTMLElement>(':scope > [data-snackbar-id]')) {
      const id = slot.dataset.snackbarId!;
      const visual = slot.getBoundingClientRect().top - base;
      moves.current.get(id)?.cancel();
      moves.current.delete(id);
      const top = slot.getBoundingClientRect().top - base;
      next.set(id, top);
      const before = tops.current.get(id);
      if (before === undefined || !animate || !slot.animate) continue;
      const offset = before + (visual - top) - top;
      if (Math.abs(offset) < 0.5) continue;
      const move = slot.animate(
        [{ transform: `translateY(${offset}px)` }, { transform: 'translateY(0)' }],
        {
          duration: tokenMs(slot, '--dur-medium'),
          easing: getComputedStyle(slot).getPropertyValue('--ease-standard').trim() || 'ease',
        },
      );
      moves.current.set(id, move);
    }
    tops.current = next;
  });
  const view = (entry: SnackbarEntry) =>
    entry.leaving ? (
      <LeavingSnackbar key={`${entry.id}-out`} item={entry} onDone={finish} />
    ) : (
      <Snackbar
        key={entry.id}
        tone={entry.tone}
        className={entry.swap ? 'qs-snackbar-swap' : undefined}
        duration={entry.duration ?? Math.min(10000, Math.max(4000, 3000 + entry.text.length * 70))}
        action={entry.action}
        onDismiss={() => dismiss(entry.id)}
      >
        {entry.text}
      </Snackbar>
    );
  const host = (
    <div
      ref={layer}
      className={cx(
        'qs-snackbars',
        placement === 'top' && 'top',
        stacked && 'qs-snackbars-stack',
        target ? 'qs-snackbars-contained' : undefined,
      )}
    >
      {entries.map((entry) =>
        stacked ? (
          <div key={entry.id} className="qs-snackbar-slot" data-snackbar-id={entry.id}>
            {view(entry)}
          </div>
        ) : (
          view(entry)
        ),
      )}
    </div>
  );
  return (
    <SnackbarContext.Provider value={context}>
      {children}
      {target ? createPortal(host, target) : host}
    </SnackbarContext.Provider>
  );
}
export function useSnackbar(): SnackbarApi {
  return useContext(SnackbarContext) ?? missingProvider;
}
