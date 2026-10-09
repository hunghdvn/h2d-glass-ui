export type Orientation = 'vertical' | 'horizontal';

export interface RovingOptions {
  orientation: Orientation;
  /** Wrap from the last item to the first and back. */
  loop: boolean;
}

/** What a navigation key asks for. */
type Move = 'next' | 'previous' | 'first' | 'last';

const KEYS: Record<Orientation, Record<string, Move>> = {
  vertical: { ArrowDown: 'next', ArrowUp: 'previous', Home: 'first', End: 'last' },
  horizontal: { ArrowRight: 'next', ArrowLeft: 'previous', Home: 'first', End: 'last' },
};

/**
 * The index a navigation key moves to, skipping disabled items. `current` is -1 when no item has
 * focus: then the next item is the first and the previous one the last. Returns null for a key that
 * does not navigate, or when every item is disabled. Without `loop`, the ends stay where they are.
 */
export function getNextIndex(
  items: readonly { disabled?: boolean | undefined }[],
  current: number,
  key: string,
  { orientation, loop }: RovingOptions,
): number | null {
  const move = KEYS[orientation][key];
  if (!move) return null;
  const enabled = items.flatMap((item, index) => (item.disabled ? [] : [index]));
  if (enabled.length === 0) return null;
  const first = enabled[0] as number;
  const last = enabled[enabled.length - 1] as number;
  if (move === 'first') return first;
  if (move === 'last') return last;
  if (current < 0) return move === 'next' ? first : last;
  if (move === 'next') {
    const after = enabled.find((index) => index > current);
    return after ?? (loop ? first : current);
  }
  const before = enabled.filter((index) => index < current).pop();
  return before ?? (loop ? last : current);
}

/** The modifier keys of a key event; all optional, so a plain `{ key }` object works as well. */
export interface Modifiers {
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

/**
 * True when Alt, Ctrl or Meta is held: Alt+←, Ctrl+Home and the like belong to the browser or the
 * system, not to the list. Shift is not counted; it means nothing to these keys here.
 */
export function hasModifier(event: Modifiers): boolean {
  return event.altKey === true || event.ctrlKey === true || event.metaKey === true;
}

/** True for an item the user cannot act on: native `disabled` or `aria-disabled="true"`. */
export function isDisabledItem(el: Element): boolean {
  return el.getAttribute('aria-disabled') === 'true' || el.matches(':disabled');
}

/**
 * Moves focus among `items` for a navigation key and reports whether it did. A key held with Alt,
 * Ctrl or Meta is left alone. It moves from `from`, by default the focused element. The caller
 * decides what the items are; Tab order (`tabIndex`) is the caller's business too.
 */
export function focusNext(
  event: Modifiers & { key: string; preventDefault(): void },
  items: readonly HTMLElement[],
  options: RovingOptions,
  from: Element | null = document.activeElement,
): boolean {
  if (hasModifier(event)) return false;
  const current = items.indexOf(from as HTMLElement);
  const next = getNextIndex(
    items.map((el) => ({ disabled: isDisabledItem(el) })),
    current,
    event.key,
    options,
  );
  if (next === null) return false;
  event.preventDefault();
  items[next]?.focus();
  return true;
}
