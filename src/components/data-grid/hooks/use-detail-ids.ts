import { useCallback, useId } from 'react';
import type { DataGridKey } from '../types';

/**
 * The id of the detail row of a row key, for the `aria-controls` of its button: the grid's `useId`, the
 * type of the key and the key written for a URL, so a key that holds spaces, quotes or anything else an
 * id list cannot hold is still one token, and the number `1` and the text `'1'` are two ids. Pure: the
 * same key gives the same id in every render, on the server and in the browser, in any order of the
 * list, so opening, closing or sorting changes no id and draws no row.
 */
export function detailIdOf(base: string, key: DataGridKey): string {
  return `${base}-detail-${typeof key}-${encodeURIComponent(String(key))}`;
}

/** `detailIdOf` with the grid's own base: the same function for as long as the grid lives. */
export function useDetailIds(): (key: DataGridKey) => string {
  const base = useId();
  return useCallback((key) => detailIdOf(base, key), [base]);
}
