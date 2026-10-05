const TABBABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(', ');

function isVisible(el: HTMLElement): boolean {
  return typeof el.checkVisibility === 'function'
    ? el.checkVisibility()
    : el.getClientRects().length > 0;
}

/**
 * True when the element is one that Tab stops at: a control, a link, or an element with a
 * `tabindex` of 0 or more. It may still be hidden or inert at the moment.
 */
export function isTabbable(el: Element): el is HTMLElement {
  return el instanceof HTMLElement && el.matches(TABBABLE) && el.tabIndex >= 0;
}

/** True when the element can receive keyboard focus with Tab now. */
export function isFocusable(el: Element): el is HTMLElement {
  return isTabbable(el) && !el.closest('[inert]') && isVisible(el);
}

/** Every element inside `root` that Tab reaches, in DOM order. */
export function getFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll(TABBABLE)).filter(isFocusable);
}

/** Focuses the first focusable element inside `root`, or `fallback` when there is none. */
export function focusFirst(root: HTMLElement, fallback: HTMLElement = root): void {
  (getFocusables(root)[0] ?? fallback).focus({ preventScroll: true });
}
