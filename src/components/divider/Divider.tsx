import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, Ref } from 'react';

export interface DividerProps extends HTMLAttributes<HTMLElement> {
  orientation?: 'horizontal' | 'vertical';
  /** Purely visual: hidden from assistive technology. */
  decorative?: boolean;
}

/** A thin line between content. Safe to render in React Server Components. */
export const Divider = forwardRef<HTMLElement, DividerProps>(function Divider(
  { orientation = 'horizontal', decorative = false, className, ...props },
  ref,
) {
  const classes = clsx('flg-divider', className);
  if (orientation === 'vertical') {
    const semantics = decorative
      ? { 'aria-hidden': true }
      : { role: 'separator', 'aria-orientation': 'vertical' as const };
    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
        className={classes}
        data-orientation="vertical"
        {...semantics}
        {...props}
      />
    );
  }
  return (
    <hr
      ref={ref as Ref<HTMLHRElement>}
      className={classes}
      data-orientation="horizontal"
      role={decorative ? 'none' : undefined}
      {...props}
    />
  );
});
