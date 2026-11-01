import { useCallback, useRef, useState } from 'react';
import { useIsoLayoutEffect } from './use-iso-layout-effect';
import { useWriteOnCommit } from './use-write-on-commit';
import { devWarn } from './warn';

export interface ControllableStateOptions<T> {
  /** The controlled value. `undefined` means uncontrolled. */
  value: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
  /** Names the component in the dev warning, for example `"Dialog"`. */
  name: string;
}

/**
 * State that a parent may own (`value`) or leave to the component (`defaultValue`). The setter calls
 * `onChange` whenever the value changes, and stores the value itself only when uncontrolled. The third
 * item, `reset`, sets an uncontrolled value without calling `onChange`.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  name,
}: ControllableStateOptions<T>): [T, (next: T) => void, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  // The mode of the last commit. A render that React throws away must neither warn nor change it.
  const wasControlled = useRef(controlled);
  useIsoLayoutEffect(() => {
    if (wasControlled.current === controlled) return;
    devWarn(
      `${name} is changing from ${wasControlled.current ? 'controlled' : 'uncontrolled'} to ` +
        `${controlled ? 'controlled' : 'uncontrolled'}. Pick one for the lifetime of the component.`,
    );
    wasControlled.current = controlled;
  });
  const current = controlled ? value : internal;

  // The values of the last commit, read by a setter whose identity never changes. Written when the
  // commit starts, not during a render that React may throw away, and so before any layout effect of
  // that commit fires an event (a `focus()`) that reads it.
  const latest = useRef({ current, controlled, onChange });
  useWriteOnCommit(() => {
    latest.current = { current, controlled, onChange };
  });

  const setValue = useCallback((next: T) => {
    const { current: before, controlled: isControlled, onChange: notify } = latest.current;
    if (Object.is(before, next)) return;
    // Uncontrolled: remember the value now, so a second identical set before the re-render is
    // not reported twice. Controlled: the parent may reject it, so every request is reported.
    if (!isControlled) {
      setInternal(next);
      latest.current = { ...latest.current, current: next };
    }
    notify?.(next);
  }, []);

  // Puts an uncontrolled value back without reporting it, as a form reset does for a native control
  // (no change event). A controlled value is the parent's: left alone.
  const reset = useCallback((next: T) => {
    if (latest.current.controlled) return;
    setInternal(next);
    latest.current = { ...latest.current, current: next };
  }, []);

  return [current, setValue, reset];
}
