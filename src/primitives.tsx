import {
  Children,
  cloneElement,
  forwardRef,
  useId,
  useMemo,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefAttributes,
  type SVGProps,
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
const present = (node: ReactNode) => node != null && node !== false && node !== '';
export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  level?: 'lowest' | 'low' | 'mid' | 'high' | 'highest';
  as?: 'div' | 'section' | 'article' | 'aside';
}
export function Surface({
  level = 'low',
  as: Tag = 'div',
  className,
  style,
  ...props
}: SurfaceProps) {
  return (
    <Tag
      className={cx('qs-surface', className)}
      style={{ background: `var(--surface-${level})`, ...style }}
      {...props}
    />
  );
}
export interface CardProps extends Omit<SurfaceProps, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}
export function Card({
  title,
  description,
  actions,
  headingLevel,
  children,
  className,
  ...props
}: CardProps) {
  const titleId = `${useId()}-title`;
  const hasTitle = present(title);
  const Title = headingLevel ? (`h${headingLevel}` as 'h2') : 'div';
  const named =
    hasTitle &&
    ((props.as ?? 'div') !== 'div' || props.role != null) &&
    !props['aria-label'] &&
    !props['aria-labelledby'];
  return (
    <Surface
      aria-labelledby={named ? titleId : undefined}
      {...props}
      className={cx('qs-react-card', className)}
    >
      {(hasTitle || present(description) || present(actions)) && (
        <div className="qs-card-heading">
          <div className="qs-card-heading-text">
            {hasTitle && (
              <Title id={titleId} className="qs-card-title">
                {title}
              </Title>
            )}
            {present(description) && <div className="qs-card-description">{description}</div>}
          </div>
          {present(actions) && <div className="qs-card-actions">{actions}</div>}
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
export type ButtonTone = 'danger' | 'warn';
interface ButtonAppearance {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text';
  size?: Size;
  danger?: boolean;
  tone?: ButtonTone;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonAppearance {
  asChild?: boolean;
  href?: undefined;
}
export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement>, ButtonAppearance {
  href: string;
  disabled?: boolean;
  asChild?: false;
}
type ButtonComponent = {
  (props: ButtonLinkProps & RefAttributes<HTMLAnchorElement>): ReactElement | null;
  (props: ButtonProps & RefAttributes<HTMLButtonElement>): ReactElement | null;
};
type AnyButtonProps = ButtonProps | ButtonLinkProps;
type WarnedGetter = { isReactWarning?: boolean } | undefined;
function refOf(element: ReactElement): Ref<unknown> | undefined {
  // React 19 把 ref 放进 props，React 18 留在元素上；避开开发模式下的警告 getter。
  const props = element.props as { ref?: Ref<unknown> };
  const legacy = () => (element as unknown as { ref?: Ref<unknown> }).ref;
  if ((Object.getOwnPropertyDescriptor(props, 'ref')?.get as WarnedGetter)?.isReactWarning)
    return legacy();
  if ((Object.getOwnPropertyDescriptor(element, 'ref')?.get as WarnedGetter)?.isReactWarning)
    return props.ref;
  return props.ref ?? legacy();
}
function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}
function blockInactive(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}
const ButtonImpl = forwardRef<HTMLElement, AnyButtonProps>(function Button(
  {
    variant = 'tonal',
    size = 'md',
    danger,
    tone,
    loading,
    leadingIcon,
    trailingIcon,
    asChild,
    className,
    children,
    disabled,
    ...props
  },
  ref,
) {
  const inactive = !!(disabled || loading);
  const tint = tone ?? (danger ? 'danger' : undefined);
  const lead = loading ? (
    <span className="qs-loading-dot" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  ) : (
    leadingIcon
  );
  const classes = cx(
    'qs-btn',
    variant !== 'filled' && variant,
    size === 'sm' && 'sm',
    tint && (variant === 'filled' ? tint : `${tint}-tonal`),
    present(lead) && 'with-leading',
    present(trailingIcon) && 'with-trailing',
    className,
  );
  const child = asChild ? (Children.only(children) as ReactElement<Record<string, unknown>>) : null;
  const childRef = child ? refOf(child) : undefined;
  const composedRef = useMemo(
    () =>
      childRef
        ? (node: HTMLElement | null) => {
            assignRef(ref, node);
            assignRef(childRef, node);
          }
        : ref,
    [ref, childRef],
  );
  if (child) {
    const own = child.props;
    const slot = props as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...slot, ...own };
    for (const key of Object.keys(own)) {
      const mine = slot[key];
      const theirs = own[key];
      if (/^on[A-Z]/.test(key) && typeof mine === 'function' && typeof theirs === 'function')
        merged[key] = (...args: unknown[]) => {
          theirs(...args);
          mine(...args);
        };
    }
    merged.className = cx(classes, own.className as string | undefined);
    if (props.style || own.style)
      merged.style = { ...props.style, ...(own.style as CSSProperties | undefined) };
    if (loading) merged['aria-busy'] = true;
    if (inactive) {
      Object.assign(merged, {
        'aria-disabled': true,
        tabIndex: -1,
        onClick: blockInactive,
        onAuxClick: blockInactive,
      });
      if (child.type === 'button') merged.disabled = true;
    }
    merged.ref = composedRef;
    return cloneElement(child, merged, lead, own.children as ReactNode, trailingIcon);
  }
  if (props.href !== undefined) {
    const { href, onClick, onAuxClick, tabIndex, ...anchor } = props as ButtonLinkProps;
    return (
      <a
        {...anchor}
        ref={ref as Ref<HTMLAnchorElement>}
        href={inactive ? undefined : href}
        role={inactive ? 'link' : anchor.role}
        tabIndex={inactive ? undefined : tabIndex}
        aria-disabled={inactive || anchor['aria-disabled']}
        aria-busy={loading || undefined}
        className={classes}
        onClick={inactive ? blockInactive : onClick}
        onAuxClick={inactive ? blockInactive : onAuxClick}
      >
        {lead}
        {children}
        {trailingIcon}
      </a>
    );
  }
  return (
    <button
      type="button"
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
      ref={ref as Ref<HTMLButtonElement>}
      disabled={inactive}
      aria-busy={loading || undefined}
      className={classes}
    >
      {lead}
      {children}
      {trailingIcon}
    </button>
  );
});
export const Button = ButtonImpl as unknown as ButtonComponent;
export interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  'aria-label': string;
  selected?: boolean;
  size?: Size | 'xs';
}
export interface IconButtonLinkProps extends Omit<ButtonLinkProps, 'size'> {
  'aria-label': string;
  selected?: boolean;
  size?: Size | 'xs';
}
type IconButtonComponent = {
  (props: IconButtonLinkProps & RefAttributes<HTMLAnchorElement>): ReactElement | null;
  (props: IconButtonProps & RefAttributes<HTMLButtonElement>): ReactElement | null;
};
export const IconButton = forwardRef<HTMLElement, IconButtonProps | IconButtonLinkProps>(
  function IconButton({ selected, size, className, ...props }, ref) {
    const pressable = props.href === undefined && !props.asChild;
    return (
      <ButtonImpl
        {...props}
        ref={ref}
        size={size === 'xs' ? undefined : size}
        aria-pressed={pressable && selected !== undefined ? selected : props['aria-pressed']}
        className={cx('icon', size === 'xs' && 'xs', selected && 'qs-selected', className)}
      />
    );
  },
) as unknown as IconButtonComponent;
export type ChipTone = 'ok' | 'warn' | 'ng' | 'fault';
export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
  label?: ReactNode;
  tone?: ChipTone;
  size?: Size;
}
export function Chip({
  selected,
  onRemove,
  removeLabel = '移除',
  label,
  tone,
  size,
  children,
  className,
  onClick,
  disabled,
  type,
  name,
  value,
  form,
  formAction,
  formEncType,
  formMethod,
  formNoValidate,
  formTarget,
  ...props
}: ChipProps) {
  const classes = cx('qs-chip', size === 'sm' && 'sm', tone, className);
  const content = present(label) ? (
    <>
      <span className="qs-chip-key">{label}</span>
      <span className="qs-chip-value">{children}</span>
    </>
  ) : (
    children
  );
  return (
    <span className="qs-chip-wrap">
      {onClick || selected !== undefined ? (
        <button
          type={type ?? 'button'}
          name={name}
          value={value}
          form={form}
          formAction={formAction}
          formEncType={formEncType}
          formMethod={formMethod}
          formNoValidate={formNoValidate}
          formTarget={formTarget}
          {...props}
          disabled={disabled}
          onClick={onClick}
          aria-pressed={selected}
          className={cx(classes, 'action', selected && 'selected')}
        >
          {content}
        </button>
      ) : (
        <span {...props} className={classes}>
          {content}
        </span>
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
export type StatusBadgeTone = Tone | 'off' | 'neutral';
export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusBadgeTone;
}
export function StatusBadge({ tone = 'info', children, className, ...props }: StatusBadgeProps) {
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
export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div className={cx('qs-empty', className)} {...props}>
      {icon}
      <b>{title}</b>
      {description && <small>{description}</small>}
      {action}
    </div>
  );
}
