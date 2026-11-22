import { useCallback, useMemo } from 'react';
import type { ResolvedColumn } from '../engine/columns';
import { effectiveSort, nextSort } from '../engine/sort';
import type { DataGridLabels, DataGridSortItem } from '../types';
import { captionOf } from './use-column-actions';

export interface GridSortOptions<TRow> {
  /** The sort the state holds, as given. */
  sort: readonly DataGridSortItem[];
  /** The columns shown, in any order: a hidden column is no column of the grid, so it sorts nothing. */
  sortColumns: readonly ResolvedColumn<TRow>[];
  sortMode: 'single' | 'multiple';
  setSort: (sort: readonly DataGridSortItem[]) => void;
  /** The caller's columns, shown or not: a caption is looked up here. */
  resolved: readonly ResolvedColumn<TRow>[];
  labels: DataGridLabels;
  announce: (text: string) => void;
}

export interface GridSort {
  /** The sort as it is shown: the items that sort something, in order. A press builds on them. */
  sortItems: readonly DataGridSortItem[];
  /** The level and direction of each sorted field, and how many there are, for the titles. */
  sorting: {
    levels: ReadonlyMap<string, { direction: DataGridSortItem['direction']; level: number }>;
    count: number;
  };
  /** A sort the user asks for: the state, its callbacks and what is said. */
  applySort: (next: readonly DataGridSortItem[]) => void;
  /** A press on a title: the next sort, built on the one shown. */
  onSortPress: (columnId: string, additive: boolean) => void;
}

/**
 * The sort as the user sees and changes it: what sorts, what the titles show, and the one way a press
 * on a title or an item of a column's menu asks for a change.
 */
export function useGridSort<TRow>({
  sort,
  sortColumns,
  sortMode,
  setSort,
  resolved,
  labels,
  announce,
}: GridSortOptions<TRow>): GridSort {
  const sortItems = useMemo(() => effectiveSort(sort, sortColumns), [sort, sortColumns]);
  const sorting = useMemo(
    () => ({
      levels: new Map(
        sortItems.map((item, index) => [
          item.field,
          { direction: item.direction, level: index + 1 },
        ]),
      ),
      count: sortItems.length,
    }),
    [sortItems],
  );
  const applySort = useCallback(
    (next: readonly DataGridSortItem[]) => {
      setSort(next);
      announce(
        next.length === 0
          ? labels.announceSortCleared
          : labels.announceSort(
              next.map((item) => ({
                caption: captionOf(resolved, item.field),
                direction: item.direction,
              })),
            ),
      );
    },
    [setSort, announce, labels, resolved],
  );
  const onSortPress = useCallback(
    (columnId: string, additive: boolean) =>
      applySort(nextSort(sortItems, columnId, additive, sortMode)),
    [sortItems, sortMode, applySort],
  );
  return { sortItems, sorting, applySort, onSortPress };
}
