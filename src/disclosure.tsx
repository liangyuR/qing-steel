import { useId, type ReactNode, type ReactElement } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cx, useTheme } from './core';
import { CloseIcon, IconButton } from './primitives';

export interface AccordionItem {
  value: string;
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}
interface AccordionBase {
  items: AccordionItem[];
  className?: string;
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
export function Accordion(props: AccordionProps) {
  const content = props.items.map((item) => (
    <AccordionPrimitive.Item
      key={item.value}
      value={item.value}
      disabled={item.disabled}
      className="qs-accordion-item"
    >
      <AccordionPrimitive.Header className="qs-accordion-heading">
        <AccordionPrimitive.Trigger className="qs-accordion-trigger">
          {item.title}
          <span className="qs-accordion-chevron" aria-hidden="true">
            ⌄
          </span>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="qs-accordion-content">
        <div>{item.content}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  ));
  const className = cx('qs-accordion', props.className);
  return props.multiple ? (
    <AccordionPrimitive.Root
      type="multiple"
      className={className}
      value={props.value}
      defaultValue={props.defaultValue}
      onValueChange={props.onValueChange}
    >
      {content}
    </AccordionPrimitive.Root>
  ) : (
    <AccordionPrimitive.Root
      type="single"
      className={className}
      value={props.value}
      defaultValue={props.defaultValue}
      onValueChange={props.onValueChange}
      collapsible={props.collapsible ?? true}
    >
      {content}
    </AccordionPrimitive.Root>
  );
}
export interface PopoverProps {
  trigger: ReactElement;
  title: string;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
}
export function Popover({
  trigger,
  title,
  children,
  open,
  defaultOpen,
  onOpenChange,
  side = 'bottom',
  align = 'start',
  className,
}: PopoverProps) {
  const { container } = useTheme();
  const id = useId();
  return (
    <PopoverPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className={cx('qs-popover', className)}
          aria-labelledby={id}
        >
          <div className="qs-popover-heading">
            <strong id={id}>{title}</strong>
            <PopoverPrimitive.Close asChild>
              <IconButton size="sm" aria-label="关闭浮层">
                <CloseIcon />
              </IconButton>
            </PopoverPrimitive.Close>
          </div>
          {children}
          <PopoverPrimitive.Arrow className="qs-popover-arrow" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
