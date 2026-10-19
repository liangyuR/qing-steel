import {
  Fragment,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cx, useControllable, useTheme } from './core';
import { Badge, Icon, IconButton } from './primitives';
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
export interface NavigationLinkProps {
  href: string;
  className: string;
  'aria-current': 'page' | undefined;
  'data-value': string;
  onClick: (event: MouseEvent<HTMLElement>) => void;
  children: ReactNode;
}
export type NavigationCollapsedLabels = 'tooltip' | 'visible';
export interface NavigationProps {
  items: NavigationItem[];
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  header?: ReactNode;
  footer?: ReactNode;
  footerItems?: NavigationItem[];
  renderLink?: (props: NavigationLinkProps, item: NavigationItem) => ReactElement;
  collapsedLabels?: NavigationCollapsedLabels;
  className?: string;
}

type Motion = 'out' | 'move';
type Section = { group?: string; items: NavigationItem[] };
type Snapshot = { rects: Map<Element, DOMRect>; edge: number; content: number | null };

const FLIP_TARGETS =
  '.qs-navigation-icon, .qs-navigation-toggle, .qs-navigation-header > *, .qs-navigation-footer > :not(.qs-navigation-footer-items)';

function motionMs(element: Element, token: string) {
  if (!('animate' in element) || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    return 0;
  const value = getComputedStyle(element).getPropertyValue(token).trim();
  const amount = parseFloat(value);
  return Number.isFinite(amount) ? amount * (value.endsWith('ms') ? 1 : 1000) : 0;
}

function capture(nav: HTMLElement, content?: HTMLElement | null): Snapshot {
  const rects = new Map<Element, DOMRect>();
  for (const element of nav.querySelectorAll(FLIP_TARGETS))
    rects.set(element, element.getBoundingClientRect());
  const box = nav.getBoundingClientRect();
  const fill = nav.querySelector('.qs-navigation-surface > span')?.getBoundingClientRect();
  return {
    rects,
    edge: (fill?.width ? fill.right : box.right) - box.left,
    content: content ? content.getBoundingClientRect().left : null,
  };
}

function release(animations: Animation[]) {
  for (const animation of animations) {
    animation.onfinish = animation.oncancel = null;
    animation.cancel();
  }
}

function play(
  nav: HTMLElement,
  before: Snapshot,
  content: HTMLElement | null | undefined,
  duration: number,
) {
  const timing = {
    duration,
    easing: getComputedStyle(nav).getPropertyValue('--ease-standard').trim() || 'ease',
  };
  const animations: Animation[] = [];
  for (const element of nav.querySelectorAll<HTMLElement>(FLIP_TARGETS)) {
    const from = before.rects.get(element);
    const to = element.getBoundingClientRect();
    if (!from?.width || !to.width) continue;
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
    animations.push(
      element.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        timing,
      ),
    );
  }
  const frame = nav.querySelector<HTMLElement>('.qs-navigation-surface');
  const fill = frame?.firstElementChild;
  const width = nav.getBoundingClientRect().width;
  if (frame) frame.style.width = '';
  if (frame && fill instanceof HTMLElement && Math.abs(before.edge - width) >= 0.5) {
    const span = Math.max(before.edge, width);
    frame.style.width = `${span}px`;
    const surface = fill.animate(
      [
        { transform: `translateX(${before.edge - span}px)` },
        { transform: `translateX(${width - span}px)` },
      ],
      timing,
    );
    surface.onfinish = surface.oncancel = () => {
      frame.style.width = '';
    };
    animations.push(surface);
  }
  if (content && before.content !== null) {
    const dx = before.content - content.getBoundingClientRect().left;
    if (Math.abs(dx) >= 0.5)
      animations.push(
        content.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], timing),
      );
  }
  return animations;
}

