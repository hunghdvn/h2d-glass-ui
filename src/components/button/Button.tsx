'use client';

import { clsx } from 'clsx';
import { cloneElement, forwardRef, isValidElement } from 'react';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { blockActivation } from '../../internal/click';
import { dataAttr } from '../../internal/data-attr';
import { resolveLazy } from '../../internal/react-lazy';
import { Slot } from '../../internal/slot';
import { SpinnerIcon } from '../spinner/SpinnerIcon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, sets aria-busy and ignores activation while keeping focus. */
  loading?: boolean;
  /** Render the single child element (for example a link) with the button's look and behaviour. */
  asChild?: boolean;
}

const spinner = (
  <span className="flg-spinner" aria-hidden="true">
    <SpinnerIcon />
  </span>
);

// The spinner slot is always rendered, so the children keep their position in the tree (and their
// state) when `loading` flips.
function withSpinner(loading: boolean, children: ReactNode): ReactNode {
  return (
    <>
      {loading ? spinner : null}
      {children}
    </>
  );
}

// HTML void elements cannot have children, so an `asChild` element such as `<input type="submit">`
// is passed through as it is, without the spinner slot.
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

/** The library's button. Never submits a form unless `type="submit"`. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    asChild = false,
    disabled = false,
    type,
    className,
    children,
    ...props
  },
  ref,
) {
  const inert = loading || (asChild && disabled);
  const shared = {
    ...props,
    className: clsx('flg-button', className),
    'data-variant': variant,
    'data-size': size,
    'data-loading': dataAttr(loading),
    'aria-busy': loading || undefined,
    'aria-disabled': inert || props['aria-disabled'] || undefined,
    onClickCapture: inert ? blockActivation : props.onClickCapture,
    onAuxClickCapture: inert ? blockActivation : props.onAuxClickCapture,
  };

  if (asChild) {
    // A Server Component can pass the child as a lazy reference, which says nothing about the
    // element until it is resolved.
    const element = resolveLazy(children);
    const child =
      isValidElement<{ children?: ReactNode }>(element) &&
      !(typeof element.type === 'string' && VOID_ELEMENTS.has(element.type))
        ? cloneElement(element, undefined, withSpinner(loading, element.props.children))
        : element;
    return (
      <Slot ref={ref as Ref<HTMLElement>} {...shared} tabIndex={disabled ? -1 : props.tabIndex}>
        {child}
      </Slot>
    );
  }

  return (
    <button ref={ref} type={type ?? 'button'} disabled={disabled} {...shared}>
      {withSpinner(loading, children)}
    </button>
  );
});
