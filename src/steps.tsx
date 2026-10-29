import type { AnchorHTMLAttributes, ReactElement, ReactNode } from 'react';
import { Button, StatusBadge, type StatusBadgeTone } from './primitives';
import { cx } from './core';

export interface StepItem {
  value: string;
  label: ReactNode;
  href: string;
  number?: ReactNode;
  optional?: boolean;
  status?: ReactNode;
  tone?: StatusBadgeTone;
}
export interface StepLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}
export interface StepsProps {
  items: StepItem[];
  label: string;
  currentValue?: string;
  optionalLabel?: ReactNode;
  renderLink?: (props: StepLinkProps, item: StepItem) => ReactElement;
  className?: string;
}

export function Steps({
  items,
  label,
  currentValue,
  optionalLabel = '可选',
  renderLink,
  className,
}: StepsProps) {
  return (
    <nav aria-label={label} className={cx('qs-steps', className)}>
      <ol>
        {items.map((item, index) => {
          const current = item.value === currentValue;
          const props: StepLinkProps = {
            href: item.href,
            'aria-current': current ? 'step' : undefined,
            children: (
              <>
                <span className="qs-step-number" aria-hidden="true">
                  {item.number ?? index + 1}
                </span>
                <span>{item.label}</span>
                {item.optional && <small className="qs-step-optional">{optionalLabel}</small>}
                {item.status != null && (
                  <StatusBadge tone={item.tone ?? 'neutral'}>{item.status}</StatusBadge>
                )}
              </>
            ),
          };
          return (
            <li key={item.value}>
              <Button asChild variant={current ? 'tonal' : 'text'} className="qs-step">
                {renderLink ? renderLink(props, item) : <a {...props} />}
              </Button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
