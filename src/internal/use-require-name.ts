import { useEffect } from 'react';
import type { RefObject } from 'react';
import { devWarn } from './warn';

export interface RequireNameOptions {
  /** Warn only while this is true, such as while a dialog is open. Default true. */
  active?: boolean;
  /** Another way the part can get its name, such as a title element that registers in this ref. */
  otherName?: { description: string; ref: RefObject<unknown> };
}

/**
 * Warns in development when a part that has the role of a dialog or a menu is left without an
 * accessible name: neither `aria-label` nor `aria-labelledby` is given. The one place that decides
 * what counts as a name, so the parts that need one do not drift apart.
 */
export function useRequireName(
  props: { 'aria-label'?: string | undefined; 'aria-labelledby'?: string | undefined },
  part: string,
  { active = true, otherName }: RequireNameOptions = {},
): void {
  const named = props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined;
  const description = otherName?.description;
  const ref = otherName?.ref;
  useEffect(() => {
    if (!active || named || (ref && ref.current !== undefined)) return;
    devWarn(
      `<${part}> needs a name: ${description ? `${description}, or ` : ''}pass aria-label or ` +
        'aria-labelledby.',
    );
  }, [active, named, part, description, ref]);
}
