/**
 * An open popover that Esc closes: the browser closes an auto (or hint) popover as the default action
 * of the key, so the key is that popover's, and the same popovers close on a press outside them
 * (light dismiss). A manual popover stays open on both, so it must not take the key or the press
 * from what is under it. The Tooltip and the sheet of the AppShell share this one rule.
 */
export const OPEN_POPOVER_CLOSES_ON_ESC = '[popover]:not([popover="manual"]):popover-open';

/**
 * True when `root` holds an open popover that Esc or a press outside closes. `:popover-open` is a
 * selector that older engines do not know; they throw on it, and have no popover to be open either.
 */
export function hasOpenPopover(root: ParentNode): boolean {
  try {
    return root.querySelector(OPEN_POPOVER_CLOSES_ON_ESC) !== null;
  } catch {
    return false;
  }
}
