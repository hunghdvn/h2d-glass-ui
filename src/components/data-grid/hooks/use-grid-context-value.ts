import { useMemo } from 'react';
import type { ResolvedColumn } from '../engine/columns';
import type { TextReader } from '../engine/filter';
import type { DetailsView, GridContextValue } from '../grid-context';
import type { PinPlace } from '../engine/layout';
import type { TableVariant } from '../../table/Table';
import type {
  DataGridKey,
  DataGridLabels,
  DataGridProps,
  DataGridSelectAllMode,
  DataGridSelectionMode,
} from '../types';
import type { ColumnDrag } from './use-column-drag';
import type { ColumnMenuControl } from './use-column-menu';
import type { ColumnResize } from './use-column-resize';
import type { SelectionActions } from './use-selection';

export interface GridContextOptions<TRow> {
  columns: readonly ResolvedColumn<TRow>[];
  layoutColumns: readonly ResolvedColumn<TRow>[];
  resolved: readonly ResolvedColumn<TRow>[];
  /** Opens or closes the group with this key. */
  toggleGroup: (key: string) => void;
  /** Whether a row has a detail, `undefined` while the grid has no details. */
  hasDetail: DetailsView<TRow>['has'] | undefined;
  renderDetail: DataGridProps<TRow>['renderDetail'];
  toggleDetail: (key: DataGridKey) => void;
  groupTotals: GridContextValue<TRow>['groupTotals'];
  summaryReader: TextReader<TRow>;
  filler: boolean;
  fillerAt: number;
  pins: readonly (PinPlace | undefined)[];
  layoutPins: readonly (PinPlace | undefined)[];
  labels: DataGridLabels;
  controlLabels: GridContextValue<TRow>['controlLabels'];
  variant: TableVariant;
  locale: string;
  virtual: boolean;
  filterRow: boolean;
  headerFilter: boolean;
  skeletonRows: number;
  textOf: (row: TRow, column: ResolvedColumn<TRow>) => string;
  rowClassName: DataGridProps<TRow>['rowClassName'];
  sorting: GridContextValue<TRow>['sorting'];
  onSortPress: (columnId: string, additive: boolean) => void;
  selectionMode: DataGridSelectionMode;
  selectAllMode: DataGridSelectAllMode;
  rowClick: boolean;
  activates: boolean;
  selectionActions: SelectionActions;
  grouped: readonly string[];
  panel: boolean;
  rowHeader: ResolvedColumn<TRow> | undefined;
  /** The `rowReorder` member (`useRowReordering`). */
  rowReorder: GridContextValue<TRow>['rowReorder'];
  resize: ColumnResize;
  reorder: ColumnDrag;
  columnMenu: ColumnMenuControl;
  menuId: string;
  hideable: boolean;
  groupable: boolean;
}

/**
 * What the parts of one grid share (`GridContext`): every member and every dependency a part of the grid
 * reads, made again only when one of them changes. It holds no row and no chosen key, so a choice, a drag
 * or a menu opening draws no row.
 */
export function useGridContextValue<TRow>(
  options: GridContextOptions<TRow>,
): GridContextValue<TRow> {
  const { columns, layoutColumns, resolved, toggleGroup, hasDetail, renderDetail, toggleDetail } =
    options;
  const { groupTotals, summaryReader, filler, fillerAt, pins, layoutPins, labels, variant } =
    options;
  const { controlLabels } = options;
  const { locale, virtual, filterRow, headerFilter, skeletonRows, textOf, rowClassName } = options;
  const { sorting, onSortPress, selectionMode, selectAllMode, rowClick, activates } = options;
  const { selectionActions, grouped, panel, rowHeader, rowReorder, resize, reorder } = options;
  const { columnMenu, menuId, hideable, groupable } = options;
  const groupsView = useMemo(() => ({ toggle: toggleGroup }), [toggleGroup]);
  const detailsView = useMemo<DetailsView<TRow> | null>(
    () =>
      hasDetail && typeof renderDetail === 'function'
        ? { has: hasDetail, render: renderDetail, toggle: toggleDetail }
        : null,
    [hasDetail, renderDetail, toggleDetail],
  );
  return useMemo<GridContextValue<TRow>>(
    () => ({
      columns,
      layoutColumns,
      resolved,
      groups: groupsView,
      groupTotals,
      summaryReader,
      details: detailsView,
      filler,
      fillerAt,
      pins,
      layoutPins,
      labels,
      controlLabels,
      variant,
      locale,
      virtual,
      filterRow,
      headerFilter,
      skeletonRows,
      textOf,
      rowClassName,
      sorting,
      onSortPress,
      selection: {
        mode: selectionMode,
        allMode: selectAllMode,
        onRowClick: rowClick,
        activates,
        actions: selectionActions,
      },
      grouped,
      groupPanel: panel,
      rowHeader,
      rowReorder,
      resize,
      reorder: { onPointerDown: reorder.onPointerDown },
      menu: {
        store: columnMenu.store,
        open: columnMenu.open,
        close: columnMenu.close,
        onPointerDown: columnMenu.onPointerDown,
        onContextMenu: columnMenu.onContextMenu,
        contentId: menuId,
        hideable,
        groupable,
      },
      dragSource: reorder.source,
    }),
    [
      columns,
      layoutColumns,
      resolved,
      groupsView,
      groupTotals,
      summaryReader,
      detailsView,
      filler,
      fillerAt,
      pins,
      layoutPins,
      textOf,
      rowReorder,
      labels,
      controlLabels,
      locale,
      variant,
      virtual,
      filterRow,
      headerFilter,
      skeletonRows,
      rowClassName,
      sorting,
      onSortPress,
      selectionMode,
      selectAllMode,
      rowClick,
      activates,
      selectionActions,
      grouped,
      panel,
      rowHeader,
      resize,
      reorder.onPointerDown,
      columnMenu,
      menuId,
      hideable,
      groupable,
      reorder.source,
    ],
  );
}
