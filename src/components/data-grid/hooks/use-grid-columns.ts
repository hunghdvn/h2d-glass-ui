import { useEffect, useMemo, useState } from 'react';
import {
  ACTIONS_COLUMN_WIDTH,
  DETAIL_COLUMN_WIDTH,
  DRAG_COLUMN_WIDTH,
  GROUP_INDENT_WIDTH,
  SELECT_COLUMN_WIDTH,
  actionsColumn,
  checkFields,
  detailColumn,
  dragColumn,
  groupedOut,
  indentColumn,
  isDataColumn,
  isPlaceColumn,
  resolveColumns,
  selectColumn,
} from '../engine/columns';
import type { ResolvedColumn } from '../engine/columns';
import { applyLayout, fillerIndex, pinPlaces, sameLayout, startLayout } from '../engine/layout';
import type { WidthSpec } from '../engine/layout';
import type { DataGridColumn, DataGridColumnLayout, DataGridPin } from '../types';
import { useColumnStartWarning } from './use-column-start-warning';
import { sameList, sameMembers, useKept } from './use-kept';
import { useColumnsWarning } from './use-renewal-warning';

export interface ResolvedColumnsOptions<TRow> {
  /** The caller's columns, made safe by `normalizeProps`. */
  columns: readonly DataGridColumn<TRow>[];
  /** The rows the field names of the columns are checked against. */
  data: readonly TRow[];
  locale: string;
  timeZone: string;
  /** The words of a boolean, which `resolveColumns` writes into the columns' texts. */
  yes: string;
  no: string;
  /** The grid's `allow…` props: each one is the default of the same field of every column. */
  allowSorting: boolean;
  allowResizing: boolean;
  allowReordering: boolean;
  allowPinning: boolean;
  allowHiding: boolean;
  allowFiltering: boolean;
  allowHeaderFiltering: boolean;
  allowGrouping: boolean;
  /** `defaultColumnLayout`, which an uncontrolled layout starts from. */
  defaultColumnLayout: Partial<DataGridColumnLayout> | undefined;
}

export interface ResolvedColumns<TRow> {
  /** Every column of the caller's, each with the grid's defaults laid in. */
  resolved: readonly ResolvedColumn<TRow>[];
  /** Where an uncontrolled layout starts: the columns of the first render, and `defaultColumnLayout`. */
  startedWith: DataGridColumnLayout;
}

/**
 * The caller's columns as the grid reads them (spec phase 6 §3.1), and the layout the grid starts
 * from. The columns are made again only when what they are made from changes, and a field that names
 * nothing in the data warns once after the commit.
 */
export function useResolvedColumns<TRow>({
  columns,
  data,
  locale,
  timeZone,
  yes,
  no,
  allowSorting,
  allowResizing,
  allowReordering,
  allowPinning,
  allowHiding,
  allowFiltering,
  allowHeaderFiltering,
  allowGrouping,
  defaultColumnLayout,
}: ResolvedColumnsOptions<TRow>): ResolvedColumns<TRow> {
  useColumnsWarning(columns);
  const resolved = useMemo(
    () =>
      resolveColumns(columns, {
        locale,
        timeZone,
        yes,
        no,
        allowSorting,
        allowResizing,
        allowReordering,
        allowPinning,
        allowHiding,
        allowFiltering,
        allowHeaderFiltering,
        allowGrouping,
      }),
    [
      columns,
      locale,
      timeZone,
      yes,
      no,
      allowSorting,
      allowResizing,
      allowReordering,
      allowPinning,
      allowHiding,
      allowFiltering,
      allowHeaderFiltering,
      allowGrouping,
    ],
  );
  useEffect(() => checkFields(resolved, data), [resolved, data]);
  // Where an uncontrolled layout starts: the columns of the first render, and `defaultColumnLayout`.
  const [startedWith] = useState(() => startLayout(resolved, defaultColumnLayout));
  return { resolved, startedWith };
}

export interface ShownColumnsOptions<TRow> {
  resolved: readonly ResolvedColumn<TRow>[];
  /** The layout the state holds, as the caller gave it. */
  layout: DataGridColumnLayout;
  selectionMode: 'none' | 'single' | 'multiple';
  /** The fields the grid groups by (`effectiveGrouping`), outermost first: one indent column each. */
  grouped: readonly string[];
  /** Whether the grid has details (`renderDetail`): the column of their buttons comes after the indents. */
  detail: boolean;
  /** Whether the grid reorders rows (`rowReorder`): the column of handles comes after the column of boxes. */
  reorder: boolean;
  /** Whether the grid draws the column of buttons (`editing`): the last column, a place of the keyboard. */
  actions: boolean;
}

