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
 *
 * A form control (an `<input>`, a `<select>`) is reset with its own `.form`, which follows its
 * `form` attribute natively and in its own tree, whether or not `form` is passed. `form` is the id
 * the control was given in that attribute; passing it only makes the effect run again when it
 * changes. An element that is not a form control (the `<div>` of a Slider or of a
 * SegmentedControl) has no `.form`, so with an id the form is the element of that id in the root
 * the element is in (a document or a shadow root) when it is a `<form>`, and none otherwise.
 * Without an id it is the one around the element.
 */
export function useFormReset(
  elementRef: RefObject<HTMLElement | null>,
  onReset: () => void,
  form?: string,
): void {
  const latest = useRef(onReset);
  useWriteOnCommit(() => {
    latest.current = onReset;
  });
  useEffect(() => {
    const element = elementRef.current as (HTMLElement & { form?: HTMLFormElement | null }) | null;
    // A form control knows its form, even through the `form` attribute, looked up in its own tree
    // (a shadow root has its own ids), and has none when that names an id that does not exist.
    // Any other element is looked up in the tree: an id given here is the caller's `form`
    // attribute for an element that cannot carry one, found in the root the element is in.
    let target: HTMLFormElement | null | undefined;
    if (element && 'form' in element) {
      target = element.form;
    } else if (form !== undefined) {
      const root = element?.getRootNode();
      const scope = root && 'getElementById' in root ? (root as Document | ShadowRoot) : undefined;
      const named = (scope ?? element?.ownerDocument)?.getElementById(form);
      // Not `instanceof`: an element of an iframe is of the constructors of that window.
      target = named?.localName === 'form' ? (named as HTMLFormElement) : null;
    } else {
      target = element?.closest('form');
    }
    if (!target) return;
    const pending = new Set<ReturnType<typeof setTimeout>>();
    const onFormReset = (event: Event) => {
      const timer = setTimeout(() => {
        pending.delete(timer);
        if (!event.defaultPrevented) latest.current();
      }, 0);
      pending.add(timer);
    };
    target.addEventListener('reset', onFormReset);
    return () => {
      target.removeEventListener('reset', onFormReset);
      // A reset that is still waiting must not reach a component that is gone.
      pending.forEach(clearTimeout);
    };
  }, [elementRef, form]);
}
