import { useCallback, useEffect, useRef } from 'react';
import { isDisabledItem } from './roving';

/** How long a pause ends the typed search, in ms. */
export const TYPEAHEAD_TIMEOUT = 500;

/**
 * The index of the item that a typed search lands on, or -1. Case is ignored. Typing the same
 * letter again moves on to the next item that starts with it, so "b", "b" cycles through every "b"
 * item; any other search starts after the current item too, and wraps around.
 */
export function findTypeaheadMatch(
  texts: readonly string[],
  current: number,
  search: string,
): number {
  const query = search.toLowerCase();
  const repeated = query.length > 1 && [...query].every((char) => char === query[0]);
  const needle = repeated ? (query[0] ?? '') : query;
  const count = texts.length;
  // A single letter looks past the current item; a longer search may match it again.
  const start = needle.length === 1 ? current + 1 : Math.max(current, 0);
  for (let step = 0; step < count; step += 1) {
    const index = (start + step) % count;
    if (texts[index]?.toLowerCase().startsWith(needle)) return index;
  }
  return -1;
}

/** The text a typed search matches: `data-text-value` when set, else the visible text. */
export function itemText(el: HTMLElement): string {
  return (el.dataset.textValue ?? el.textContent ?? '').trim();
}

/**
 * Typing jumps to the item whose text starts with what was typed in the last 500ms. Returns a
 * keydown handler that reports whether it used the key. Space counts as a character only inside a
 * search, so a lone Space still activates the item.
 */
export function useTypeahead(
  getItems: () => HTMLElement[],
  onMatch: (el: HTMLElement) => void,
): (event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  preventDefault(): void;
}) => boolean {
  const search = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return useCallback(
    (event) => {
      const { key } = event;
      if (key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return false;
      if (key === ' ' && search.current === '') return false;
      event.preventDefault();
      clearTimeout(timer.current);
      search.current += key;
      timer.current = setTimeout(() => {
        search.current = '';
      }, TYPEAHEAD_TIMEOUT);
      const items = getItems().filter((el) => !isDisabledItem(el));
      const current = items.indexOf(document.activeElement as HTMLElement);
      const match = findTypeaheadMatch(items.map(itemText), current, search.current);
      const el = match >= 0 ? items[match] : undefined;
      if (el) onMatch(el);
      return true;
    },
    [getItems, onMatch],
  );
}
