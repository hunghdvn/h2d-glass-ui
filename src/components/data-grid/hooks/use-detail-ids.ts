import { useCallback, useId, useMemo, useRef } from 'react';
import type { DataGridKey } from '../types';

/**
 * The id of the detail row of each row key, for the `aria-controls` of its button: the grid's `useId`
 * and a number the key was given the first time its detail row was in the list, never the key itself,
 * which may hold spaces or anything else an id list cannot (a key is no label of an element). The
 * number stays with the key for as long as the grid lives, so opening or closing another detail changes
 * no id and draws no row. The numbers are given in the order of the list, which a server render and the
 * first client render share. Each key is given its number once, whatever the number of renders.
 */
export function useDetailIds(
  rows: readonly { kind: string; key: DataGridKey }[],
): (key: DataGridKey) => string {
  const base = useId();
  const numbers = useRef(new Map<DataGridKey, number>());
  useMemo(() => {
    for (const row of rows) {
      if (row.kind === 'detail' && !numbers.current.has(row.key)) {
        numbers.current.set(row.key, numbers.current.size + 1);
      }
    }
  }, [rows]);
  return useCallback((key) => `${base}-detail-${numbers.current.get(key) ?? 0}`, [base]);
}
