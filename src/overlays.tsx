import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as MenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cx, useTheme, useControllable } from './core';
import SelectionTrack from './internal/SelectionTrack';
import { CloseIcon, IconButton } from './primitives';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';
export type DialogInitialFocus = RefObject<HTMLElement | null> | 'first-field' | (string & {});
export interface DialogProps {
  trigger?: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  closeOnOutside?: boolean;
  closeDisabled?: boolean;
  className?: string;
  size?: DialogSize;
  width?: number | string;
  initialFocus?: DialogInitialFocus;
}
const dialogWidths: Record<DialogSize, number> = { sm: 420, md: 520, lg: 720, xl: 960 };
const drawerWidths: Record<DialogSize, number> = { sm: 360, md: 440, lg: 560, xl: 720 };
const fields = 'input:not([type="hidden"]), textarea, select, [role="combobox"]';
function initialFocusCandidates(content: HTMLElement, initialFocus: DialogInitialFocus) {
  if (typeof initialFocus !== 'string') return [initialFocus.current];
  if (initialFocus !== 'first-field') {
    try {
      return [content.querySelector<HTMLElement>(initialFocus)];
    } catch {
      return [];
    }
  }
  return Array.from(content.querySelectorAll<HTMLElement>(fields)).filter(
    (field) =>
      !field.matches(':disabled, [readonly], [aria-disabled="true"]') &&
      field.tabIndex >= 0 &&
      !field.closest('[aria-hidden="true"], [inert]'),
  );
}
function focusInitial(content: HTMLElement, initialFocus: DialogInitialFocus) {
  for (const target of initialFocusCandidates(content, initialFocus)) {
    if (!target || !content.contains(target)) continue;
    target.focus({ preventScroll: true });
    if (target.ownerDocument.activeElement === target) return true;
  }
  return false;
}
function Modal({
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeOnOutside = true,
  closeDisabled = false,
  className,
  size,
  width,
  initialFocus,
  side,
}: DialogProps & { side?: boolean }) {
  const { container } = useTheme();
  const descriptionId = useId();
  const previousFocus = useRef<HTMLElement | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const resolvedWidth = width ?? (size && (side ? drawerWidths : dialogWidths)[size]);
  return (
    <DialogPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(next) => {
        if (next || !closeDisabled) onOpenChange?.(next);
      }}
    >
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Overlay className="qs-modal-overlay" />
        <DialogPrimitive.Content
          ref={content}
          className={cx('qs-dialog', 'qs-modal-content', side && 'qs-drawer-content', className)}
          style={
            resolvedWidth === undefined
              ? undefined
              : ({
                  '--qs-dialog-w':
                    typeof resolvedWidth === 'number' ? `${resolvedWidth}px` : resolvedWidth,
                } as CSSProperties)
          }
          aria-describedby={description ? descriptionId : undefined}
          onOpenAutoFocus={(event) => {
            previousFocus.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
            if (initialFocus && content.current && focusInitial(content.current, initialFocus))
              event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            if (previousFocus.current?.isConnected) {
              event.preventDefault();
              previousFocus.current.focus();
            }
          }}
          onEscapeKeyDown={(event) => {
            if (closeDisabled) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (!closeOnOutside || closeDisabled) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (closeDisabled) event.preventDefault();
          }}
        >
          <div className="hd">
            <DialogPrimitive.Title asChild>
              <h3>{title}</h3>
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <IconButton aria-label="关闭" disabled={closeDisabled}>
                <CloseIcon />
              </IconButton>
            </DialogPrimitive.Close>
          </div>
          {description && (
            <DialogPrimitive.Description id={descriptionId} className="qs-modal-description">
              {description}
            </DialogPrimitive.Description>
          )}
          <div className="bd">{children}</div>
          {footer && <div className="ft">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
export function Dialog(props: DialogProps) {
  return <Modal {...props} />;
}
export function Drawer(props: DialogProps) {
  return <Modal {...props} side />;
}
export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  pinnable?: boolean;
}
export function Tooltip({ content, children, side = 'top', delay = 300, pinnable }: TooltipProps) {
  const { container } = useTheme();
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const pressing = useRef(false);
  const open = pinned || hovered;
  const root = pinnable
    ? {
        open,
        onOpenChange: (next: boolean) => {
          if (!pressing.current) setHovered(next);
        },
      }
    : {};
  const pin = pinnable
    ? {
        ref: trigger,
        'aria-expanded': open,
        onPointerDown: () => {
          pressing.current = true;
          document.addEventListener(
            'pointerup',
            () => setTimeout(() => (pressing.current = false)),
            { once: true },
          );
        },
        onClick: () => {
          pressing.current = false;
          setHovered(false);
          setPinned(!pinned);
        },
      }
    : {};
  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root {...root}>
        <TooltipPrimitive.Trigger asChild {...pin}>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal container={container}>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className="qs-tooltip"
            data-pinned={pinned || undefined}
            onEscapeKeyDown={() => setPinned(false)}
            onPointerDownOutside={(event) => {
              if (!trigger.current?.contains(event.target as Node)) setPinned(false);
            }}
          >
            {content}
            <TooltipPrimitive.Arrow className="qs-tooltip-arrow" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
export type MenuEntry =
  | { type: 'separator'; id: string }
  | { type: 'label'; id: string; label: string }
  | {
      type?: 'item';
      id: string;
      label: string;
      icon?: ReactNode;
      shortcut?: string;
      disabled?: boolean;
      danger?: boolean;
      onSelect?: () => void;
    };
export function Menu({
  trigger,
  items,
  align = 'end',
  label = '操作菜单',
}: {
  trigger: ReactElement;
  items: MenuEntry[];
  align?: 'start' | 'center' | 'end';
  label?: string;
}) {
  const { container } = useTheme();
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger asChild>{trigger}</MenuPrimitive.Trigger>
      <MenuPrimitive.Portal container={container}>
        <MenuPrimitive.Content className="qs-menu" align={align} sideOffset={6} aria-label={label}>
          {items.map((item) =>
            item.type === 'separator' ? (
              <MenuPrimitive.Separator key={item.id} className="qs-divider" />
            ) : item.type === 'label' ? (
              <MenuPrimitive.Label key={item.id} className="qs-menu-label">
                {item.label}
              </MenuPrimitive.Label>
            ) : (
              <MenuPrimitive.Item
                key={item.id}
                className={cx('qs-menu-item', item.danger && 'qs-error')}
                disabled={item.disabled}
                onSelect={item.onSelect}
              >
                {item.icon}
                {item.label}
                {item.shortcut && <span className="qs-menu-shortcut">{item.shortcut}</span>}
              </MenuPrimitive.Item>
            ),
          )}
        </MenuPrimitive.Content>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}
export interface TabItem {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  content: ReactNode;
}
export function Tabs({
  items,
  label,
  value,
  defaultValue,
  onValueChange,
}: {
  items: TabItem[];
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  const [current, setCurrent] = useControllable(
    value,
    defaultValue ?? items.find((item) => !item.disabled)?.value ?? '',
    onValueChange,
  );
  return (
    <TabsPrimitive.Root value={current} onValueChange={setCurrent}>
      <TabsPrimitive.List asChild aria-label={label}>
        <SelectionTrack className="qs-tabs" activeKey={current} morph="size">
          {items.map((item) => (
            <TabsPrimitive.Trigger
              key={item.value}
              value={item.value}
              disabled={item.disabled}
              className="qs-tab"
            >
              {item.icon}
              {item.label}
            </TabsPrimitive.Trigger>
          ))}
        </SelectionTrack>
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content className="qs-tab-panel" key={item.value} value={item.value}>
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
