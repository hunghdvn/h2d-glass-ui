const TABBABLE = [
  'a[href]',
  'area[href]',
  // `:enabled` also leaves out the controls inside a disabled `<fieldset>`.
  'button:enabled',
  'input:enabled:not([type="hidden"])',
  'select:enabled',
  'textarea:enabled',
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
 * Tab stops at one radio of a group: the checked one, else the first that is enabled. A group is
 * the radios with the same `name` in the same form; a radio without a name is a group of its own.
 */
function isRadioTabStop(el: HTMLElement): boolean {
  if (!(el instanceof HTMLInputElement) || el.type !== 'radio') return true;
  if (el.checked || el.name === '') return true;
  const root = el.getRootNode() as ParentNode;
  const group = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter(
    (radio) => radio.name === el.name && radio.form === el.form,
  );
  return !group.some((radio) => radio.checked) && group.find((radio) => !radio.disabled) === el;
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
  return isTabbable(el) && !el.closest('[inert]') && isVisible(el) && isRadioTabStop(el);
}

/**
 * True when `target` is, or sits inside, an element that a click focuses in most browsers: a
 * control, a link, or an element with a `tabindex`. Safari leaves a clicked button unfocused.
 */
export function isInsideControl(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(TABBABLE) !== null;
}

/** Every element inside `root` that Tab reaches, in DOM order. */
export function getFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll(TABBABLE)).filter(isFocusable);
}

export interface FocusFirstOptions {
  /** What gets focus when `root` holds nothing focusable. Default: `root` itself. */
  fallback?: HTMLElement | undefined;
  /** Leave the scroll position alone. Default `true`; `false` scrolls the element into view. */
  preventScroll?: boolean | undefined;
}

/** Focuses the first focusable element inside `root`, or the fallback when there is none. */
export function focusFirst(
  root: HTMLElement,
  { fallback = root, preventScroll = true }: FocusFirstOptions = {},
): void {
  (getFocusables(root)[0] ?? fallback).focus({ preventScroll });
}

/**
 * Returns focus to `target`, or to `fallback` when `target` is missing or has left the document, but
 * only while focus is on `<body>`, nowhere, or inside `container`. Focus that the user moved
 * elsewhere, for example by clicking another control, stays where it is.
 */
export function returnFocus(
  target: HTMLElement | null | undefined,
  container: Element | null | undefined,
  fallback?: HTMLElement | null,
): void {
  const active = document.activeElement;
  if (active !== null && active !== document.body && !(container?.contains(active) ?? false)) {
    return;
  }
  const to = target?.isConnected ? target : fallback;
  if (to?.isConnected) to.focus({ preventScroll: true });
}
