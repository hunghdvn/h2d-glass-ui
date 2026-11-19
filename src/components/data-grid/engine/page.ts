import type { DataGridPage } from '../types';
import type { FlatRow } from './flatten';

// A size that is not a number above 0 means one page of everything: the grid never throws on it.
function wholeSize(size: number): number {
  return Number.isFinite(size) && size >= 1 ? Math.floor(size) : Infinity;
}

/** The number of pages: at least 1, so an empty grid still has a page to be on. */
export function pageCount(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / wholeSize(size)));
}

/** The index as a whole number inside `0 … pageCount - 1`; 0 when it is not a number. */
export function clampPageIndex(index: number, total: number, size: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), pageCount(total, size) - 1);
}

/** The rows of the page, cut from the whole flat list; a page out of range is the nearest one. */
export function pageRows<TRow>(
  flat: readonly FlatRow<TRow>[],
  page: DataGridPage,
): FlatRow<TRow>[] {
  const size = wholeSize(page.size);
  if (size === Infinity) return flat.slice();
  const start = clampPageIndex(page.index, flat.length, size) * size;
  return flat.slice(start, start + size);
}
