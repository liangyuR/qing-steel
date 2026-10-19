import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker } from 'react-day-picker';
import { zhCN } from 'react-day-picker/locale/zh-CN';
import { TextField, type TextFieldProps } from './fields';
import { Button } from './primitives';
import { useControllable, useTheme } from './core';

export interface DateTimePickerProps extends Omit<
  TextFieldProps,
  'type' | 'value' | 'defaultValue'
> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}
const pad = (n: number) => String(n).padStart(2, '0');
function dateValue(date: Date) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(0);
  date.setFullYear(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return dateValue(date) === value ? date : undefined;
}
function seconds(value: string) {
  const [h = 0, m = 0, s = 0] = value.split(':').map(Number);
  return h * 3600 + m * 60 + s;
}
function timeValue(n: number, withSeconds: boolean) {
  return `${pad(Math.floor(n / 3600))}:${pad(Math.floor(n / 60) % 60)}${withSeconds ? `:${pad(n % 60)}` : ''}`;
}

const Picker = forwardRef<HTMLInputElement, DateTimePickerProps & { kind: 'date' | 'time' }>(
  function Picker(
    {
      kind,
      value,
      defaultValue = '',
      onValueChange,
      onChange,
      onKeyDown,
      trailing,
      className,
      ...props
    },
    ref,
  ) {
    const { container } = useTheme();
    const input = useRef<HTMLInputElement | null>(null);
    const [current, setCurrent] = useControllable(value, defaultValue, onValueChange);
    const latestValue = useRef(current);
    latestValue.current = current;
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState('');
    const [month, setMonth] = useState<Date>(parseDate(current) ?? new Date());
    const step = props.step ?? (kind === 'time' ? 60 : 1);
    const initial = useRef(value ?? defaultValue);
    const isTime = kind === 'time';
    const title = `${typeof props.label === 'string' ? props.label : isTime ? '时间' : '日期'}选择`;
    const withSeconds =
      isTime &&
      (step === 'any' ||
        Number(step) % 60 !== 0 ||
        /:\d{2}:/.test(current) ||
        /:\d{2}:/.test(String(props.min ?? '')));
    useLayoutEffect(() => {
      if (input.current) input.current.value = current;
    }, [current]);
    useEffect(() => {
      const form = input.current?.form;
      const reset = (event: Event) =>
        queueMicrotask(() => {
          if (event.defaultPrevented || !input.current) return;
          input.current.value = value ?? defaultValue;
          if (value === undefined) setCurrent(defaultValue);
          setOpen(false);
        });
      form?.addEventListener('reset', reset);
      return () => form?.removeEventListener('reset', reset);
    }, [value, defaultValue, setCurrent]);
    useEffect(() => {
      if (props.disabled || props.readOnly) setOpen(false);
    }, [props.disabled, props.readOnly]);
    function valid(candidate: string) {
      if (!input.current || !candidate) return false;
      const probe = input.current.cloneNode() as HTMLInputElement;
      probe.disabled = false;
      probe.readOnly = false;
      probe.value = candidate;
      return !!probe.value && probe.validity.valid;
    }
    function commit(next: string) {
      const el = input.current;
      if (!el || (next && !valid(next))) return;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, next);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      if (value !== undefined) el.value = value;
      setOpen(false);
    }
    const slots = useMemo(() => {
      if (!isTime) return [];
      const min = props.min ? seconds(String(props.min)) : 0;
      const max = props.max ? seconds(String(props.max)) : 86399;
      const base = props.min ? min : initial.current ? seconds(initial.current) : 0;
      const interval = step === 'any' ? 1 : Number(step) > 0 ? Number(step) : 60;
      const result: number[] = [];
      for (let n = 0; n < 86400; n++) {
        if (
          (min <= max ? n >= min && n <= max : n >= min || n <= max) &&
          Math.abs((n - base) / interval - Math.round((n - base) / interval)) < 1e-7
        )
          result.push(n);
      }
      return result;
    }, [isTime, props.min, props.max, step]);
    function changeOpen(next: boolean) {
      if (next && (props.disabled || props.readOnly)) return;
      if (next) {
        setDraft(current || (isTime && slots.length ? timeValue(slots[0], withSeconds) : ''));
        const date = parseDate(current) ?? new Date();
        const min = parseDate(String(props.min ?? ''));
        const max = parseDate(String(props.max ?? ''));
        setMonth(min && date < min ? min : max && date > max ? max : date);
      }
      setOpen(next);
    }
    const draftSeconds = seconds(draft);
    const hour = Math.floor(draftSeconds / 3600),
      minute = Math.floor(draftSeconds / 60) % 60;
    return (
      <Popover.Root open={open} onOpenChange={changeOpen}>
        <Popover.Anchor asChild>
          <div className="qs-datetime-anchor">
            <TextField
              {...props}
              type={kind}
              step={step}
              defaultValue={initial.current}
              className={['qs-datetime-input', className].filter(Boolean).join(' ')}
              ref={(el) => {
                input.current = el;
                if (typeof ref === 'function') ref(el);
                else if (ref) ref.current = el;
              }}
              onChange={(event) => {
                setCurrent(event.target.value);
                onChange?.(event);
                if (value !== undefined)
                  queueMicrotask(() => {
                    if (input.current) input.current.value = latestValue.current;
                  });
              }}
              onKeyDown={(event) => {
                onKeyDown?.(event);
                if (!event.defaultPrevented && event.altKey && event.key === 'ArrowDown') {
                  event.preventDefault();
                  changeOpen(true);
                }
              }}
              trailing={
                <>
                  {trailing}
                  <Popover.Trigger asChild>
                    <button
                      type="button"
                      className="qs-picker-trigger"
                      aria-label={`打开${title}`}
                      disabled={props.disabled || props.readOnly}
                    >
                      <svg
                        aria-hidden="true"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        {isTime ? (
                          <>
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 6v6l4 2" />
                          </>
                        ) : (
                          <>
                            <rect x="3" y="5" width="18" height="16" rx="3" />
                            <path d="M7 3v4M17 3v4M3 10h18" />
                          </>
                        )}
                      </svg>
                    </button>
                  </Popover.Trigger>
                </>
              }
            />
          </div>
        </Popover.Anchor>
        <Popover.Portal container={container}>
          <Popover.Content
            className="qs-datetime-popup"
            sideOffset={8}
            align="start"
            collisionPadding={12}
            aria-label={title}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              input.current?.focus();
            }}
          >
            {isTime ? (
              <>
                <div className="qs-time-heading">
                  <strong>选择时间</strong>
                  <output>{draft || '—'}</output>
                </div>
                <div className="qs-time-columns">
                  {['时', '分', ...(withSeconds ? ['秒'] : [])].map((unit, index) => {
                    const selected = index === 0 ? hour : index === 1 ? minute : draftSeconds % 60;
                    const candidates = slots.filter(
                      (n) =>
                        index === 0 ||
                        (Math.floor(n / 3600) === hour &&
                          (index === 1 || Math.floor(n / 60) % 60 === minute)),
                    );
                    const getUnit = (n: number) =>
                      index === 0
                        ? Math.floor(n / 3600)
                        : index === 1
                          ? Math.floor(n / 60) % 60
                          : n % 60;
                    const enabled = new Set(candidates.map(getUnit));
                    return (
                      <div className="qs-time-column" key={unit}>
                        <span>{unit}</span>
                        <div
                          role="radiogroup"
                          aria-label={unit}
                          className="qs-time-options"
                          onKeyDown={(event) => {
                            if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key))
                              return;
                            event.preventDefault();
                            const buttons = Array.from(
                              event.currentTarget.querySelectorAll<HTMLButtonElement>(
                                'button:not(:disabled)',
                              ),
                            );
                            const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
                            const next =
                              event.key === 'Home'
                                ? 0
                                : event.key === 'End'
                                  ? buttons.length - 1
                                  : Math.max(
                                      0,
                                      Math.min(
                                        buttons.length - 1,
                                        i + (event.key === 'ArrowDown' ? 1 : -1),
                                      ),
                                    );
                            buttons[next]?.focus();
                            buttons[next]?.click();
                          }}
                        >
                          {Array.from({ length: index === 0 ? 24 : 60 }, (_, n) => (
                            <button
                              key={n}
                              type="button"
                              role="radio"
                              aria-checked={selected === n}
                              disabled={!enabled.has(n)}
                              tabIndex={
                                selected === n || (!enabled.has(selected) && n === [...enabled][0])
                                  ? 0
                                  : -1
                              }
                              ref={(el) => {
                                if (el && selected === n) el.scrollIntoView({ block: 'nearest' });
                              }}
                              onClick={() => {
                                const choices = candidates.filter((slot) => getUnit(slot) === n);
                                const desired =
                                  index === 0
                                    ? n * 3600 + minute * 60 + (draftSeconds % 60)
                                    : index === 1
                                      ? hour * 3600 + n * 60 + (draftSeconds % 60)
                                      : hour * 3600 + minute * 60 + n;
                                const closest = choices.reduce((a, b) =>
                                  Math.abs(a - desired) <= Math.abs(b - desired) ? a : b,
                                );
                                setDraft(timeValue(closest, withSeconds));
                              }}
                            >
                              {pad(n)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!slots.length && <p role="status">当前范围内没有可选时间，请直接输入。</p>}
                <div className="qs-picker-actions">
                  <Button size="sm" onClick={() => commit('')}>
                    清空
                  </Button>
                  <Button size="sm" onClick={() => setOpen(false)}>
                    取消
                  </Button>
                  <Button
                    size="sm"
                    variant="filled"
                    disabled={!valid(draft)}
                    onClick={() => commit(draft)}
                  >
                    确认
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DayPicker
                  mode="single"
                  locale={zhCN}
                  weekStartsOn={1}
                  showOutsideDays
                  fixedWeeks
                  autoFocus
                  month={month}
                  onMonthChange={setMonth}
                  selected={parseDate(current)}
                  disabled={(day) => !valid(dateValue(day))}
                  onSelect={(day) => {
                    if (day) commit(dateValue(day));
                  }}
                  labels={{ labelPrevious: () => '上个月', labelNext: () => '下个月' }}
                />
                <div className="qs-picker-actions">
                  <Button size="sm" onClick={() => commit('')}>
                    清空
                  </Button>
                  <Button
                    size="sm"
                    disabled={!valid(dateValue(new Date()))}
                    onClick={() => commit(dateValue(new Date()))}
                  >
                    今天
                  </Button>
                  <Button size="sm" onClick={() => setOpen(false)}>
                    取消
                  </Button>
                </div>
              </>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  },
);
export const DatePicker = forwardRef<HTMLInputElement, DateTimePickerProps>((props, ref) => (
  <Picker {...props} kind="date" ref={ref} />
));
export const TimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>((props, ref) => (
  <Picker {...props} kind="time" ref={ref} />
));
