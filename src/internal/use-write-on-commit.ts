import { useInsertionEffect } from 'react';

/**
 * Runs `write` once per commit, to store what the commit shows in a ref that handlers read. It is
 * for writing refs and nothing else: it must not read the DOM, set state or start work.
 *
 * It runs before every layout effect of the commit, so a handler that an earlier layout effect
 * fires on the spot (`focus()` in a child's effect, a sibling's, a parent's) already finds the
 * values of this commit. A layout effect would run in the order of the components, and too late
 * for those. Like a layout effect it does not run for a render that React throws away, which is
 * why a ref is not written during render. On the server it does not run at all.
 */
export function useWriteOnCommit(write: () => void): void {
  useInsertionEffect(write);
}
