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

/**
 * What Tab can stop at now. `:enabled` also leaves out the controls of a disabled `<fieldset>`. Not
 * the list of what takes its own press (`CONTROL_SELECTOR` in controls.ts, which a drag handle or a
 * field's frame leaves alone): a label, a roving item or anything in a popover takes its own press
 * without being a tab stop.
 */
const TABBABLE = [...FORM_CONTROLS.map((s) => `${s}:enabled`), ...OTHER_TABBABLES].join(', ');

/**
 * The kinds of element that Tab stops at. A control's own `disabled` attribute rules it out; a
 * disabled `<fieldset>` around it is only how things stand at the moment, like `hidden` or `inert`.
 */
const TABBABLE_KIND = [
  ...FORM_CONTROLS.map((s) => `${s}:not([disabled])`),
  ...OTHER_TABBABLES,
].join(', ');

/**
 * The kinds that are controls whatever their `tabindex`: the ones of `TABBABLE_KIND` less the bare `[tabindex]`, which
 * makes a stop of any element and says nothing of what it is.
 */
const CONTROL_KIND = [
  ...FORM_CONTROLS.map((s) => `${s}:not([disabled])`),
  ...OTHER_TABBABLES.filter((s) => s !== '[tabindex]'),
].join(', ');

/**
 * True when the element is rendered: neither it nor an ancestor is `display: none` (or
 * `content-visibility: hidden`). Where `checkVisibility` is missing, an element with no box is taken
 * as not rendered.
 */
export function isVisible(el: Element): boolean {
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

/**
 * True when the element is a kind of element that keyboard users can focus: a control (a form control
 * without the `disabled` attribute, a link with an `href`, an editable element …) whatever its `tabindex`,
 * because a container that keeps one Tab stop for itself (a grid, a toolbar) sets `-1` on its controls
 * and reaches them with its own keys; any other element only with a `tabindex` of 0 or more, since a
 * `<span tabindex="-1">` is reached by nobody.
 */
export function isFocusableKind(el: Element): el is HTMLElement {
  return (
    el instanceof HTMLElement &&
    (el.matches(CONTROL_KIND) || (el.matches('[tabindex]') && el.tabIndex >= 0))
  );
}

/**
 * The controls whose `tabindex` is negative only because a container that keeps one Tab stop for
 * itself (a grid) set it so: they are out of the Tab order, and are still controls of the place they
 * are in, which the container's own keys go through. Kept here and not passed around, so the next
 * such container marks its own the same way. Weak: a control that leaves the page is not held. Not
 * an attribute, which would write more to the caller's elements than the `tabindex` it must.
 */
const releasedControls = new WeakSet<Element>();

/** Marks `el` as released: its container has set its `tabindex` to -1 to keep its one Tab stop. */
export function releaseControl(el: Element): void {
  releasedControls.add(el);
}

/** Takes the mark off `el`: its container gave its `tabindex` back, or let go of it. */
export function giveBackControl(el: Element): void {
  releasedControls.delete(el);
}

/** Whether `el` is a control that a container took out of the Tab order (`releaseControl`). */
export function isReleased(el: Element): boolean {
  return releasedControls.has(el);
}

export interface FocusableOptions {
  /**
   * Count the controls a container released as they would be without it: their `tabindex` is not
   * read. For the container's own way through its controls. Left out, the Tab order as it is.
   */
  released?: boolean | undefined;
}

/**
 * True when the element can receive keyboard focus with Tab now; with `released`, also when its
 * `tabindex` is negative only because a container released it (`releaseControl`).
 */
export function isFocusable(
  el: Element,
  { released = false }: FocusableOptions = {},
): el is HTMLElement {
  return (
    el instanceof HTMLElement &&
    el.matches(TABBABLE) &&
    (el.tabIndex >= 0 || (released && isReleased(el) && !el.matches(':disabled'))) &&
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

/** Every element inside `root` that Tab reaches, in DOM order (`released`: see `isFocusable`). */
export function getFocusables(root: HTMLElement, options?: FocusableOptions): HTMLElement[] {
  return Array.from(root.querySelectorAll(TABBABLE)).filter((el): el is HTMLElement =>
    isFocusable(el, options),
  );
}

/**
 * Every element inside `root` of a kind that Tab stops at and that is in the Tab order, shown or
 * not: what a container that keeps one Tab stop for itself takes its controls' `tabindex` from.
 */
export function getTabbableKinds(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll(TABBABLE_KIND)).filter(isTabbableKind);
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
 * Focuses `target`. An element inside a closed popover cannot take focus: then it stands for where
 * that popover returns focus, and so on outwards (a submenu item, then the submenu's trigger in the
 * closed menu, then the menu's trigger). Whether it took focus decides, not whether the popover
 * shows: jsdom, where no popover shows, focuses the element itself. When no popover resolves it,
 * focus stays where it is.
 */
function focusOrHandOn(target: HTMLElement): void {
  let to = target;
  // A bound, in case two popovers send focus to each other.
  for (let depth = 0; depth < 16; depth += 1) {
    to.focus({ preventScroll: true });
    if (document.activeElement === to) return;
    const popover = closedPopoverAround(to);
    if (!popover) return;
    const next = popoverReturns.get(popover)?.();
    if (!next?.isConnected || next === to) return;
    to = next;
  }
}

/**
 * Returns focus to `target`, or to `fallback` when `target` is missing or has left the document, but
 * only while focus is on `<body>`, nowhere, or inside `container`. Focus that the user moved
 * elsewhere, for example by clicking another control, stays where it is. Either one, when hidden
 * inside a closed popover, such as the menu item that opened a dialog, hands focus on to where that
 * popover returns it.
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
  if (to?.isConnected) focusOrHandOn(to);
}
