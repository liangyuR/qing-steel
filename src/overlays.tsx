import { useId, useRef, type ReactElement, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as MenuPrimitive from '@radix-ui/react-dropdown-menu';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cx, useTheme } from './core';
import { CloseIcon, IconButton } from './primitives';

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
  side,
}: DialogProps & { side?: boolean }) {
  const { container } = useTheme();
  const descriptionId = useId();
  const previousFocus = useRef<HTMLElement | null>(null);
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
          className={cx('qs-dialog', 'qs-modal-content', side && 'qs-drawer-content', className)}
          aria-describedby={description ? descriptionId : undefined}
          onOpenAutoFocus={() => {
            previousFocus.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
export function Tooltip({
  content,
  children,
  side = 'top',
  delay = 300,
}: {
  content: ReactNode;
  children: ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}) {
  const { container } = useTheme();
  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal container={container}>
          <TooltipPrimitive.Content side={side} sideOffset={6} className="qs-tooltip">
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
  return (
    <TabsPrimitive.Root
      value={value}
      defaultValue={defaultValue ?? items.find((item) => !item.disabled)?.value}
      onValueChange={onValueChange}
    >
      <TabsPrimitive.List className="qs-tabs" aria-label={label}>
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
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content className="qs-tab-panel" key={item.value} value={item.value}>
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
