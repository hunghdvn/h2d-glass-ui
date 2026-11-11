import { hasModifier } from './roving';
import type { Modifiers } from './roving';

/** The part of a click that says whether the browser follows a link in this tab. */
export interface ClickLike extends Modifiers {
  button: number;
  shiftKey: boolean;
  defaultPrevented: boolean;
  /** The element whose handler hears the click: the link, whose `target` and `download` count. */
  currentTarget: EventTarget | null;
}

/**
 * Whether the link sends its page out of this tab: a `target` other than `_self` (a new tab, a named
 * window, the frame's parent), which is what the routers check too, or `download`, which saves it.
 * An empty `target` is this tab, as none is; the keywords are read in any case, as HTML does.
 */
function leavesThisTab(link: EventTarget | null): boolean {
  if (!(link instanceof Element)) return false;
  const target = link.getAttribute('target');
  const elsewhere = target !== null && target !== '' && target.toLowerCase() !== '_self';
  return elsewhere || link.hasAttribute('download');
}

/**
 * A click that the browser follows in this tab: the main button, with no key held (Ctrl, Cmd and
 * Shift open the link in another tab or window, Alt downloads it), on a link that opens its page here
 * (no `target` other than `_self`, no `download`), and not cancelled by a handler, which has taken
 * the click for something of its own, such as a router's navigation. One rule for every part that
 * acts on a click of a link: Pagination changing the page, a Nav item closing the sheet of an
 * AppShell or the flyout it is in.
 */
export function isPlainClick(event: ClickLike): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.shiftKey &&
    !hasModifier(event) &&
    !leavesThisTab(event.currentTarget)
  );
}

/**
 * Stops an activation that must not happen, for a control that keeps its focus and its place but
 * does nothing (a disabled link, a busy Button). Used in the capture phase, so that neither the
 * element's own `onClick` or `onAuxClick` (a middle click) nor one of a child's fires, and
 * `preventDefault()` also stops a link's navigation and a form's submission.
 */
export function blockActivation(event: { preventDefault(): void; stopPropagation(): void }): void {
  event.preventDefault();
  event.stopPropagation();
}
