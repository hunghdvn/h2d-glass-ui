import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes, Ref } from 'react';
import { Slot } from '../../internal/slot';
import { Surface } from '../surface/Surface';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Render the single child element instead of a `div`. */
  asChild?: boolean;
}
export type CardHeaderProps = HTMLAttributes<HTMLDivElement>;
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Render the single child element (another heading level) instead of an `h3`. */
  asChild?: boolean;
}
export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;
export type CardContentProps = HTMLAttributes<HTMLDivElement>;
export type CardFooterProps = HTMLAttributes<HTMLDivElement>;

/** A glass panel with the card layout. Safe to render in React Server Components. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, ...props },
  ref,
) {
  return <Surface ref={ref} className={clsx('flg-card', className)} {...props} />;
});

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-card-header', className)} {...props} />;
});

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
  { asChild = false, className, children, ...props },
  ref,
) {
  const classes = clsx('flg-card-title', className);
  if (asChild) {
    return (
      <Slot ref={ref as Ref<HTMLElement>} className={classes} {...props}>
        {children}
      </Slot>
    );
  }
  return (
    <h3 ref={ref} className={classes} {...props}>
      {children}
    </h3>
  );
});

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  function CardDescription({ className, ...props }, ref) {
    return <p ref={ref} className={clsx('flg-card-description', className)} {...props} />;
  },
);

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(function CardContent(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-card-content', className)} {...props} />;
});

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={clsx('flg-card-footer', className)} {...props} />;
});
