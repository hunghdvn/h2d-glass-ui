import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, Ref } from 'react';
import { Slot } from '../../internal/slot';

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** Render the single child element instead of a `div`, with Surface's props merged onto it. */
  asChild?: boolean;
}

/** The glass layer every other surface builds on. Safe to render in React Server Components. */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { asChild = false, className, ...props },
  ref,
) {
  const classes = clsx('flg-surface', className);
  if (asChild) return <Slot ref={ref as Ref<HTMLElement>} className={classes} {...props} />;
  return <div ref={ref} className={classes} {...props} />;
});
