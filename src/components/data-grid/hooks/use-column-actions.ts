import { useCallback } from 'react';
import type { ResolvedColumn } from '../engine/columns';
import { pinColumn, setHidden } from '../engine/layout';
import type { ColumnMenuActions } from '../parts/ColumnMenu';
import type {
  DataGridColumnLayout,
  DataGridLabels,
  DataGridSortDirection,
  DataGridSortItem,
} from '../types';

/** The caption of the column of `id`, or the id when no column of the caller's has it. */
export function captionOf(
  columns: readonly Pick<ResolvedColumn<never>, 'id' | 'caption'>[],
  id: string,
) {
  return columns.find((column) => column.id === id)?.caption ?? id;
}

export interface ColumnActionsOptions<TRow> {
  /** The caller's columns, shown or not: a caption is looked up here. */
  resolved: readonly ResolvedColumn<TRow>[];
  /** The layout as shown: every change is built from it. */
  layout: DataGridColumnLayout;
  setColumnLayout: (next: DataGridColumnLayout) => void;
  /** The sort as it is shown, and the way to change it with its callbacks and its words. */
  sortItems: readonly DataGridSortItem[];
  applySort: (next: readonly DataGridSortItem[]) => void;
  /** What the keys do, which the menu does too. */
  moveBy: (columnId: string, step: -1 | 1) => void;
  fit: (columnId: string) => void;
  labels: DataGridLabels;
  /** Says a text through the grid's live region. */
  announce: (text: string) => void;
}

export interface ColumnActions {
  /** Shows or hides a column: from its menu or from the column chooser, one change with its words. */
  showColumn: (columnId: string, show: boolean) => void;
  /** What the items of the column menu do. */
  menuActions: ColumnMenuActions;
}

/**
 * What the user does to the columns from their menu or from the chooser (spec phase 6 §3.6): each is
 * one change of the layout or of the sort, with its callbacks and what is said about it. The layout
 * they build from is the one shown (`DataGrid`'s `shownLayout`), never the caller's raw value.
 */
export function useColumnActions<TRow>({
  resolved,
  layout,
  setColumnLayout,
  sortItems,
  applySort,
  moveBy,
  fit,
  labels,
  announce,
}: ColumnActionsOptions<TRow>): ColumnActions {
  const showColumn = useCallback(
    (columnId: string, show: boolean) => {
      const next = setHidden(layout, columnId, !show);
      if (next === layout) return;
      setColumnLayout(next);
      const caption = captionOf(resolved, columnId);
      announce(show ? labels.announceShown(caption) : labels.announceHidden(caption));
    },
    [layout, setColumnLayout, resolved, announce, labels],
  );

  const menuActions: ColumnMenuActions = {
    sort: (columnId, direction: DataGridSortDirection | null) => {
      const next =
        direction === null
          ? sortItems.filter((item) => item.field !== columnId)
          : [{ field: columnId, direction }];
      // The sort that is shown already is no change: nothing is called and nothing is said.
      const same =
        next.length === sortItems.length &&
        next.every(
          (item, at) =>
            item.field === sortItems[at]!.field && item.direction === sortItems[at]!.direction,
        );
      if (!same) applySort(next);
    },
    pin: (columnId, side) => {
      const next = pinColumn(layout, columnId, side);
      if (next === layout) return;
      setColumnLayout(next);
      const caption = captionOf(resolved, columnId);
      announce(
        side === null ? labels.announceUnpinned(caption) : labels.announcePinned(caption, side),
      );
    },
    move: moveBy,
    fit,
    hide: (columnId) => showColumn(columnId, false),
  };

  return { showColumn, menuActions };
}
