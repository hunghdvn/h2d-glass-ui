import { useEffect, useRef } from 'react';
import { useWriteOnCommit } from './use-write-on-commit';
import { devWarn } from './warn';

export interface RequireNameOptions {
  /** Warn only while this is true, such as while a dialog is open. Default true. */
  active?: boolean;
  /**
   * Another way the part can get its name, and whether it has one that way: a title element that
   * registers in a ref, a `<label>` that points at an input. `given` is asked after the part has
   * mounted, so it may read the DOM; the function of the latest render is the one asked. It is asked
   * again when `active` or the name props change, and when `watch` does: a part whose other name
   * comes and goes with its state passes that state there (a Table's caption).
   */
  otherName?: { description: string; given: () => boolean; watch?: unknown };
}

/**
 * Warns in development when a part that needs an accessible name is left without one. A name is an
 * `aria-label` with text other than spaces, an `aria-labelledby` that is not empty, or the other way
 * the part says (`otherName`). The one place that decides what counts as a name, so the parts that
 * need one do not drift apart.
 */
export function useRequireName(
  props: { 'aria-label'?: string | undefined; 'aria-labelledby'?: string | undefined },
  part: string,
  { active = true, otherName }: RequireNameOptions = {},
): void {
  const named = Boolean(props['aria-label']?.trim()) || Boolean(props['aria-labelledby']?.trim());
  const description = otherName?.description;
  const watch = otherName?.watch;
  // Read through a ref, so that a new function on every render does not run the effect again.
  const given = useRef(otherName?.given);
  useWriteOnCommit(() => {
    given.current = otherName?.given;
  });
  useEffect(() => {
    if (!active || named || given.current?.()) return;
    devWarn(
      `<${part}> needs a name: ${description ? `${description}, or ` : ''}pass aria-label or ` +
        'aria-labelledby.',
    );
  }, [active, named, part, description, watch]);
}
