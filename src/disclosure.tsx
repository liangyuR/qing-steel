import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type ReactElement,
} from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cx, useControllable, useTheme } from './core';
import { CloseIcon, IconButton } from './primitives';

export interface AccordionItem {
  value: string;
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  forceMount?: boolean;
}
interface AccordionBase {
  items: AccordionItem[];
  className?: string;
  forceMount?: boolean;
  ignoreFieldsetDisabled?: boolean;
}
export type AccordionProps = AccordionBase &
  (
    | {
        multiple?: false;
        value?: string;
        defaultValue?: string;
        onValueChange?: (value: string) => void;
        collapsible?: boolean;
      }
    | {
        multiple: true;
        value?: string[];
        defaultValue?: string[];
        onValueChange?: (value: string[]) => void;
      }
  );
function settleDelay(node: HTMLElement) {
  const style = getComputedStyle(node);
  const seconds = (value: string) =>
    value.split(',').map((part) => {
      const n = parseFloat(part);
      return Number.isFinite(n) ? (part.trim().endsWith('ms') ? n : n * 1000) : 0;
    });
  const durations = seconds(style.transitionDuration || '0s');
  const delays = seconds(style.transitionDelay || '0s');
  return Math.max(0, ...durations.map((d, i) => d + (delays[i % delays.length] ?? 0)));
}
function activateWithKeyboard(event: KeyboardEvent<HTMLElement>) {
  if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
    event.preventDefault();
    if (!event.repeat)
      event.currentTarget.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );
  }
}
function AccordionSection({
  item,
  open,
  forceMount,
  ignoreFieldsetDisabled,
}: {
  item: AccordionItem;
  open: boolean;
  forceMount?: boolean;
  ignoreFieldsetDisabled?: boolean;
}) {
  const id = useId();
  const triggerId = `${id}trigger`;
  const contentId = `${id}content`;
  const keepMounted = item.forceMount ?? forceMount ?? false;
  const region = useRef<HTMLDivElement>(null);
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);
  useLayoutEffect(() => {
    region.current?.toggleAttribute('inert', !open);
  }, [open]);
  useEffect(() => {
    if (open || !present || !region.current) return;
    const timer = setTimeout(() => setPresent(false), settleDelay(region.current) + 34);
    return () => clearTimeout(timer);
  }, [open, present]);
  const label = (
    <>
      <span className="qs-accordion-title">{item.title}</span>
      <svg
        className="qs-accordion-chevron"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </>
  );
  const freeTrigger = ignoreFieldsetDisabled && !item.disabled;
  return (
    <AccordionPrimitive.Item
      value={item.value}
      disabled={item.disabled}
      className="qs-accordion-item"
    >
      <AccordionPrimitive.Header className="qs-accordion-heading">
        {freeTrigger ? (
          <AccordionPrimitive.Trigger
            asChild
            id={triggerId}
            aria-controls={contentId}
            type={undefined}
          >
            <div
              role="button"
              tabIndex={0}
              className="qs-accordion-trigger"
              onKeyDown={activateWithKeyboard}
            >
              {label}
            </div>
          </AccordionPrimitive.Trigger>
        ) : (
          <AccordionPrimitive.Trigger
            className="qs-accordion-trigger"
            id={triggerId}
            aria-controls={contentId}
          >
            {label}
          </AccordionPrimitive.Trigger>
        )}
      </AccordionPrimitive.Header>
      <div
        ref={region}
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        className="qs-accordion-content"
        data-state={open ? 'open' : 'closed'}
        hidden={!open && !present}
      >
        <div className="qs-accordion-body">
          <div className="qs-accordion-inner">
            {(open || present || keepMounted) && item.content}
          </div>
        </div>
      </div>
    </AccordionPrimitive.Item>
  );
}
export function Accordion(props: AccordionProps) {
  const [value, setValue] = useControllable<string | string[]>(
    props.value,
    props.defaultValue ?? (props.multiple ? [] : ''),
    props.onValueChange as ((value: string | string[]) => void) | undefined,
  );
  const opened = new Set(Array.isArray(value) ? value : value ? [value] : []);
  const content = props.items.map((item) => (
    <AccordionSection
      key={item.value}
      item={item}
      open={opened.has(item.value)}
      forceMount={props.forceMount}
      ignoreFieldsetDisabled={props.ignoreFieldsetDisabled}
    />
  ));
  const className = cx('qs-accordion', props.className);
  return props.multiple ? (
    <AccordionPrimitive.Root
      type="multiple"
      className={className}
      value={Array.isArray(value) ? value : []}
      onValueChange={setValue}
    >
      {content}
    </AccordionPrimitive.Root>
  ) : (
    <AccordionPrimitive.Root
      type="single"
      className={className}
      value={typeof value === 'string' ? value : ''}
      onValueChange={setValue}
      collapsible={props.collapsible ?? true}
    >
      {content}
    </AccordionPrimitive.Root>
  );
}

