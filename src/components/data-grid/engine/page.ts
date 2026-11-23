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

// The rows a page counts: data rows and group rows. A detail row belongs to its master, and the repeat
// of a group at the top of a page (`continued`) to the group it repeats.
function isCounted<TRow>(row: FlatRow<TRow>): boolean {
  return row.kind === 'data' || (row.kind === 'group' && !row.continued);
}

/** The number of rows the pager counts in a list: its data rows and its group rows. */
export function countRows<TRow>(flat: readonly FlatRow<TRow>[]): number {
  let count = 0;
  for (const row of flat) if (isCounted(row)) count++;
  return count;
}

/**
 * The rows of the page, cut from the whole flat list by the rows it counts (`countRows`); a page out
 * of range is the nearest one. A detail row stays with its master, so a page may show `size` counted
 * rows and their details. A page that starts inside a group, on a row or on a group row of a deeper
 * level, starts with the groups it is inside, outermost first, as new rows marked `continued`: the
 * same groups, with the same order and place, so a reader of the page knows where it is.
 */
export function pageRows<TRow>(
  flat: readonly FlatRow<TRow>[],
  page: DataGridPage,
): FlatRow<TRow>[] {
  const size = wholeSize(page.size);
  if (size === Infinity) return flat.slice();
  const first = clampPageIndex(page.index, countRows(flat), size) * size;
  let counted = 0;
  let from = -1;
  let to = flat.length;
  for (let at = 0; at < flat.length; at++) {
    if (!isCounted(flat[at]!)) continue;
    if (counted === first) from = at;
    if (counted === first + size) {
      to = at;
      break;
    }
    counted++;
  }
  if (from < 0) return [];

  const head = flat[from]!;
  const above: FlatRow<TRow>[] = [];
  // The groups above the first row are the nearest ones of each level before it.
  let wanted = head.level - 1;
  for (let at = from - 1; at >= 0 && wanted > 0; at--) {
    const row = flat[at]!;
    if (row.kind === 'group' && row.level === wanted) {
      above.unshift({ ...row, continued: true });
      wanted--;
    }
  }
  return [...above, ...flat.slice(from, to)];
}

/**
 * The page of the row a place falls back to when a group closes under it, or `null` when the place is
 * not inside what closes. `closing` is the key of the group that closes, or `null` when every group
 * does (the nearest group left is then the outermost one the place is in). A place inside a group is
 * on a data row of it, on its group row, or on a row of a group deeper in it. The row it goes to is
 * that group's own row, found in the whole list: closing a group changes no row before it, so its page
 * is the one it has now, and it may not be the page the place is on (the place was on the group's
 * "(continued)" row, or on one of its rows).
 */
export function fallbackPage<TRow>(
  flat: readonly FlatRow<TRow>[],
  place: { kind: FlatRow<TRow>['kind']; key: string | number; groups: readonly string[] },
  closing: string | null,
  size: number,
): number | null {
  const inside = place.kind === 'group' ? [...place.groups, String(place.key)] : place.groups;
  const target = closing === null ? inside[0] : inside.find((key) => key === closing);
  if (target === undefined) return null;
  const at = flat.findIndex((row) => row.kind === 'group' && row.key === target);
  if (at < 0) return null;
  return clampPageIndex(
    Math.floor(countRows(flat.slice(0, at)) / wholeSize(size)),
    countRows(flat),
    size,
  );
}
