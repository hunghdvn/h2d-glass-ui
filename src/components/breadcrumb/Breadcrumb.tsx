import { clsx } from 'clsx';
import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, HTMLAttributes, Ref } from 'react';
import { flattenChildren } from '../../internal/collect-children';
import { strokeIcon } from '../../internal/icons';
import { Slot } from '../../internal/slot';

export type BreadcrumbSeparator = 'chevron' | 'slash';

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  /** What sits between two items. Default `"chevron"`. */
  separator?: BreadcrumbSeparator;
}
export interface BreadcrumbLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Render the single child element (for example a router's `Link`) as the link. */
  asChild?: boolean;
}
export type BreadcrumbPageProps = HTMLAttributes<HTMLSpanElement>;

const CHEVRON = (
  <svg {...strokeIcon}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/**
 * The path to the current page: `<nav aria-label="Breadcrumb">` around a list, one item per child,
 * with a separator after every item but the last. Safe to render in React Server Components.
 */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  { separator = 'chevron', className, children, 'aria-label': ariaLabel, ...props },
  ref,
) {
  const items = flattenChildren(children);
  // An empty <nav> would still be a landmark that screen readers list.
  if (items.length === 0) return null;
  return (
    <nav
      ref={ref}
      aria-label={ariaLabel ?? 'Breadcrumb'}
      className={clsx('flg-breadcrumb', className)}
      data-separator={separator}
      {...props}
    >
      <ol className="flg-breadcrumb-list">
        {items.map((item, index) => (
          // The items have no identity of their own: their place in the path is it.
          <li key={index} className="flg-breadcrumb-item">
            {item}
            {index < items.length - 1 ? (
              <span className="flg-breadcrumb-separator" aria-hidden="true">
                {separator === 'slash' ? '/' : CHEVRON}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
});

/** A link to a page on the path. With `asChild`, the child element (a router's link) is the link. */
export const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  function BreadcrumbLink({ asChild = false, className, children, ...props }, ref) {
    const shared = { className: clsx('flg-breadcrumb-link', className), ...props };
    return asChild ? (
      <Slot ref={ref as Ref<HTMLElement>} {...shared}>
        {children}
      </Slot>
    ) : (
      <a ref={ref} {...shared}>
        {children}
      </a>
    );
  },
);

/** The current page: the last item, not a link. */
export const BreadcrumbPage = forwardRef<HTMLSpanElement, BreadcrumbPageProps>(
  function BreadcrumbPage({ className, ...props }, ref) {
    return (
      <span
        ref={ref}
        aria-current="page"
        className={clsx('flg-breadcrumb-page', className)}
        {...props}
      />
    );
  },
);
