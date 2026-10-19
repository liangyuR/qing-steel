import {
  forwardRef,
  useRef,
  type HTMLAttributes,
  type ReactNode,
  type ButtonHTMLAttributes,
} from 'react';
import { cx, useControllable } from './core';
import { Badge, Icon, IconButton } from './primitives';
import { Tooltip } from './overlays';
import SelectionTrack from './internal/SelectionTrack';

export interface NavigationItem {
  value: string;
  label: string;
  icon: ReactNode;
  href?: string;
  disabled?: boolean;
  badge?: number;
  group?: string;
}
export interface NavigationProps {
  items: NavigationItem[];
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}
function Navigation({
  items,
  label,
  value,
  defaultValue = '',
  onValueChange,
  header,
  footer,
  className,
  collapsed,
  toggle,
}: NavigationProps & { collapsed: boolean; toggle?: ReactNode }) {
  const [active, setActive] = useControllable(value, defaultValue, onValueChange);
  return (
    <nav
      aria-label={label}
      className={cx('qs-navigation', collapsed && 'qs-navigation-rail', className)}
    >
      {header && <div className="qs-navigation-header">{header}</div>}
      <SelectionTrack className="qs-navigation-items" activeKey={active}>
        {items.map((item, index) => {
          const content = (
            <>
              <span className="qs-navigation-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className={collapsed ? 'qs-sr-only' : 'qs-navigation-label'}>{item.label}</span>
              {item.badge !== undefined && (
                <Badge count={item.badge} label={`${item.label}，${item.badge} 条`} />
              )}
            </>
          );
          const shared = {
            className: 'qs-navigation-item',
            'aria-current': active === item.value ? ('page' as const) : undefined,
            onClick: () => setActive(item.value),
          };
          const control =
            item.href && !item.disabled ? (
              <a {...shared} href={item.href}>
                {content}
              </a>
            ) : (
              <button {...shared} type="button" disabled={item.disabled}>
                {content}
              </button>
            );
          return (
            <div key={item.value}>
              {item.group && item.group !== items[index - 1]?.group && !collapsed && (
                <div className="qs-navigation-group">{item.group}</div>
              )}
              {collapsed && !item.disabled ? (
                <Tooltip content={item.label} side="right">
                  {control}
                </Tooltip>
              ) : (
                control
              )}
            </div>
          );
        })}
      </SelectionTrack>
      {(footer || toggle) && (
        <div className="qs-navigation-footer">
          {footer}
          {toggle}
        </div>
      )}
    </nav>
  );
}
export function NavigationRail(props: NavigationProps) {
  return <Navigation {...props} collapsed />;
}
export interface NavigationDrawerProps extends NavigationProps {
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  collapsible?: boolean;
}
export function NavigationDrawer({
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  collapsible = true,
  ...props
}: NavigationDrawerProps) {
  const [compact, setCompact] = useControllable(collapsed, defaultCollapsed, onCollapsedChange);
  return (
    <Navigation
      {...props}
      collapsed={compact}
      toggle={
        collapsible ? (
          <IconButton
            aria-label={compact ? '展开导航' : '收起导航'}
            aria-expanded={!compact}
            onClick={() => setCompact(!compact)}
          >
            <Icon>
              <path d={compact ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'} />
            </Icon>
          </IconButton>
        ) : undefined
      }
    />
  );
}
export interface AppBarProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode;
  subtitle?: ReactNode;
  navigation?: ReactNode;
  actions?: ReactNode;
  sticky?: boolean;
}
export function AppBar({
  title,
  subtitle,
  navigation,
  actions,
  sticky,
  className,
  ...props
}: AppBarProps) {
  return (
    <header {...props} className={cx('qs-appbar', sticky && 'qs-appbar-sticky', className)}>
      {navigation}
      <div className="qs-appbar-copy">
        <div className="qs-appbar-title">{title}</div>
        {subtitle && <div className="qs-appbar-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="qs-appbar-actions">{actions}</div>}
    </header>
  );
}
export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
}
export function Toolbar({ label, className, children, onKeyDown, ...props }: ToolbarProps) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      {...props}
      ref={ref}
      role="toolbar"
      aria-label={label}
      className={cx('qs-toolbar', className)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          !(event.target instanceof HTMLElement) ||
          event.target.matches('input, textarea, select, [contenteditable="true"]')
        )
          return;
        const controls = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], [role="button"]:not([aria-disabled="true"])',
          ) ?? [],
        ).filter((element) => !element.closest('[hidden], [inert]'));
        const index = controls.indexOf(event.target);
        if (index < 0) return;
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % controls.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + controls.length) % controls.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = controls.length - 1;
        else return;
        event.preventDefault();
        controls[next]?.focus();
      }}
    >
      {children}
    </div>
  );
}
export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}
export function Breadcrumbs({
  items,
  label = '面包屑导航',
  className,
}: {
  items: BreadcrumbItem[];
  label?: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cx('qs-breadcrumbs', className)}>
      <ol>
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`}>
            {index > 0 && (
              <span className="qs-breadcrumb-separator" aria-hidden="true">
                /
              </span>
            )}
            {index === items.length - 1 ? (
              <span aria-current="page">{item.label}</span>
            ) : item.href ? (
              <a href={item.href} onClick={item.onClick}>
                {item.label}
              </a>
            ) : item.onClick ? (
              <button type="button" onClick={item.onClick}>
                {item.label}
              </button>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
export type FABProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: ReactNode;
  size?: 'sm' | 'md' | 'lg';
} & ({ label: string } | { label?: undefined; 'aria-label': string });
export const FAB = forwardRef<HTMLButtonElement, FABProps>(function FAB(
  { icon, label, size = 'md', className, ...props },
  ref,
) {
  return (
    <button
      type="button"
      {...props}
      ref={ref}
      className={cx(
        'qs-fab',
        'qs-react-fab',
        `qs-fab-${size}`,
        !!label && 'qs-fab-extended',
        className,
      )}
    >
      <span aria-hidden="true" className="qs-fab-icon">
        {icon}
      </span>
      {label && <span>{label}</span>}
    </button>
  );
});
