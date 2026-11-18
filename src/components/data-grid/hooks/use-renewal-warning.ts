import { useEffect, useRef } from 'react';
import { devWarn, isProduction } from '../../../internal/warn';
import type { DataGridColumn, DataGridLabels } from '../types';

const COMMITS = 3;

/**
 * Development only: warns once when a prop is renewed on three commits in a row, which is what a
 * value written in the JSX is: a new array, function or object on every render, which the grid
 * cannot keep, so it does again what it did for the last one. `renewed(previous, next)` says
 * whether `next` is the same thing as `previous` made anew. It counts commits, in an effect, and
 * not renders, so StrictMode's second render does not count; a commit that keeps it starts again.
 */
export function useRenewalWarning<T>(
  value: T,
  renewed: (previous: T, next: T) => boolean,
  message: string,
): void {
  const last = useRef<{ value: T } | null>(null);
  const streak = useRef(0);
  useEffect(() => {
    if (isProduction()) return;
    const before = last.current;
    streak.current = before && renewed(before.value, value) ? streak.current + 1 : 0;
    last.current = { value };
    if (streak.current === COMMITS) devWarn(message);
  });
}

const idOf = (column: unknown): string => {
  if (typeof column !== 'object' || column === null) return '';
  const { id, field } = column as { id?: unknown; field?: unknown };
  return typeof id === 'string' ? id : typeof field === 'string' ? field : '';
};
const idsOf = (columns: readonly unknown[]): string => columns.map(idOf).join('\u0001');

/**
 * `columns` that is a new array with the same columns in it: every render then resolves every
 * column again and throws away what was remembered of the rows (spec phase 6 §3.5).
 */
export function useColumnsWarning<TRow>(columns: readonly DataGridColumn<TRow>[]): void {
  useRenewalWarning(
    columns,
    (previous, next) => previous !== next && idsOf(previous) === idsOf(next),
    '<DataGrid> columns is a new array on every render; pass a stable one (a module constant or useMemo).',
  );
}

/** Whether two `labels` props say the same: the same keys, each with the same value. */
export function sameLabels(
  a: Partial<DataGridLabels> | undefined,
  b: Partial<DataGridLabels> | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a) as (keyof DataGridLabels)[];
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.hasOwn(b, key) && Object.is(a[key], b[key]))
  );
}

const keysOf = (labels: object): string => Object.keys(labels).sort().join('\u0001');

/**
 * `rowClassName` that is a new function, and `labels` whose functions are new, on every render:
 * both are read by every row, so each such render draws every row again, where a choice would draw
 * only the rows it changes. Labels of strings written in the JSX are kept by value, and do not warn.
 */
export function useRowPropsWarning<TRow>(
  rowClassName: ((row: TRow) => string | undefined) | undefined,
  labels: Partial<DataGridLabels> | undefined,
): void {
  useRenewalWarning(
    rowClassName,
    (previous, next) =>
      typeof previous === 'function' && typeof next === 'function' && previous !== next,
    '<DataGrid> rowClassName is a new function on every render, which draws every row again; pass a stable one (a module function or useCallback).',
  );
  useRenewalWarning(
    labels,
    (previous, next) =>
      previous !== undefined &&
      next !== undefined &&
      keysOf(previous) === keysOf(next) &&
      !sameLabels(previous, next),
    '<DataGrid> labels has new functions on every render, which draws every row again; pass stable ones (module functions, useCallback or useMemo).',
  );
}
