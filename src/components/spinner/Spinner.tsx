import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { SpinnerIcon } from './SpinnerIcon';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg';
  /** Read out by screen readers. */
  label?: string;
}

/** A loading indicator announced as a status. Safe to render in React Server Components. */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', label = 'Loading', className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      className={clsx('flg-spinner', className)}
      data-size={size}
      {...props}
    >
      <SpinnerIcon />
      <span className="flg-visually-hidden">{label}</span>
    </span>
  );
});
