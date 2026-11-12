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

/**
 * The fields that hold each shortcut, in the order they were mounted. Page-wide on purpose: one key
 * has one owner, and when two fields ask for it the one mounted last takes it (spec phase 5 §6.3).
 */
const claims: Record<Shortcut, object[]> = { '/': [], 'mod+k': [] };

/**
 * Listens on the document for `shortcut` while `enabled`. `onMatch` is called for the key when this is
 * the field that holds it, and returns whether it took the key: then the key is prevented, so no "/"
 * is typed and the browser's own `Ctrl K` is not run. A key pressed where the user types (this field
 * included), one that something else prevented and one that an input method owns are left alone.
 */
export function useShortcut(
  shortcut: Shortcut | undefined,
  onMatch: () => boolean,
  enabled: boolean,
): void {
  const latest = useRef(onMatch);
  useWriteOnCommit(() => {
    latest.current = onMatch;
  });
  useEffect(() => {
    if (shortcut === undefined || !enabled) return;
    const self = {};
    const holders = claims[shortcut];
    holders.push(self);
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        typeof event.key !== 'string' ||
        event.defaultPrevented ||
        isComposing({ nativeEvent: event }) ||
        holders[holders.length - 1] !== self ||
        !matchesShortcut(event, shortcut, isApplePlatform()) ||
        // `target` is the host of a shadow tree at the document; the path starts at the real target.
        isEditable(event.composedPath()[0] ?? event.target ?? undefined)
      ) {
        return;
      }
      if (latest.current()) event.preventDefault();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Released exactly as taken: `splice(-1, 1)` would drop the last holder, another field's claim.
      const index = holders.indexOf(self);
      if (index !== -1) holders.splice(index, 1);
    };
  }, [shortcut, enabled]);
}