function useCollapseMotion(
  requested: boolean,
  navRef: RefObject<HTMLElement | null>,
  contentRef?: RefObject<HTMLElement | null>,
) {
  const [shown, setShown] = useState(requested);
  const [phase, setPhase] = useState<Motion>();
  const timer = useRef(0);
  const snapshot = useRef<Snapshot | null>(null);
  const animations = useRef<Animation[]>([]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (requested === shown) {
      if (phase === 'out') {
        window.clearTimeout(timer.current);
        setPhase(undefined);
      }
      return;
    }
    const fade = nav ? motionMs(nav, '--dur-short') : 0;
    const move = nav ? motionMs(nav, '--dur-medium') : 0;
    const commit = () => {
      snapshot.current = nav && move ? capture(nav, contentRef?.current) : null;
      window.clearTimeout(timer.current);
      setShown(requested);
      setPhase(move ? 'move' : undefined);
      if (move) timer.current = window.setTimeout(() => setPhase(undefined), move);
    };
    if (phase === 'move' || !fade) commit();
    else if (phase !== 'out') {
      setPhase('out');
      timer.current = window.setTimeout(() => flushSync(commit), fade);
    }
  }, [requested, shown, phase, navRef, contentRef]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const before = snapshot.current;
    snapshot.current = null;
    if (!nav || !before) return;
    release(animations.current);
    animations.current = play(nav, before, contentRef?.current, motionMs(nav, '--dur-medium'));
  }, [shown, navRef, contentRef]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      release(animations.current);
    },
    [],
  );
  return [shown, phase] as const;
}

