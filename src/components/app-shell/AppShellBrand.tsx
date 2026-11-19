import { clsx } from 'clsx';
import { cloneElement, forwardRef, isValidElement } from 'react';
import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { hasContent } from '../../internal/has-content';
import { resolveLazy } from '../../internal/react-lazy';
import { Slot } from '../../internal/slot';

type AppShellBrandOwnProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  /** A mark, drawn before the name; it is decoration, so it is hidden from assistive technology. */
  logo?: ReactNode;
  /** The name of the application: the text of the link. */
  name: ReactNode;
};

export type AppShellBrandProps = AppShellBrandOwnProps &
  (
    | { href?: string; asChild?: false; children?: never }
    | {
        href?: never;
        /** Render the single child element (a router's `Link`, say) with the logo and the name in it. */
        asChild: true;
        children: ReactNode;
      }
  );

/**
 * The mark and the name of the application, a link to its home when it has an `href`. Safe to render
 * in React Server Components. Give it to `AppShell` as `brand`, which draws it twice (the header and
 * the sidebar) and shows one: so it must not carry an `id`.
 */
export const AppShellBrand = forwardRef<HTMLElement, AppShellBrandProps>(function AppShellBrand(
  { logo, name, href, asChild = false, className, children, ...props },
  ref,
) {
  const classes = clsx('flg-app-shell-brand', className);
  const content = (
    <>
      {hasContent(logo) ? (
        <span className="flg-app-shell-brand-logo" aria-hidden="true">
          {logo}
        </span>
      ) : null}
      <span className="flg-app-shell-brand-name">{name}</span>
    </>
  );
  if (asChild) {
    // A Server Component can pass the child as a lazy reference, which says nothing about the
    // element until it is resolved.
    const element = resolveLazy(children);
    return (
      <Slot ref={ref as Ref<HTMLElement>} className={classes} {...props}>
        {isValidElement<{ children?: ReactNode }>(element)
          ? cloneElement(element, undefined, content)
          : element}
      </Slot>
    );
  }
  if (href !== undefined) {
    return (
      <a ref={ref as Ref<HTMLAnchorElement>} className={classes} href={href} {...props}>
        {content}
      </a>
    );
  }
  return (
    <span ref={ref as Ref<HTMLSpanElement>} className={classes} {...props}>
      {content}
    </span>
  );
});
