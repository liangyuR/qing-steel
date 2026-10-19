import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from './core';

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
}
export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={cx('qs-skeleton', `qs-skeleton-${variant}`, className)}
      style={{ width, height: height ?? (variant === 'circular' ? width : undefined), ...style }}
    />
  );
}
