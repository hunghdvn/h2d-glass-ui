import { createContext, useContext } from 'react';
import type { ResolvedColumn } from './engine/columns';
import type { FlatRow } from './engine/flatten';
import type { ScopeState } from './engine/selection';
import type { ActivePlace } from './hooks/use-grid-keyboard';
import type { SelectionActions, SelectionView } from './hooks/use-selection';
import type {
  DataGridKey,
  DataGridLabels,
  DataGridSelectAllMode,
  DataGridSelectionMode,
  DataGridSortDirection,
} from './types';
import type { TableVariant } from '../table/Table';

/** What the parts of one grid share. Internal: nothing of it is exported. */
export interface GridContextValue<TRow = unknown> {
  columns: readonly ResolvedColumn<TRow>[];
  /**
   * Whether the rows end in a cell of the filler column: every column has a width, and the frame
   * has not been measured or has room enough beyond them for it (`useColumnWidths`).
   */
  filler: boolean;
  labels: DataGridLabels;
  variant: TableVariant;
  /**
   * The rows of the list, in order: the page, or in a virtual grid every row, of which only the
   * window (`VirtualContext`) is drawn.
   */
  rows: readonly FlatRow<TRow>[];
  /** Whether the grid is virtual: its rows say their place in the list with `aria-rowindex`. */
  virtual: boolean;
  /**
   * What stands in the place of the rows when there are none: skeleton rows while the grid loads, the
   * words of an empty grid when it does not, `null` when there are rows.
   */
  placeholder: 'skeleton' | 'empty' | null;
  /** How many skeleton rows are drawn: as many as a page holds, and at most 20. */
  skeletonRows: number;
  /** A unique React key for each of `rows`, in the same order. */
  rowReactKeys: readonly string[];
  /** The text of a cell, written once for a row and a column. */
  textOf: (row: TRow, column: ResolvedColumn<TRow>) => string;
  rowClassName: ((row: TRow) => string | undefined) | undefined;
  /** The columns that are sorted: the direction and the level of each (from 1), and how many. */
  sorting: {
    levels: ReadonlyMap<string, { direction: DataGridSortDirection; level: number }>;
    count: number;
  };
  /** A press on the title of a column that sorts; `additive` is a press that adds a level. */
  onSortPress: (columnId: string, additive: boolean) => void;
  /**
   * What a row and the title do about choosing. It holds no chosen key, so a choice does not change it
   * and does not draw the rows again; what is chosen is in `SelectionViewContext`.
   */
  selection: {
    mode: DataGridSelectionMode;
    allMode: DataGridSelectAllMode;
    /** Whether a press on a row chooses it. */
    onRowClick: boolean;
    /**
     * Whether a double press on a row activates it (`onRowActivate`): then the second click of the
     * pair is part of that, and not a press that chooses.
     */
    activates: boolean;
    actions: SelectionActions;
  };
  /** The column whose text names a row (the row header), for the name of its box. */
  rowHeader: ResolvedColumn<TRow> | undefined;
}

const NONE_CHOSEN: SelectionView = {
  chosen: new Set<DataGridKey>(),
  header: { checked: false, indeterminate: false, disabled: true } satisfies ScopeState,
};

/** What is chosen, apart from the rest: only the rows that read it, and the title, draw for a change. */
export const SelectionViewContext = createContext<SelectionView>(NONE_CHOSEN);

/**
 * The one cell with `tabindex="0"`: `row` is -1 for a title, else an index of `rows`. Apart from the
 * rest so that the keyboard moving it draws the title and the body, which pass what each row needs of
 * it as props, and not every row that reads the grid's context.
 */
export const ActiveContext = createContext<ActivePlace | null>(null);

/**
 * What the window of a virtual grid, which the body keeps, and the rest of the grid say to each
 * other. The grid makes it once, and each side writes its own member when it commits.
 */
export interface WindowLink {
  /**
   * Scrolls the frame the least it takes for the row at an index of `rows` to be under the heading,
   * and draws the window there now: the body's. Nothing before the body is mounted.
   */
  scrollToIndex: (index: number) => void;
  /**
   * Called by the body after a commit that moved its window: the keyboard focuses the row it asked
   * to be drawn, which a commit of the body alone (a scroll, a row brought into view) draws.
   */
  drawn: () => void;
}

/**
 * What the body of a virtual grid needs to keep its window; `null` when every row is drawn. The
 * window is the body's own state, not the grid's: a scroll changes it once a frame, and only the
 * body and the rows that come draw again, not the heading, the toolbar or the grid's effects.
 */
export interface VirtualWindow {
  /** The height of a data row as the stylesheet draws it. */
  rowHeight: number;
  /** The distance between the tops of two rows before one is measured. */
  estimate: number;
  /** How many rows the first window has, before the frame is measured (on the server too). */
  firstRows: number;
  /** The row the keyboard is leaving for one not drawn yet, kept until the focus has left it. */
  held: number | undefined;
  link: { readonly current: WindowLink };
}

export const VirtualContext = createContext<VirtualWindow | null>(null);

export const GridContext = createContext<GridContextValue | null>(null);

/**
 * The context of the grid the part is in. The parts are internal and always inside a grid, so a
 * missing context is a mistake of the library's own, not of a caller; it is the one place that throws.
 */
export function useGridContext<TRow>(): GridContextValue<TRow> {
  const context = useContext(GridContext);
  if (!context) throw new Error('A part of the DataGrid was used outside a DataGrid.');
  return context as GridContextValue<TRow>;
}
