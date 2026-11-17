import { useEffect, useRef } from 'react';
import { devWarn, isProduction } from '../../../internal/warn';
import type { DataGridColumn } from '../types';

const COMMITS = 3;

const idOf = (column: DataGridColumn<never>): string => {
  const { id, field } = column as { id?: unknown; field?: unknown };
  return typeof id === 'string' ? id : typeof field === 'string' ? field : '';
};

/**
 * Development only: warns when `columns` is a new array on three commits in a row with the same
 * columns in it, which is what an array written in the JSX is. Every render then resolves every
 * column again and throws away what was remembered of the rows. It counts commits, in an effect,
 * and not renders, so StrictMode's second render does not count; a commit that keeps the array
 * starts the count again.
 */
export function useColumnsWarning<TRow>(columns: readonly DataGridColumn<TRow>[]): void {
  const last = useRef<{ columns: readonly unknown[]; ids: string } | null>(null);
  const streak = useRef(0);
  useEffect(() => {
    if (isProduction()) return;
    const ids = columns.map(idOf).join('\u0001');
    const before = last.current;
    streak.current =
      before && before.columns !== columns && before.ids === ids ? streak.current + 1 : 0;
    last.current = { columns, ids };
    if (streak.current === COMMITS) {
      devWarn(
        '<DataGrid> columns is a new array on every render; pass a stable one (a module constant or useMemo).',
      );
    }
  });
}