export interface PopoverProps {
  trigger: ReactElement;
  title?: string;
  label?: string;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  openOn?: 'click' | 'hover';
  role?: 'dialog' | 'tooltip';
  delay?: number;
  className?: string;
}
const HOVER_CLOSE_DELAY = 150;
export function Popover({
  trigger,
  title,
  label,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  side = 'bottom',
  align = 'start',
  openOn = 'click',
  role = 'dialog',
  delay = 120,
  className,
}: PopoverProps) {
  const { container } = useTheme();
  const id = useId();
  const [current, setCurrent] = useControllable(open, defaultOpen, onOpenChange);
  const hover = openOn === 'hover';
  const tooltip = role === 'tooltip';
  const latest = useRef(current);
  const pinned = useRef(false);
  const pointerInside = useRef(false);
  const restoring = useRef(false);
  const pointerPressed = useRef(false);
  const keyboardFocus = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    latest.current = current;
  });
  useEffect(() => () => clearTimeout(timer.current), []);
  const change = useCallback(
    (next: boolean) => {
      clearTimeout(timer.current);
      if (!next) pinned.current = false;
      if (latest.current !== next) setCurrent(next);
    },
    [setCurrent],
  );
  const scheduleClose = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const active = document.activeElement;
      if (
        pinned.current ||
        pointerInside.current ||
        keyboardFocus.current ||
        (active && contentRef.current?.contains(active))
      )
        return;
      change(false);
    }, HOVER_CLOSE_DELAY);
  };
  const enter = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    pointerInside.current = true;
    clearTimeout(timer.current);
    if (!latest.current) timer.current = setTimeout(() => change(true), Math.max(0, delay));
  };
  const leave = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    pointerInside.current = false;
    if (pinned.current) clearTimeout(timer.current);
    else scheduleClose();
  };
  const hoverTrigger = hover
    ? {
        onPointerEnter: enter,
        onPointerLeave: leave,
        onPointerDown: () => {
          pointerPressed.current = true;
        },
        onFocus: () => {
          keyboardFocus.current = !pointerPressed.current;
          pointerPressed.current = false;
          if (keyboardFocus.current && !restoring.current) change(true);
        },
        onBlur: () => {
          keyboardFocus.current = false;
          if (!pinned.current) scheduleClose();
        },
        onClick: (event: { preventDefault: () => void }) => {
          event.preventDefault();
          pointerPressed.current = false;
          if (pinned.current && latest.current) change(false);
          else {
            change(true);
            pinned.current = true;
          }
        },
      }
    : {};
  const tooltipTrigger = tooltip
    ? {
        'aria-haspopup': undefined,
        'aria-controls': undefined,
        'aria-expanded': undefined,
        'aria-describedby': current ? `${id}tip` : undefined,
      }
    : {};
  return (
    <PopoverPrimitive.Root open={current} onOpenChange={change}>
      <PopoverPrimitive.Trigger asChild ref={triggerRef} {...hoverTrigger} {...tooltipTrigger}>
        {trigger}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
          ref={contentRef}
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className={cx(
            'qs-popover',
            tooltip && 'qs-popover-tip',
            !title && 'qs-popover-plain',
            className,
          )}
          {...(tooltip ? { role: 'tooltip', id: `${id}tip` } : {})}
          aria-labelledby={title ? id : undefined}
          aria-label={title ? undefined : label}
          data-open-on={openOn}
          onOpenAutoFocus={(event) => {
            if (hover || tooltip) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            if (hover) event.preventDefault();
          }}
          onEscapeKeyDown={() => {
            keyboardFocus.current = false;
            const active = document.activeElement;
            if (hover && active && contentRef.current?.contains(active)) {
              restoring.current = true;
              triggerRef.current?.focus();
              restoring.current = false;
            }
          }}
          onPointerEnter={hover ? enter : undefined}
          onPointerLeave={hover ? leave : undefined}
          onBlur={
            hover
              ? (event) => {
                  if (!pinned.current && !contentRef.current?.contains(event.relatedTarget as Node))
                    scheduleClose();
                }
              : undefined
          }
        >
          {title && (
            <div className="qs-popover-heading">
              <strong id={id}>{title}</strong>
              {!tooltip && (
                <PopoverPrimitive.Close asChild>
                  <IconButton size="sm" aria-label="关闭浮层">
                    <CloseIcon />
                  </IconButton>
                </PopoverPrimitive.Close>
              )}
            </div>
          )}
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
