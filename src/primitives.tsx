import {
  forwardRef,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  type SVGProps,
  type CSSProperties,
} from 'react';
import { cx, type Size, type Tone } from './core';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: 'span' | 'p' | 'div' | 'small';
  variant?: 'body' | 'label' | 'data' | 'data-lg';
  muted?: boolean;
  mono?: boolean;
}
export function Text({
  as: Tag = 'span',
  variant = 'body',
  muted,
  mono,
  className,
  ...props
}: TextProps) {
  return (
    <Tag
      className={cx(
        'qs-text',
        `qs-text-${variant}`,
        muted && 'qs-muted',
        mono && 'qs-num',
        className,
      )}
      {...props}
    />
  );
}
export function Heading({
  level = 2,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const Tag = `h${level}` as 'h2';
  return <Tag className={cx('qs-heading', className)} {...props} />;
}
export function Icon({
  size = 18,
  label,
  children,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      {...props}
    >
      {children}
    </svg>
  );
}
export const CloseIcon = () => (
  <Icon>
    <path d="m6 6 12 12M6 18 18 6" />
  </Icon>
);
export function Stack({
  direction = 'row',
  gap = 12,
  align = 'center',
  justify,
  wrap = true,
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  direction?: 'row' | 'column';
  gap?: number;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
}) {
  return (
    <div
      className={cx('qs-stack', className)}
      style={{
        flexDirection: direction,
        gap,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        ...style,
      }}
      {...props}
    />
  );
}
export function Grid({
  minWidth = 240,
  gap = 16,
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { minWidth?: number; gap?: number }) {
  return (
    <div
      className={cx('qs-grid', className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minWidth}px), 1fr))`,
        gap,
        ...style,
      }}
      {...props}
    />
  );
}
export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  level?: 'lowest' | 'low' | 'mid' | 'high' | 'highest';
}
export function Surface({ level = 'low', className, style, ...props }: SurfaceProps) {
  return (
    <div
      className={cx('qs-surface', className)}
      style={{ background: `var(--surface-${level})`, ...style }}
      {...props}
    />
  );
}
export function Card({
  title,
  actions,
  children,
  className,
  ...props
}: Omit<SurfaceProps, 'title'> & { title?: ReactNode; actions?: ReactNode }) {
  return (
    <Surface className={cx('qs-react-card', className)} {...props}>
      {(title || actions) && (
        <div className="qs-card-heading">
          <div>{title}</div>
          {actions}
        </div>
      )}
      {children}
    </Surface>
  );
}
export function Divider({
  vertical,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { vertical?: boolean }) {
  return (
    <div
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      className={cx('qs-divider', vertical && 'vertical', className)}
      {...props}
    />
  );
}
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text';
  size?: Size;
  danger?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'tonal',
    size = 'md',
    danger,
    loading,
    leadingIcon,
    trailingIcon,
    className,
    children,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <button
      type="button"
      {...props}
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'qs-btn',
        variant !== 'filled' && variant,
        size === 'sm' && 'sm',
        danger && (variant === 'filled' ? 'danger' : 'danger-tonal'),
        className,
      )}
    >
      {loading ? (
        <span className="qs-loading-dot" aria-hidden="true">
          ···
        </span>
      ) : (
        leadingIcon
      )}
      {children}
      {trailingIcon}
    </button>
  );
});
export interface IconButtonProps extends ButtonProps {
  'aria-label': string;
  selected?: boolean;
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { selected, className, ...props },
  ref,
) {
  return (
    <Button
      {...props}
      ref={ref}
      aria-pressed={selected}
      className={cx('icon', selected && 'qs-selected', className)}
    />
  );
});
export function Chip({
  selected,
  onRemove,
  removeLabel = '移除',
  children,
  className,
  onClick,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <span className="qs-chip-wrap">
      {onClick || selected !== undefined ? (
        <button
          type="button"
          {...props}
          disabled={disabled}
          onClick={onClick}
          aria-pressed={selected}
          className={cx('qs-chip', 'action', selected && 'selected', className)}
        >
          {children}
        </button>
      ) : (
        <span className={cx('qs-chip', className)}>{children}</span>
      )}
      {onRemove && (
        <button
          type="button"
          className="qs-chip-remove"
          aria-label={removeLabel}
          disabled={disabled}
          onClick={onRemove}
        >
          <CloseIcon />
        </button>
      )}
    </span>
  );
}
export function Badge({
  count,
  max = 99,
  label,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { count?: number; max?: number; label?: string }) {
  return (
    <span
      className={cx('qs-count', count === undefined && 'dot', className)}
      aria-label={label ?? (count === undefined ? '有新消息' : `${count} 条消息`)}
      {...props}
    >
      {count === undefined ? null : count > max ? `${max}+` : count}
    </span>
  );
}
export function StatusBadge({
  tone = 'info',
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone | 'off' }) {
  return (
    <span className={cx('qs-badge', tone, className)} {...props}>
      <span className="dot" aria-hidden="true" />
      {children}
    </span>
  );
}
export function List({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
  return <ul className={cx('qs-list', className)} {...props} />;
}
export function ListItem({
  title,
  description,
  leading,
  trailing,
  selected,
  onClick,
  disabled,
}: {
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const content = (
    <>
      {leading}
      <span className="qs-list-copy">
        <span>{title}</span>
        {description && <small>{description}</small>}
      </span>
    </>
  );
  return (
    <li className={cx('qs-list-item', selected && 'qs-selected')}>
      {onClick ? (
        <button type="button" disabled={disabled} onClick={onClick} aria-pressed={selected}>
          {content}
        </button>
      ) : (
        <div className="qs-list-main">{content}</div>
      )}
      {trailing && <div className="qs-list-trailing">{trailing}</div>}
    </li>
  );
}
export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="qs-empty">
      {icon}
      <b>{title}</b>
      {description && <small>{description}</small>}
      {action}
    </div>
  );
}
