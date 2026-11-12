import { useEffect, useRef } from 'react';
import { isEditable } from '../../internal/editable';
import { isApplePlatform } from '../../internal/platform';
import { hasModifier, isComposing } from '../../internal/roving';
import { useWriteOnCommit } from '../../internal/use-write-on-commit';

/** The keys a SearchField can take: the slash, or K with the modifier of the platform (⌘ or Ctrl). */
export type Shortcut = '/' | 'mod+k';

/**
 * Whether the key event is `shortcut` on this platform. The slash allows Shift, since some keyboards
 * type "/" with it, and no other modifier. `mod+k` is K with exactly the modifier of the platform
 * (Meta on Apple, Ctrl elsewhere): K with another one is another shortcut.
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut, apple: boolean): boolean {
  if (shortcut === '/') return event.key === '/' && !hasModifier(event);
  return (
    event.key.toLowerCase() === 'k' &&
    !event.shiftKey &&
    !event.altKey &&
    (apple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey)
  );
}

/** A field that asks for a shortcut, as its last commit left it. */
interface Claim {
  enabled: boolean;
  onMatch: () => boolean;
}

/**
 * The fields that ask for each shortcut, in the order they were mounted. Page-wide on purpose: one
 * key has one owner. When two fields ask for it the one mounted last takes it, and when it cannot
 * (it is turned off, or the focus does not reach it) the one before it, and so on (spec phase 5
 * §6.3). A field keeps its place while it is mounted; a new `shortcut` gives it a place at the end.
 */
const claims: Record<Shortcut, Array<{ current: Claim }>> = { '/': [], 'mod+k': [] };

/** The listener of each shortcut on the document, while some field asks for it. */
const listeners: Partial<Record<Shortcut, (event: KeyboardEvent) => void>> = {};

/**
 * Offers the key to the fields that ask for `shortcut`, from the one mounted last to the first, and
 * prevents it once one of them has taken it, so no "/" is typed and the browser's own `Ctrl K` is
 * not run. A key pressed where the user types (a search field included), one that something else
 * prevented and one that an input method owns are left alone.
 */
function offer(shortcut: Shortcut, event: KeyboardEvent): void {
  if (
    typeof event.key !== 'string' ||
    event.defaultPrevented ||
    isComposing({ nativeEvent: event }) ||
    !matchesShortcut(event, shortcut, isApplePlatform()) ||
    // `target` is the host of a shadow tree at the document; the path starts at the real target.
    isEditable(event.composedPath()[0] ?? event.target ?? undefined)
  ) {
    return;
  }
  // A copy: the walk goes over the fields that were there when the key went down.
  const holders = [...claims[shortcut]];
  for (let index = holders.length - 1; index >= 0; index -= 1) {
    const { enabled, onMatch } = holders[index]!.current;
    if (enabled && onMatch()) {
      event.preventDefault();
      return;
    }
  }
}

/**
 * Asks for `shortcut` on behalf of a field. `onMatch` is called for the key when it is the field's
 * turn (see `offer`), and returns whether the field took it. While `enabled` is false the field is
 * passed over, and keeps its place.
 */
export function useShortcut(
  shortcut: Shortcut | undefined,
  onMatch: () => boolean,
  enabled: boolean,
): void {
  // The claim of this field: the same object for as long as it is mounted, with what the last
  // commit says in it, so that turning the field off and on does not move it.
  const claim = useRef<Claim>({ enabled, onMatch });
  useWriteOnCommit(() => {
    claim.current = { enabled, onMatch };
  });
  useEffect(() => {
    if (shortcut === undefined) return;
    const holders = claims[shortcut];
    holders.push(claim);
    if (holders.length === 1) {
      const listener = (event: KeyboardEvent) => offer(shortcut, event);
      listeners[shortcut] = listener;
      document.addEventListener('keydown', listener);
    }
    return () => {
      // Released exactly as taken: `splice(-1, 1)` would drop the last holder, another field's claim.
      const index = holders.indexOf(claim);
      if (index !== -1) holders.splice(index, 1);
      const listener = listeners[shortcut];
      if (holders.length === 0 && listener) {
        document.removeEventListener('keydown', listener);
        delete listeners[shortcut];
      }
    };
  }, [shortcut]);
}
