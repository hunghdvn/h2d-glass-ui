import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useWriteOnCommit } from './use-write-on-commit';

/**
 * Calls `onReset` after the form that holds `elementRef` is reset (the element may be a form control
 * or any element inside the form), unless the reset was cancelled.
 * A component uses it to put an uncontrolled value back to its default and to bring a native
 * element, which the browser has just reset behind React's back, in step with its state again.
 *
 * The listener of the library runs before React's `onReset`, so whether the reset was cancelled with
 * `preventDefault()` is only known a task later; the hook waits that task. It reads `onReset` at
 * that moment, so the caller does not have to keep it stable.
 */
export function useFormReset(elementRef: RefObject<HTMLElement | null>, onReset: () => void): void {
  const latest = useRef(onReset);
  useWriteOnCommit(() => {
    latest.current = onReset;
  });
  useEffect(() => {
    const element = elementRef.current as (HTMLElement & { form?: HTMLFormElement | null }) | null;
    // A form control knows its form, even through the `form` attribute; any other element is
    // looked up in the tree.
    const form = element?.form ?? element?.closest('form');
    if (!form) return;
    const pending = new Set<ReturnType<typeof setTimeout>>();
    const onFormReset = (event: Event) => {
      const timer = setTimeout(() => {
        pending.delete(timer);
        if (!event.defaultPrevented) latest.current();
      }, 0);
      pending.add(timer);
    };
    form.addEventListener('reset', onFormReset);
    return () => {
      form.removeEventListener('reset', onFormReset);
      // A reset that is still waiting must not reach a component that is gone.
      pending.forEach(clearTimeout);
    };
  }, [elementRef]);
}
