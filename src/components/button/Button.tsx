'use client';

import { clsx } from 'clsx';
import { cloneElement, forwardRef, isValidElement } from 'react';
import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react';
import { dataAttr } from '../../internal/data-attr';
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

// Runs in the capture phase so neither the button's nor an asChild element's own onClick fires,
// and preventDefault() also stops form submission and link navigation.
function blockActivation(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

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
  };

  if (asChild) {
    const child = isValidElement<{ children?: ReactNode }>(children)
      ? cloneElement(children, undefined, withSpinner(loading, children.props.children))
      : children;
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
