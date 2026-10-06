const FORM_CONTROLS = ['button', 'input:not([type="hidden"])', 'select', 'textarea'];
const OTHER_TABBABLES = [
  'a[href]',
  'area[href]',
  'iframe',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
];

/** What Tab can stop at now. `:enabled` also leaves out the controls of a disabled `<fieldset>`. */
const TABBABLE = [...FORM_CONTROLS.map((s) => `${s}:enabled`), ...OTHER_TABBABLES].join(', ');

/**
 * The kinds of element that Tab stops at. A control's own `disabled` attribute rules it out; a
 * disabled `<fieldset>` around it is only how things stand at the moment, like `hidden` or `inert`.
 */
const TABBABLE_KIND = [
  ...FORM_CONTROLS.map((s) => `${s}:not([disabled])`),
  ...OTHER_TABBABLES,
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
 * True when the element is a kind that Tab stops at: a control without the `disabled` attribute, a
 * link, or an element with a `tabindex` of 0 or more. At the moment it may still be hidden, inert,
 * or inside a disabled `<fieldset>`.
 */
export function isTabbableKind(el: Element): el is HTMLElement {
  return el instanceof HTMLElement && el.matches(TABBABLE_KIND) && el.tabIndex >= 0;
}

/** True when the element can receive keyboard focus with Tab now. */
export function isFocusable(el: Element): el is HTMLElement {
  return (
    el instanceof HTMLElement &&
    el.matches(TABBABLE) &&
    el.tabIndex >= 0 &&
    !el.closest('[inert]') &&
    isVisible(el) &&
    isRadioTabStop(el)
  );
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

/** Where each popover sends focus when it closes; usePopover registers its element here. */
const popoverReturns = new WeakMap<Element, () => HTMLElement | null | undefined>();

/**
 * Records where focus goes when `popover` closes, so that an element hidden inside it can stand for
 * that place. Returns the function that removes the record.
 */
export function registerPopoverReturn(
  popover: Element,
  getTarget: () => HTMLElement | null | undefined,
): () => void {
  popoverReturns.set(popover, getTarget);
  return () => {
    if (popoverReturns.get(popover) === getTarget) popoverReturns.delete(popover);
  };
}

/** The innermost closed popover that is `el` or holds it, if any. */
function closedPopoverAround(el: Element): Element | null {
  for (let p = el.closest('[popover]'); p; p = p.parentElement?.closest('[popover]') ?? null) {
    if (!p.matches(':popover-open')) return p;
  }
  return null;
}

/**
 * An element inside a closed popover cannot take focus: it stands for where that popover returns
 * focus, and so on outwards (a submenu item, then the submenu's trigger in the closed menu, then the
 * menu's trigger). The element itself when it is not hidden that way, or when no popover resolves it.
 */
function resolveHidden(target: HTMLElement): HTMLElement {
  let to = target;
  // A bound, in case two popovers send focus to each other.
  for (let depth = 0; depth < 16; depth += 1) {
    const popover = closedPopoverAround(to);
    if (!popover) return to;
    const next = popoverReturns.get(popover)?.();
    if (!next?.isConnected || next === to) return target;
    to = next;
  }
  return target;
}

/**
 * Returns focus to `target`, or to `fallback` when `target` is missing or has left the document, but
 * only while focus is on `<body>`, nowhere, or inside `container`. Focus that the user moved
 * elsewhere, for example by clicking another control, stays where it is. A target hidden inside a
 * closed popover, such as the menu item that opened a dialog, hands focus on to where that popover
 * returns it.
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
  const to = target?.isConnected ? resolveHidden(target) : fallback;
  if (to?.isConnected) to.focus({ preventScroll: true });
}
