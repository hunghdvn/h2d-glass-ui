import { hasModifier } from './roving';
import type { Modifiers } from './roving';

/** The part of a click that says whether the browser follows a link in this tab. */
export interface ClickLike extends Modifiers {
  button: number;
  shiftKey: boolean;
  defaultPrevented: boolean;
}

/**
 * A click that the browser follows in this tab: the main button, with no key held (Ctrl, Cmd and
 * Shift open the link in another tab or window, Alt downloads it), and not cancelled by a handler,
 * which has taken the click for something of its own, such as a router's navigation. One rule for
 * every part that acts on a click of a link: Pagination changing the page, a Nav item closing the
 * sheet of an AppShell or the flyout it is in.
 */
export function isPlainClick(event: ClickLike): boolean {
  return !event.defaultPrevented && event.button === 0 && !event.shiftKey && !hasModifier(event);
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
