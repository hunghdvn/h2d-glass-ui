import { useEffect, useMemo, useRef } from 'react';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { checkKeys, readRowKey, usableKey } from '../row-keys';
import type { RowKey } from '../row-keys';
import type { DataGridKey } from '../types';

/**
 * The function the pipeline reads a row's key with. Its identity is an input of the flatten step,
 * which runs again when it changes, so it must not change when the caller writes `rowKey` as a
 * function in the JSX, which is a new function on every render: the latest one is read through a
 * ref, written at each commit. A property name is a value and can be a dependency itself. A row
 * with no usable key is known by its place in the list; the warning is `checkKeys`', after the
 * commit and only in development.
 */
export function useRowKey<TRow>(
  rowKey: RowKey<TRow>,
  data: readonly TRow[],
): (row: TRow, index: number) => DataGridKey {
  const field = typeof rowKey === 'string' ? rowKey : undefined;
  const given = typeof rowKey === 'function' ? rowKey : null;
  const latest = useRef<((row: TRow) => DataGridKey) | null>(null);
  // Set while rendering only the first time a function is seen, which is how a ref is started; after
  // that a commit writes it. A render that is thrown away never leaves its function behind.
  if (latest.current === null) latest.current = given;
  useWriteOnCommit(() => {
    latest.current = given;
  });

  useEffect(() => {
    const key = field ?? latest.current;
    if (key) checkKeys(data, key);
  }, [data, field]);

  return useMemo(
    () => (row, index) => {
      const key = field ?? latest.current;
      return (key ? usableKey(readRowKey(key, row)) : undefined) ?? index;
    },
    [field],
  );
}
