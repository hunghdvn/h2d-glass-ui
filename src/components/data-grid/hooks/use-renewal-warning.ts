import { useEffect, useRef } from 'react';
import { devWarn, isProduction } from '../../../internal/warn';
import { sameSummary, sameSummaryShape } from '../engine/summary';
import type { DataGridColumn, DataGridLabelsInput, DataGridSummaryProp } from '../types';

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

/** Whether two records of words say the same: the same keys, each with the same value. */
function sameWords(a: object | undefined, b: object | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every(
      (key) =>
        Object.hasOwn(b, key) &&
        Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    )
  );
}

/** The labels that are records of words, which `sameLabels` compares by their words. */
const RECORDS: readonly string[] = ['operators', 'panelOperators', 'summary'];

/**
 * Whether two `labels` props say the same: the same keys, each with the same value, and `operators` and
 * `panelOperators`, records, compared by their own words (one level deep), so a record written in the JSX
 * is no new labels.
 */
export function sameLabels(
  a: DataGridLabelsInput | undefined,
  b: DataGridLabelsInput | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a) as (keyof DataGridLabelsInput)[];
  return (
    keys.length === Object.keys(b).length &&
    keys.every(
      (key) =>
        Object.hasOwn(b, key) &&
        (RECORDS.includes(key)
          ? sameWords(a[key] as object | undefined, b[key] as object | undefined)
          : Object.is(a[key], b[key])),
    )
  );
}

/**
 * `summary` whose functions are new on every render (a `type` or a `format` written in the JSX): the grid keeps
 * a `summary` while it says the same, functions by identity, so each such render resolves the items and
 * computes every total again and draws every group row again.
 */
export function useSummaryWarning<TRow>(summary: DataGridSummaryProp<TRow> | undefined): void {
  useRenewalWarning(
    summary,
    (previous, next) =>
      previous !== undefined &&
      next !== undefined &&
      !sameSummary(previous as never, next as never) &&
      sameSummaryShape(previous as never, next as never),
    '<DataGrid> summary has new functions on every render, which computes every total again; pass a stable summary (a module constant or useMemo).',
  );
}

const keysOf = (labels: object): string => Object.keys(labels).sort().join('\u0001');

/**
 * `rowClassName` that is a new function, and `labels` whose functions are new, on every render:
 * both are read by every row, so each such render draws every row again, where a choice would draw
 * only the rows it changes. Labels of strings written in the JSX are kept by value, and do not warn.
 * New label functions also render the grid twice for each render of its parent, since the labels
 * kept by value are set again during that render; the same warning stands for it.
 */
export function useRowPropsWarning<TRow>(
  rowClassName: ((row: TRow) => string | undefined) | undefined,
  labels: DataGridLabelsInput | undefined,
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