export interface ShownColumns<TRow> {
  /** The layout applied to the columns: the shown ones, their widths and zones, and the layout as shown. */
  applied: ReturnType<typeof applyLayout<TRow>>;
  /** The layout as it is shown (unknown ids dropped, new columns appended, widths held to their limits). */
  shownLayout: DataGridColumnLayout;
  /**
   * The shown columns in order, without the column of boxes and the indents (the title and the rows
   * read them): a column the grouping takes out (`groupedOut`) is not among them.
   */
  dataColumns: readonly ResolvedColumn<TRow>[];
  /** The columns the grouping took out of the shown ones, in the order of the grouping. */
  groupedColumns: readonly ResolvedColumn<TRow>[];
  /** The same columns in any order: the sort reads them, which an order does not change. */
  sortColumns: readonly ResolvedColumn<TRow>[];
  /** Every column of the keyboard: the column of boxes first when there is one, then the details', no indent. */
  columnsShown: readonly ResolvedColumn<TRow>[];
  /**
   * Every column the rows draw a cell for, in order: the column of boxes, one indent column for each
   * level of the grouping, the column of the detail buttons, then `dataColumns`. `columnsShown` are the
   * ones of these that are places of the keyboard (`isPlaceColumn`).
   */
  layoutColumns: readonly ResolvedColumn<TRow>[];
  /** The zone of each of `layoutColumns`. */
  pinsShown: readonly (DataGridPin | undefined)[];
  /** The place of each of `layoutColumns` among the zones, for the cells. */
  layoutPins: ReturnType<typeof pinPlaces>;
  /** The place of each of `columnsShown` among the zones: what the resize, the drag and the menu read. */
  pins: ReturnType<typeof pinPlaces>;
  fillerAt: number;
  pinned: boolean;
  /** The width of each of `layoutColumns`. */
  widthSpecs: (WidthSpec & { id: string })[];
  /** The data column the names of the rows come from, whether it is drawn or not. */
  rowHeader: ResolvedColumn<TRow> | undefined;
  /** The last data column shown cannot be hidden. */
  hideable: boolean;
}

/**
 * The columns the grid shows: the layout applied to the resolved columns, each part of it kept apart so
 * a change of one draws only what reads it, and the column of boxes put in front of them. The layout
 * the columns are laid out by is the one of an earlier render while the new one says the same, so a
 * layout written in the JSX draws no row.
 */
