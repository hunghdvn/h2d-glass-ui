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

/** True for an item the user cannot act on: native `disabled` or `aria-disabled="true"`. */
export function isDisabledItem(el: Element): boolean {
  return el.getAttribute('aria-disabled') === 'true' || el.matches(':disabled');
}

/**
 * Moves focus among `items` for a navigation key and reports whether it did. The caller decides
 * what the items are; Tab order (`tabIndex`) is the caller's business too.
 */
export function focusNext(
  event: { key: string; preventDefault(): void },
  items: readonly HTMLElement[],
  options: RovingOptions,
): boolean {
  const current = items.indexOf(document.activeElement as HTMLElement);
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
