import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { cx, type Tone } from './core';
import { Button, CloseIcon, IconButton } from './primitives';

export function Alert({
  tone = 'info',
  title,
  children,
  action,
  onClose,
}: {
  tone?: Tone;
  title?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className={cx('qs-banner', tone)}
      role={tone === 'ng' || tone === 'fault' ? 'alert' : 'status'}
    >
      <span aria-hidden="true">
        {tone === 'ok' ? '✓' : tone === 'warn' || tone === 'ng' ? '!' : 'ⓘ'}
      </span>
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
          <circle cx="20" cy="20" r="16" pathLength="100" strokeDasharray={`${ratio * 100} 100`} />
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
}
export function Snackbar({
  children,
  duration = 4000,
  onDismiss,
  tone = 'ok',
  action,
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
      className={cx('qs-snackbar', tone)}
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
const SnackbarContext = createContext<{
  show: (message: string | SnackbarMessage) => void;
  clear: () => void;
} | null>(null);
function LeavingSnackbar({ item, done }: { item: SnackbarMessage; done: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const token = ref.current
      ? getComputedStyle(ref.current).getPropertyValue('--dur-short').trim()
      : '0';
    const duration = parseFloat(token) * (token.endsWith('ms') ? 1 : 1000);
    const timer = setTimeout(done, reduced || !Number.isFinite(duration) ? 0 : duration + 50);
    return () => clearTimeout(timer);
  }, [done]);
  return (
    <div ref={ref} className="qs-snackbar-exit" aria-hidden="true" inert onAnimationEnd={done}>
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
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<(SnackbarMessage & { id: number }) | null>(null);
  const serial = useRef(0);
  const [leaving, setLeaving] = useState<SnackbarMessage | null>(null);
  const active = useRef(item);
  active.current = item;
  const clear = useCallback(() => {
    setLeaving(active.current);
    setItem(null);
  }, []);
  const finish = useCallback(() => setLeaving(null), []);
  const show = useCallback((message: string | SnackbarMessage) => {
    const next = typeof message === 'string' ? { text: message } : message;
    if (next.text) {
      setLeaving(null);
      setItem({ ...next, id: ++serial.current });
    }
  }, []);
  const context = useMemo(() => ({ show, clear }), [show, clear]);
  return (
    <SnackbarContext.Provider value={context}>
      {children}
      <div className="qs-snackbars">
        {leaving && <LeavingSnackbar item={leaving} done={finish} />}
        {item && (
          <Snackbar
            key={item.id}
            tone={item.tone}
            duration={
              item.duration ?? Math.min(10000, Math.max(4000, 3000 + item.text.length * 70))
            }
            action={item.action}
            onDismiss={clear}
          >
            {item.text}
          </Snackbar>
        )}
      </div>
    </SnackbarContext.Provider>
  );
}
export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar must be used inside SnackbarProvider');
  return context;
}