export function useShownColumns<TRow>({
  resolved,
  layout: layoutHeld,
  selectionMode,
  grouped,
  detail,
  reorder,
  actions,
}: ShownColumnsOptions<TRow>): ShownColumns<TRow> {
  const layout = useKept(layoutHeld, sameLayout);
  const applied = useMemo(() => applyLayout(resolved, layout), [resolved, layout]);
  // What reads each part of it is kept apart, so a change of one part draws only what reads it: the
  // shown columns in order (the title and the rows), the same columns in any order (the sort, which
  // an order does not change) and the widths (the table alone).
  // The grouping takes its columns out of what is drawn, not out of what the layout holds: a grouped
  // column keeps its place, its width, its pin and its `hidden`, and still sorts and filters.
  const taken = useMemo(() => groupedOut(applied.columns, grouped), [applied.columns, grouped]);
  const groupedColumns = useKept(taken, sameList);
  const drawn = useMemo(
    () => applied.columns.map((column) => !groupedColumns.includes(column)),
    [applied.columns, groupedColumns],
  );
  const dataColumns = useKept(
    useMemo(() => applied.columns.filter((_, at) => drawn[at]), [applied.columns, drawn]),
    sameList,
  );
  const sortColumns = useKept(applied.columns, sameMembers);
  const columnWidths = useKept(
    useMemo(() => applied.widths.filter((_, at) => drawn[at]), [applied.widths, drawn]),
    sameList,
  );
  const dataPins = useKept(
    useMemo(() => applied.pins.filter((_, at) => drawn[at]), [applied.pins, drawn]),
    sameList,
  );
  // The layout as it is shown (unknown ids dropped, new columns appended, widths held to their limits):
  // the one every change the user makes is built from, and the one the callbacks and `getState()` send.
  // `layout` above is the caller's value as it came, kept by value; it is only for `applyLayout`.
  const shownLayout = useKept(applied.layout, sameLayout);
  useColumnStartWarning(resolved, shownLayout);

  // Choosing rows. The column of boxes is a column of the grid like the others to the layout and the
  // keyboard; the sort, the pipeline and the captions know only the caller's.
  const boxColumn = useMemo(() => selectColumn<TRow>(), []);
  // One indent column for each level of the grouping, after the column of boxes.
  const levels = grouped.length;
  const indents = useMemo(
    () => Array.from({ length: levels }, (_, level) => indentColumn<TRow>(level + 1)),
    [levels],
  );
  // The column of the detail buttons, after the indents: a place of the keyboard.
  const openColumn = useMemo(() => detailColumn<TRow>(), []);
  // The column of the row handles, after the boxes and before the indents: a place of the keyboard.
  const handleColumn = useMemo(() => dragColumn<TRow>(), []);
  // The column of buttons, the last of all: a place of the keyboard.
  const buttonsColumn = useMemo(() => actionsColumn<TRow>(), []);
  const columnsShown = useMemo(
    () => [
      ...(selectionMode === 'multiple' ? [boxColumn] : []),
      ...(reorder ? [handleColumn] : []),
      ...(detail ? [openColumn] : []),
      ...dataColumns,
      ...(actions ? [buttonsColumn] : []),
    ],
    [
      selectionMode,
      boxColumn,
      reorder,
      handleColumn,
      detail,
      openColumn,
      dataColumns,
      actions,
      buttonsColumn,
    ],
  );
  const layoutColumns = useMemo(
    () => [
      ...(selectionMode === 'multiple' ? [boxColumn] : []),
      ...(reorder ? [handleColumn] : []),
      ...indents,
      ...(detail ? [openColumn] : []),
      ...dataColumns,
      ...(actions ? [buttonsColumn] : []),
    ],
    [
      selectionMode,
      boxColumn,
      reorder,
      handleColumn,
      indents,
      detail,
      openColumn,
      dataColumns,
      actions,
      buttonsColumn,
    ],
  );
  // The zone of each column of the layout, the column of boxes, the indents and the detail buttons first.
  // They are in the left zone when a data column is, so they stay beside the first column that sticks
  // (spec phase 6 §3.7).
  const pinsShown = useMemo<(DataGridPin | undefined)[]>(() => {
    const side: DataGridPin | undefined = dataPins.includes('left') ? 'left' : undefined;
    return [
      ...(selectionMode === 'multiple' ? [side] : []),
      ...(reorder ? [side] : []),
      ...indents.map(() => side),
      ...(detail ? [side] : []),
      ...dataPins,
      // The buttons end the row: in the right zone when a column is pinned there, so they stay beside it.
      ...(actions ? [dataPins.includes('right') ? ('right' as const) : undefined] : []),
    ];
  }, [selectionMode, reorder, indents, detail, dataPins, actions]);
  const layoutPins = useMemo(() => pinPlaces(pinsShown), [pinsShown]);
  const pins = useMemo(
    () => layoutPins.filter((_, at) => isPlaceColumn(layoutColumns[at]!)),
    [layoutPins, layoutColumns],
  );
  // The filler goes before the right zone; with no column pinned there it goes before the buttons, which
  // are the last column and stand at the end of the row, where E2 draws them.
  const fillerAt =
    actions && !pinsShown.includes('right') ? pinsShown.length - 1 : fillerIndex(pinsShown);
  const pinned = dataPins.some((pin) => pin !== undefined);
  // The widths are the layout's, so they are given to the table alone and not to the parts that draw
  // the cells: the columns of the context are the same objects when only a width changes.
  const widthSpecs = useMemo<(WidthSpec & { id: string })[]>(
    () => [
      ...(selectionMode === 'multiple'
        ? [{ id: boxColumn.id, width: SELECT_COLUMN_WIDTH, minWidth: SELECT_COLUMN_WIDTH }]
        : []),
      ...(reorder
        ? [{ id: handleColumn.id, width: DRAG_COLUMN_WIDTH, minWidth: DRAG_COLUMN_WIDTH }]
        : []),
      ...indents.map((column) => ({
        id: column.id,
        width: GROUP_INDENT_WIDTH,
        minWidth: GROUP_INDENT_WIDTH,
      })),
      ...(detail
        ? [{ id: openColumn.id, width: DETAIL_COLUMN_WIDTH, minWidth: DETAIL_COLUMN_WIDTH }]
        : []),
      ...dataColumns.map((column, index) => ({
        id: column.id,
        width: columnWidths[index],
        minWidth: column.minWidth,
      })),
      ...(actions
        ? [{ id: buttonsColumn.id, width: ACTIONS_COLUMN_WIDTH, minWidth: ACTIONS_COLUMN_WIDTH }]
        : []),
    ],
    [
      selectionMode,
      boxColumn,
      reorder,
      handleColumn,
      indents,
      detail,
      openColumn,
      dataColumns,
      columnWidths,
      actions,
      buttonsColumn,
    ],
  );
  // The column the names of the rows come from: the data column marked `rowHeader`, drawn or not (hidden,
  // or grouped by), so the box, the handle, the detail button and the sentence of a moved row keep naming a
  // row by its text. Only the cell `<th scope="row">` follows the column that is drawn (`Cell`). Taken from
  // the resolved columns, so a hide, a width or a reorder changes nothing here.
  const rowHeader = useMemo(
    () => resolved.find((column) => column.rowHeader && isDataColumn(column)),
    [resolved],
  );
  // The last data column shown cannot be hidden, so its menu has no "Hide column" and, if that was all
  // it had, no button.
  const hideable = dataColumns.length > 1;
  return {
    applied,
    shownLayout,
    dataColumns,
    groupedColumns,
    sortColumns,
    columnsShown,
    layoutColumns,
    pinsShown,
    layoutPins,
    pins,
    fillerAt,
    pinned,
    widthSpecs,
    rowHeader,
    hideable,
  };
}