function ItemTooltip({
  content,
  enabled,
  children,
}: {
  content: ReactNode;
  enabled: boolean;
  children: ReactElement;
}) {
  const { container } = useTheme();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!enabled) setOpen(false);
  }, [enabled]);
  return (
    <TooltipPrimitive.Root open={enabled && open} onOpenChange={(next) => setOpen(enabled && next)}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal container={container}>
        <TooltipPrimitive.Content side="right" sideOffset={8} className="qs-tooltip">
          {content}
          <TooltipPrimitive.Arrow className="qs-tooltip-arrow" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

function sectionsOf(items: NavigationItem[]) {
  const sections: Section[] = [];
  for (const item of items) {
    const last = sections[sections.length - 1];
    if (last && last.group === item.group) last.items.push(item);
    else sections.push({ group: item.group, items: [item] });
  }
  return sections;
}

const currentOf = (nav: HTMLElement | null) =>
  nav?.querySelector<HTMLElement>(".qs-navigation-item[aria-current='page']")?.dataset.value ?? '';

function Navigation({
  items,
  label,
  value,
  defaultValue = '',
  onValueChange,
  header,
  footer,
  footerItems,
  renderLink,
  collapsedLabels = 'tooltip',
  className,
  collapsed,
  motion,
  toggle,
  navRef,
}: NavigationProps & {
  collapsed: boolean;
  motion?: Motion;
  toggle?: ReactNode;
  navRef?: RefObject<HTMLElement | null>;
}) {
  const [active, setActive] = useControllable(value, defaultValue, onValueChange);
  const [current, setCurrent] = useState(active);
  const ownRef = useRef<HTMLElement>(null);
  const ref = navRef ?? ownRef;
  const labeled = collapsed && collapsedLabels === 'visible';
  const tooltips = collapsed && !labeled && !motion;

  useLayoutEffect(() => {
    setCurrent(currentOf(ref.current));
  });
  useEffect(() => {
    const nav = ref.current;
    if (!nav || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => setCurrent(currentOf(nav)));
    observer.observe(nav, { subtree: true, attributeFilter: ['aria-current'] });
    return () => observer.disconnect();
  }, [ref]);

  const renderItem = (item: NavigationItem) => {
    const content = (
      <>
        <span className="qs-navigation-icon" aria-hidden="true">
          {item.icon}
        </span>
        <span className={cx('qs-navigation-label', collapsed && !labeled && 'qs-sr-only')}>
          {item.label}
        </span>
        {item.badge !== undefined && (
          <Badge count={item.badge} label={`${item.label}，${item.badge} 条`} />
        )}
      </>
    );
    const shared = {
      className: 'qs-navigation-item',
      'aria-current': active === item.value ? ('page' as const) : undefined,
      'data-value': item.value,
      onClick: () => setActive(item.value),
    };
    const control =
      item.href && !item.disabled ? (
        renderLink ? (
          renderLink({ ...shared, href: item.href, children: content }, item)
        ) : (
          <a {...shared} href={item.href}>
            {content}
          </a>
        )
      ) : (
        <button {...shared} type="button" disabled={item.disabled}>
          {content}
        </button>
      );
    return (
      <ItemTooltip key={item.value} content={item.label} enabled={tooltips && !item.disabled}>
        {control}
      </ItemTooltip>
    );
  };

  return (
    <nav
      ref={ref}
      aria-label={label}
      className={cx(
        'qs-navigation',
        collapsed && 'qs-navigation-rail',
        labeled && 'qs-navigation-labeled',
        className,
      )}
      data-motion={motion}
    >
      <span className="qs-navigation-surface" aria-hidden="true">
        <span />
      </span>
      <TooltipPrimitive.Provider delayDuration={300}>
        {header && <div className="qs-navigation-header">{header}</div>}
        <SelectionTrack className="qs-navigation-items" activeKey={current}>
          {sectionsOf(items).map((section) =>
            section.group === undefined ? (
              <Fragment key={`items-${section.items[0].value}`}>
                {section.items.map(renderItem)}
              </Fragment>
            ) : (
              <div
                key={`group-${section.items[0].value}`}
                role="group"
                aria-label={section.group}
                className="qs-navigation-section"
              >
                <div className="qs-navigation-group" aria-hidden="true">
                  <span>{section.group}</span>
                </div>
                {section.items.map(renderItem)}
              </div>
            ),
          )}
        </SelectionTrack>
        {(footerItems?.length || footer || toggle) && (
          <div className="qs-navigation-footer">
            {!!footerItems?.length && (
              <div className="qs-navigation-footer-items">{footerItems.map(renderItem)}</div>
            )}
            {footer}
            {toggle}
          </div>
        )}
      </TooltipPrimitive.Provider>
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
  expandLabel?: string;
  collapseLabel?: string;
  contentRef?: RefObject<HTMLElement | null>;
}
export function NavigationDrawer({
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  collapsible = true,
  expandLabel = '展开导航',
  collapseLabel = '收起导航',
  contentRef,
  ...props
}: NavigationDrawerProps) {
  const [compact, setCompact] = useControllable(collapsed, defaultCollapsed, onCollapsedChange);
  const navRef = useRef<HTMLElement>(null);
  const [shown, motion] = useCollapseMotion(compact, navRef, contentRef);
  return (
    <Navigation
      {...props}
      navRef={navRef}
      collapsed={shown}
      motion={motion}
      toggle={
        collapsible ? (
          <IconButton
            className="qs-navigation-toggle"
            aria-label={compact ? expandLabel : collapseLabel}
            aria-expanded={!compact}
            onClick={() => setCompact(!compact)}
          >
            <Icon>
              <path d="m15 6-6 6 6 6" />
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
function scrollRoot(element: HTMLElement) {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (/(auto|scroll|overlay|hidden)/.test(style.overflowY + style.overflowX)) return node;
  }
  return null;
}
function useStuck(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const element = ref.current;
    setStuck(false);
    if (!enabled || !element) return;
    const root = scrollRoot(element);
    const target = root ?? window;
    const offset = parseFloat(getComputedStyle(element).top) || 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrolled = root ? root.scrollTop : window.scrollY;
      const edge = root ? root.getBoundingClientRect().top + root.clientTop : 0;
      setStuck(scrolled > 0 && element.getBoundingClientRect().top <= edge + offset + 0.5);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    target.addEventListener('scroll', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener('scroll', schedule);
    };
  }, [ref, enabled]);
  return stuck;
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
  const ref = useRef<HTMLElement>(null);
  const stuck = useStuck(ref, !!sticky);
  return (
    <header
      {...props}
      ref={ref}
      className={cx('qs-appbar', sticky && 'qs-appbar-sticky', className)}
      data-stuck={stuck ? '' : undefined}
    >
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
