import { createContext, useContext } from 'react';
import type { PointerEvent } from 'react';
import type { ResolvedColumn } from './engine/columns';
import type { PinPlace } from './engine/layout';
import type { FlatRow } from './engine/flatten';
import type { ScopeState } from './engine/selection';
import type { ColumnMenuControl } from './hooks/use-column-menu';
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

/**
 * What the parts of one grid share. Internal: nothing of it is exported. It holds no row of the
 * list (`RowsContext`), so a new `data` does not change it, and a row whose own props are the same
 * does not draw again.
 */
export interface GridContextValue<TRow = unknown> {
  columns: readonly ResolvedColumn<TRow>[];
  /**
   * Whether the rows end in a cell of the filler column: every column has a width, and the frame
   * has not been measured or has room enough beyond them for it (`useColumnWidths`).
   */
  filler: boolean;
  /** Where the filler column goes among `columns`: before the right zone, else at the end. */
  fillerAt: number;
  /**
   * Where each of `columns` sticks: the side, whether it is next to the middle, and the style that
   * sticks it; `undefined` for a column in the middle. A change of a pin draws the rows once, which it
   * must: their cells change. A width is not here (it is the table's).
   */
  pins: readonly (PinPlace | undefined)[];
  labels: DataGridLabels;
  variant: TableVariant;
  /** The grid's `locale`: the filter row reads and writes its numbers and days by it. */
  locale: string;
  /** Whether the heading has a filter row under the titles: its rows count on from two heading rows. */
  filterRow: boolean;
  /** Whether the grid is virtual: its rows say their place in the list with `aria-rowindex`. */
  virtual: boolean;
  /** How many skeleton rows are drawn: as many as a page holds, and at most 20. */
  skeletonRows: number;
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
  /**
   * What the handle of a title does about resizing: the press that may become a drag, and the double
   * press that fits the column. Two functions that are the same for as long as the grid lives, so a
   * resize does not change this context and draws no row.
   */
  resize: {
    onPointerDown: (event: PointerEvent<HTMLElement>, columnId: string) => void;
    onDoubleClick: (columnId: string) => void;
  };
  /**
   * What a title does about being dragged to another place: the press that may become a drag. The same
   * function for as long as the grid lives.
   */
  reorder: {
    onPointerDown: (event: PointerEvent<HTMLElement>, columnId: string) => void;
  };
  /**
   * The one menu of the columns (spec phase 6 §6.3): its state, which only the buttons of the titles and
   * the menu read, the functions that open and close it, which are the same for as long as the grid
   * lives, and whether the last data column shown is not the only one (the one that is cannot be hidden,
   * so the menus that had only "Hide" have none).
   */
  menu: Pick<ColumnMenuControl, 'store' | 'open' | 'close' | 'onPointerDown' | 'onContextMenu'> & {
    /** The id of the menu's element, which the open button points at. */
    contentId: string;
    hideable: boolean;
  };
  /**
   * The id of the column that is being dragged, dimmed in the heading and in every row; `null` when no
   * drag is in flight. It changes twice in a drag, at its start and at its end, and nothing the rows
   * read changes in between: they draw at those two moments and not for a move of the pointer.
   */
  dragSource: string | null;
}

/**
 * The rows the body draws. Apart from the rest, as a new `data` changes it: only the body reads it,
 * and passes each row its own row, which stays the same object when the row did not change.
 */
export interface RowsContextValue<TRow = unknown> {
  /**
   * The rows of the list, in order: the page, or in a virtual grid every row, of which only the
   * window (`VirtualContext`) is drawn.
   */
  rows: readonly FlatRow<TRow>[];
  /** A unique React key for each of `rows`, in the same order. */
  rowReactKeys: readonly string[];
  /**
   * What stands in the place of the rows when there are none: skeleton rows while the grid loads, the
   * words of an empty grid when it does not, `null` when there are rows.
   */
  placeholder: 'skeleton' | 'empty' | null;
}

export const RowsContext = createContext<RowsContextValue>({
  rows: [],
  rowReactKeys: [],
  placeholder: 'empty',
});

const NONE_CHOSEN: SelectionView = {
  chosen: new Set<DataGridKey>(),
  header: { checked: false, indeterminate: false, disabled: true } satisfies ScopeState,
};

/** What is chosen, apart from the rest: only the rows that read it, and the title, draw for a change. */
export const SelectionViewContext = createContext<SelectionView>(NONE_CHOSEN);

/**
 * The one cell with `tabindex="0"`: `row` is negative for a cell of the heading (-1 the last heading row, the
 * filter row when there is one; see `isTitlePlace`), else an index of `rows`. Apart from the
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
