import { isNumber } from '../../internal/number';
import { devWarn, isProduction } from '../../internal/warn';
import type { DataGridKey } from './types';

/** The `rowKey` prop: the name of a property of the row, or a function of the row. */
export type RowKey<TRow> = (keyof TRow & string) | ((row: TRow) => DataGridKey);

/** What `rowKey` gives for a row, as it is: not yet known to be usable. */
export function readRowKey<TRow>(rowKey: RowKey<TRow>, row: TRow): unknown {
  if (typeof rowKey === 'function') return rowKey(row);
  return typeof row === 'object' && row !== null
    ? (row as Record<string, unknown>)[rowKey]
    : undefined;
}

/** A key is a string or a finite number; anything else, `null` and `undefined` included, is not one. */
export function usableKey(raw: unknown): DataGridKey | undefined {
  if (typeof raw === 'string') return raw;
  if (isNumber(raw)) return raw;
  return undefined;
}

/**
 * The React keys of a list of rows. A key that comes again is numbered (`a`, `a#2`), so React draws
 * every row even when the data holds the same key twice (the grid warns about that); selection and
 * focus, which go by the key itself, treat such rows as one. A number is written as the string React
 * would make of it, so `1` and `"1"` are one key, and a numbered key never meets a real one.
 */
export function uniqueKeys(keys: readonly DataGridKey[]): string[] {
  const seen = new Set<string>();
  return keys.map((key) => {
    const base = String(key);
    let candidate = base;
    for (let n = 2; seen.has(candidate); n++) candidate = `${base}#${n}`;
    seen.add(candidate);
    return candidate;
  });
}

/**
 * Development only: warns, once each, when a row has no usable key and when two rows have the
 * same one. Run when `data` changes; in production the rows are not read at all.
 */
export function checkKeys<TRow>(data: readonly TRow[], rowKey: RowKey<TRow>): void {
  if (isProduction()) return;
  const seen = new Set<DataGridKey>();
  let missing = false;
  let repeated = false;
  for (const row of data) {
    const key = usableKey(readRowKey(rowKey, row));
    if (key === undefined) missing = true;
    else if (seen.has(key)) repeated = true;
    else seen.add(key);
  }
  if (missing) {
    devWarn(
      '<DataGrid> a row has no usable key (rowKey gave something that is not a string or a number); its place in the list is used.',
    );
  }
  if (repeated) {
    devWarn('<DataGrid> two rows have the same key; selection and focus treat them as one row.');
  }
}
