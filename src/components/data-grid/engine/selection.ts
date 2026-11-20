import type { DataGridKey } from '../types';

// What the grid does with the keys of the chosen rows (spec phase 6 §6.3, "Chọn dòng"). The keys
// are kept as an array in the order they were chosen, because that is what an app saves (JSON has no
// set); every function here gives a new array and never changes the one it was given.

/**
 * Whether two lists hold the same items in the same order, each by `Object.is`: the one ordered
 * comparison of the grid, for the keys of the chosen rows and every list it keeps by value.
 */
export function sameList<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((item, index) => Object.is(item, b[index]));
}

/** Whether two lists hold the same keys in the same order. A number is not the text of it. */
export const sameKeys: (a: readonly DataGridKey[], b: readonly DataGridKey[]) => boolean = sameList;

/** The keys of `current` and then those of `add` that are not in it, once each. */
export function addKeys(
  current: readonly DataGridKey[],
  add: readonly DataGridKey[],
): DataGridKey[] {
  const seen = new Set(current);
  const next = [...current];
  for (const key of add) {
    if (!seen.has(key)) {
      seen.add(key);
      next.push(key);
    }
  }
  return next;
}

/** The keys of `current` that are not in `remove`, in their order. */
export function removeKeys(
  current: readonly DataGridKey[],
  remove: readonly DataGridKey[],
): DataGridKey[] {
  const gone = new Set(remove);
  return current.filter((key) => !gone.has(key));
}

/** `current` without `key` when it has it, else with `key` last. */
export function toggleKey(current: readonly DataGridKey[], key: DataGridKey): DataGridKey[] {
  return current.includes(key) ? removeKeys(current, [key]) : [...current, key];
}

/**
 * The rows from `anchor` to `to`, both included, in the order of `rows` whichever of them comes
 * first. With no anchor, or one that is not among `rows`, or a row that is not, the range is `to`
 * alone: there is nothing to span.
 */
export function rangeKeys(
  rows: readonly { key: DataGridKey }[],
  anchor: DataGridKey | null,
  to: DataGridKey,
): DataGridKey[] {
  const from = anchor === null ? -1 : rows.findIndex((row) => row.key === anchor);
  const end = rows.findIndex((row) => row.key === to);
  if (from < 0 || end < 0) return [to];
  const [first, last] = from <= end ? [from, end] : [end, from];
  return rows.slice(first, last + 1).map((row) => row.key);
}

/** How much of a scope (the keys of the rows a "select all" is about) is chosen. */
export interface ScopeState {
  /** Every row of the scope is chosen, and there is one. */
  checked: boolean;
  /** Some rows of the scope are chosen, not all. */
  indeterminate: boolean;
  /** There are no rows in the scope: nothing to choose. */
  disabled: boolean;
}

export function scopeState(
  scope: readonly DataGridKey[],
  chosen: ReadonlySet<DataGridKey> | readonly DataGridKey[],
): ScopeState {
  const set = chosen instanceof Set ? chosen : new Set(chosen);
  const count = scope.filter((key) => set.has(key)).length;
  return {
    checked: scope.length > 0 && count === scope.length,
    indeterminate: count > 0 && count < scope.length,
    disabled: scope.length === 0,
  };
}
