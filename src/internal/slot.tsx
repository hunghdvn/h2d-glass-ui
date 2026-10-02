import { clsx } from 'clsx';
import { Children, cloneElement, forwardRef, Fragment, isValidElement } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { composeEventHandlers } from './compose-event-handlers';
import { mergeRefs } from './merge-refs';
import { IS_REACT_19 } from './react-version';
import { devWarn } from './warn';

type AnyProps = Record<string, unknown>;
type AnyHandler = (event: { defaultPrevented: boolean }) => void;

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

// React 19 passes `ref` as a regular prop; React 18 keeps it on the element.
function getElementRef(element: ReactElement): Ref<unknown> | undefined {
  return IS_REACT_19
    ? (element.props as { ref?: Ref<unknown> }).ref
    : (element as unknown as { ref?: Ref<unknown> }).ref;
}

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps, ...childProps };
  for (const key of Object.keys(slotProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    if (/^on[A-Z]/.test(key) && typeof slotValue === 'function') {
      merged[key] = composeEventHandlers(
        childValue as AnyHandler | undefined,
        slotValue as AnyHandler,
      );
    } else if (key === 'className') {
      merged[key] = clsx(slotValue as string | undefined, childValue as string | undefined);
    } else if (key === 'style') {
      merged[key] = { ...(slotValue as object | undefined), ...(childValue as object | undefined) };
    }
  }
  return merged;
}

/**
 * Renders its single child element with the slot's props merged in; this is how `asChild` works.
 * Child props win, except that class names are joined, styles are merged, and event handlers run
 * child-first (the slot's handler is skipped if the child's handler calls `preventDefault()`).
 */
export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, ...slotProps },
  forwardedRef,
) {
  if (Children.count(children) !== 1 || !isValidElement(children)) {
    devWarn('`asChild` expects exactly one React element as its child.');
    return null;
  }
  const child = children as ReactElement<AnyProps>;
  if (child.type === Fragment) {
    devWarn('`asChild` cannot merge props into a Fragment; pass a single element.');
    return null;
  }
  const childRef = getElementRef(child);
  return cloneElement(child, {
    ...mergeProps(slotProps as AnyProps, child.props),
    ref: forwardedRef ? mergeRefs<unknown>(forwardedRef as Ref<unknown>, childRef) : childRef,
  });
});
