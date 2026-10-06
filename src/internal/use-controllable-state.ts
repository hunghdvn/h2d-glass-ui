import { useCallback, useRef, useState } from 'react';
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
 * `onChange` whenever the value changes, and stores the value itself only when uncontrolled.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  name,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const wasControlled = useRef(controlled);
  if (wasControlled.current !== controlled) {
    devWarn(
      `${name} is changing from ${wasControlled.current ? 'controlled' : 'uncontrolled'} to ` +
        `${controlled ? 'controlled' : 'uncontrolled'}. Pick one for the lifetime of the component.`,
    );
    wasControlled.current = controlled;
  }
  const current = controlled ? value : internal;

  // The latest values, read by a setter whose identity never changes.
  const latest = useRef({ current, controlled, onChange });
  latest.current = { current, controlled, onChange };

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

  return [current, setValue];
}
