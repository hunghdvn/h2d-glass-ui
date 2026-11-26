import { useCallback, useId, useMemo, useRef } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import type { ResolvedColumn } from '../engine/columns';
import type { FlatDataRow, FlatRow } from '../engine/flatten';
import type { GridContextValue } from '../grid-context';
import type { DataGridKey, DataGridLabels, DataGridRowDrop } from '../types';
import type { DragViewStore } from './use-drag-view';
import { useRowDrag } from './use-row-drag';
import type { RowDrag } from './use-row-drag';
import { useRowMenu } from './use-row-menu';
import type { RowMenuControl } from './use-row-menu';
import { useRowReorder } from './use-row-reorder';
import type { RowReorder } from './use-row-reorder';

// What the link does until the keyboard has written its member into it.
const unlinkedRow = (): void => {};

export interface RowReorderingOptions<TRow> {
  /** Whether the grid reorders rows (`rowReorder` is `true`). */
  reorderRows: boolean;
  /** Whether the grid sorts now: the handles do nothing while it does. */
  sorted: boolean;
  /** Whether the grid groups now: the handles do nothing while it does. */
  grouped: boolean;
  /** Every data row after the filter, in the order shown. */
  keyed: readonly FlatDataRow<TRow>[];
  data: readonly TRow[];
  rowHeader: ResolvedColumn<TRow> | undefined;
  textOf: (row: TRow, column: ResolvedColumn<TRow>) => string;
  onRowReorder:
    ((from: DataGridKey, to: DataGridKey, position: DataGridRowDrop) => void) | undefined;
  labels: DataGridLabels;
  announce: (text: string) => void;
  scrollToRow: (key: DataGridKey) => boolean;
  /** The rows of the page shown. */
  rows: readonly FlatRow<TRow>[];
  frameRef: RefObject<HTMLElement | null>;
  tableRef: RefObject<HTMLTableElement | null>;
  /** Whether the grid has a height, so its frame scrolls its rows. */
  scrolls: boolean;
  view: DragViewStore;
}

export interface RowReordering {
  /** Whether the handles act: the grid reorders rows and neither sorts nor groups. */
  rowsMovable: boolean;
  reordering: RowReorder;
  rowMenu: RowMenuControl;
  rowMenuId: string;
  rowDrag: RowDrag;
  /** Puts the active place on the row with this key: the keyboard's, through `focusRowLink`. */
  focusRow: (key: DataGridKey) => void;
  /** What the keyboard writes its `focusRow` into, as it commits. */
  focusRowLink: MutableRefObject<(key: DataGridKey) => void>;
  /** The `rowReorder` member of the grid's context: `null` while the grid does not reorder rows. */
  contextPart: GridContextValue['rowReorder'];
}

/**
 * Moving rows: the handles do nothing while the grid sorts or groups, where the order is not the rows'
 * own. The three ways to ask for a move (the menu, the keys, a drop) are one function, which tells the
 * app; the menu and the drag are kept apart from what the rows read, as the column menu and the drag of a
 * column are. The keyboard is made after this, and takes the keys of moving rows: what this asks of it
 * comes through a link the keyboard writes when it commits.
 */
export function useRowReordering<TRow>(options: RowReorderingOptions<TRow>): RowReordering {
  const { reorderRows, sorted, grouped, keyed, data, rowHeader, textOf, onRowReorder } = options;
  const { labels, announce, scrollToRow, rows, frameRef, tableRef, scrolls, view } = options;
  const focusRowLink = useRef<(key: DataGridKey) => void>(unlinkedRow);
  const focusRow = useCallback((key: DataGridKey) => focusRowLink.current(key), []);
  const rowsMovable = reorderRows && !sorted && !grouped;
  const reordering = useRowReorder({
    enabled: reorderRows,
    off: !rowsMovable,
    keyed,
    data,
    rowHeader,
    textOf,
    onRowReorder,
    labels,
    announce,
    scrollToRow,
    rows,
    focusRow,
  });
  const rowMenu = useRowMenu({ enabled: rowsMovable, rows });
  const rowMenuId = useId();
  const rowDrag = useRowDrag({
    enabled: rowsMovable,
    frameRef,
    tableRef,
    rows,
    scrolls,
    view,
    nameOf: reordering.nameOf,
    drop: reordering.drop,
  });
  const contextPart = useMemo<GridContextValue['rowReorder']>(
    () =>
      reorderRows
        ? {
            off: !rowsMovable,
            onPointerDown: rowDrag.onPointerDown,
            menu: rowMenu,
            contentId: rowMenuId,
            view,
          }
        : null,
    [reorderRows, rowsMovable, rowDrag.onPointerDown, rowMenu, rowMenuId, view],
  );
  return {
    rowsMovable,
    reordering,
    rowMenu,
    rowMenuId,
    rowDrag,
    focusRow,
    focusRowLink,
    contextPart,
  };
}
