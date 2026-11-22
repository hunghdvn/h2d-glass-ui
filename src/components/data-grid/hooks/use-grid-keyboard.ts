import { useCallback, useMemo, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent, RefObject } from 'react';
import { POPUP_SELECTOR, takesOwnPress } from '../../../internal/controls';
import { getFocusables, isReleased } from '../../../internal/focus';
import { isLetterKey } from '../../../internal/letter-key';
import { isMenuKey } from '../../../internal/menu-key';
import { clamp } from '../../../internal/number';
import { isApplePlatform } from '../../../internal/platform';
import { hasModifier, isComposing } from '../../../internal/roving';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import { isDataColumn } from '../engine/columns';
import type { ResolvedColumn } from '../engine/columns';
import type { FlatRow } from '../engine/flatten';
import { groupKey } from '../engine/group';
import { RESIZE_KEY_STEP } from '../engine/layout';
import { rowsThatFit } from '../engine/virtual';
import {
  addsLevel,
  boxOf,
  cellsOf,
  emptyPlaceOf,
  EMPTY_PLACE_SELECTOR,
  FILTER_VALUE_SELECTOR,
  focusHomeOf,
  GRID_SELECTOR,
  headRowAt,
  headRowCount,
  homeOf,
  isFilterPlace,
  isTitlePlace,
  listIndexOf,
  listRows,
  rowAt,
  rowKind,
  titleRow,
} from '../grid-dom';
import type { DataGridKey, DataGridSelectionMode } from '../types';
import { useKept } from './use-kept';
import { useReleaseControls } from './use-release-controls';

/**
 * Where the keyboard is in the grid: a column title, a cell of the filter row, a cell of a data row or a
 * group row, or the empty cell of a grid whose filter keeps no row, said by what they are and not by where
 * they are drawn (a row's kind and key, and a column id), so a sort, a page, a window or a filter row that
 * comes or goes does not lose the place. A body place holds the keys of the groups its row is inside (for a
 * group row, the groups above it): when its row goes because one of them closed, the place goes to the
 * nearest of them that is still in the list.
 */
export type ActiveCell =
  | { area: 'header'; column: string }
  | { area: 'filter'; column: string }
  | {
      area: 'body';
      key: DataGridKey;
      kind: FlatRow<unknown>['kind'];
      groups: readonly string[];
      column: string;
    }
  | { area: 'empty'; column: string };

/** The keys of the groups a row is inside, the outermost first; for a group row, the groups above it. */
function groupsAbove(row: FlatRow<unknown>): readonly string[] {
  if (row.kind === 'data') return row.groups;
  if (row.kind === 'detail') return [];
  const { path } = row.node;
  return Array.from({ length: path.length - 1 }, (_, at) => groupKey(path.slice(0, at + 1)));
}

/** A row of the list is the row of a place when its kind and its key are: a group key is no data key. */
const isRowOf = (row: FlatRow<unknown> | undefined, cell: { key: DataGridKey; kind: string }) =>
  row !== undefined && row.kind === cell.kind && row.key === cell.key;

/**
 * The active cell as places in the drawn grid: `row` counts the heading rows up from the body (-1 the last
 * heading row, the filter row when there is one, else the titles; -2 the titles when there is a filter row:
 * `isTitlePlace` and `isFilterPlace` say which), else it is an index of `rows`; a grid with no row whose
 * filter is the reason has the one place 0 in its body, its empty cell.
 */
export interface ActivePlace {
  row: number;
  column: number;
}

interface Position {
  /** What was chosen, or `null` before anything was: the first cell of the first row. */
  cell: ActiveCell | null;
  /** The index its row had when last seen, which is where the place goes when the row leaves. */
  index: number;
  /** The index its column had when last seen, which is where the place goes when the column leaves. */
  columnIndex: number;
}

function samePlace(a: ActivePlace | null, b: ActivePlace | null): boolean {
  return a === b || (a !== null && b !== null && a.row === b.row && a.column === b.column);
}

function samePosition(a: Position, b: Position): boolean {
  if (
    a.index !== b.index ||
    a.columnIndex !== b.columnIndex ||
    a.cell?.area !== b.cell?.area ||
    a.cell?.column !== b.cell?.column
  ) {
    return false;
  }
  return (
    a.cell?.area !== 'body' ||
    (b.cell?.area === 'body' && a.cell.key === b.cell.key && a.cell.kind === b.cell.kind)
  );
}

/**
 * The place the position has now. A row that is gone leaves the place at the same index, as far as
 * the rows reach, and at the title of its column when none is left, or at the empty cell when the
 * grid is empty because of its filter (`emptyCell`: the button that clears it is the one place of
 * the body); a column that is gone leaves it at the column now at the index it had, as far as the
 * columns reach (spec phase 6 §3.6). A place in the titles stays in them when a filter row comes or
 * goes, and one in the filter row, when it goes, is the title of its column (`headRows` is how many
 * heading rows there are). Nothing chosen yet is the first cell of the first row, or the empty
 * cell, or the first title; a position at the empty cell, once rows are back, is the first cell of
 * the first row. The row at the index last seen is the one when it has the key: of two rows with
 * the same key (the grid warns), the second is then not taken for the first, which would leave its
 * keys to nobody. A row that is gone because a group closed leaves the place at the nearest of its
 * groups that is still in the list, which is that group's row.
 */
export function resolvePlace(
  position: Position,
  rows: readonly FlatRow<unknown>[],
  columns: readonly { id: string }[],
  emptyCell = false,
  headRows = 1,
): ActivePlace | null {
  if (columns.length === 0) return null;
  const { cell } = position;
  const at = columns.findIndex((candidate) => candidate.id === cell?.column);
  const column = at >= 0 ? at : clamp(position.columnIndex, 0, columns.length - 1);
  if (cell?.area === 'header') return { row: -headRows, column };
  // The filter row is the last heading row; without one that row is the titles, where the place stays.
  if (cell?.area === 'filter') return { row: -1, column };
  if (rows.length === 0) return { row: emptyCell ? 0 : -headRows, column };
  if (cell === null) return { row: 0, column };
  // The empty cell has no column of its own: the rows that come back start at their first cell.
  if (cell.area === 'empty') return { row: 0, column: 0 };
  if (isRowOf(rows[position.index], cell)) return { row: position.index, column };
  const found = rows.findIndex((row) => isRowOf(row, cell));
  if (found >= 0) return { row: found, column };
  for (let at = cell.groups.length - 1; at >= 0; at--) {
    const group = rows.findIndex((row) => row.kind === 'group' && row.key === cell.groups[at]);
    if (group >= 0) return { row: group, column };
  }
  return { row: Math.min(position.index, rows.length - 1), column };
}

/**
 * The element of a place in the drawn grid, `null` where there is none (the row is not drawn): the cell
 * of a data row, the `<tr>` itself for a group row, which is one place for all its cells.
 */
function cellAt(table: HTMLTableElement, place: ActivePlace): HTMLElement | null {
  const row = place.row < 0 ? headRowAt(table, place.row) : rowAt(table, place.row);
  if (row) return rowKind(row) === 'group' ? row : (cellsOf(row)[place.column] ?? null);
  // No row drawn at the place 0: the empty cell of a filtered grid, when that is what is drawn.
  return place.row === 0 ? emptyPlaceOf(table) : null;
}

/**
 * The cell of this table that holds `target`, which may be a control or anything else in it. A cell
 * of a table inside a cell is not this table's, so the search goes up until it is.
 */
function ownCell(target: Element, table: HTMLTableElement): HTMLTableCellElement | null {
  for (
    let cell = target.closest('td, th');
    cell;
    cell = cell.parentElement?.closest('td, th') ?? null
  ) {
    if (cell.closest('table') === table) return cell as HTMLTableCellElement;
  }
  return null;
}

/** Whether an event is this grid's own: not from another grid in a cell, nor from a popup. */
function isOwn(target: EventTarget | null, table: HTMLTableElement): boolean {
  if (!(target instanceof Element) || target.closest(GRID_SELECTOR) !== table) return false;
  const popup = target.closest(POPUP_SELECTOR);
  return popup === null || !table.contains(popup);
}

/**
 * Focuses `element` without the browser scrolling, then scrolls `seen` into view the least it takes:
 * the cell, which is `element` itself unless its box or another control of it has the focus (the row
 * must be in sight, not a box of 16px). The browser's own scroll would leave it under the sticky
 * heading; `scrollIntoView` respects the `scroll-margin-top` a cell of the rows has for it, and a
 * title, which sticks where no padding of the frame is, is scrolled in the frame only sideways while
 * the page around the grid brings it into the window (spec phase 6 §3.6). Never smooth (§3.10).
 */
function focusInto(element: HTMLElement, seen: HTMLElement): void {
  element.focus({ preventScroll: true });
  if (typeof seen.scrollIntoView !== 'function') return;
  // A group row is as wide as the table: it is scrolled into view vertically only, so a frame scrolled
  // sideways keeps its place.
  const frame = seen instanceof HTMLTableRowElement ? seen.closest('.flg-data-grid-frame') : null;
  const left = frame?.scrollLeft;
  seen.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  if (frame && left !== undefined && frame.scrollLeft !== left) frame.scrollLeft = left;
}

/**
 * How many rows a page key moves by from the row at `from`: the rows that fit between the heading and the
 * bottom of the frame, counted over their own heights (`rowsThatFit`: a group row is lower than a data
 * row), and at least one. The height of each kind is read from a row of it that is drawn; a kind that is
 * not drawn (a virtual grid may draw no group row) has the height of the other.
 */
function pageRows<TRow>(
  table: HTMLTableElement,
  frame: HTMLElement | null,
  rows: readonly FlatRow<TRow>[],
  from: number,
  direction: 1 | -1,
): number {
  const drawn = listRows(table);
  const dataHeight = drawn.find((row) => rowKind(row) === 'data')?.offsetHeight ?? 0;
  const groupHeight = drawn.find((row) => rowKind(row) === 'group')?.offsetHeight ?? 0;
  const data = dataHeight || groupHeight;
  const group = groupHeight || dataHeight;
  if (!frame || data === 0) return 1;
  const room = frame.clientHeight - (table.tHead?.offsetHeight ?? 0);
  return rowsThatFit(
    (index) => (rows[index]?.kind === 'group' ? group : data),
    rows.length,
    from,
    direction,
    room,
  );
}

/** Where a key that moves the active cell takes it, or `null` for a key that does not. */
function movedBy(
  key: string,
  mod: boolean,
  place: ActivePlace,
  rowCount: number,
  columnCount: number,
  headRows: number,
  page: (from: number, direction: 1 | -1) => number,
): ActivePlace | null {
  const lastColumn = columnCount - 1;
  switch (key) {
    case 'ArrowLeft':
      return mod ? null : { ...place, column: Math.max(0, place.column - 1) };
    case 'ArrowRight':
      return mod ? null : { ...place, column: Math.min(lastColumn, place.column + 1) };
    case 'ArrowUp':
      return mod ? null : { ...place, row: Math.max(-headRows, place.row - 1) };
    case 'ArrowDown':
      if (mod) return null;
      // Down the heading rows to the first row; past the last row there is nowhere.
      return { ...place, row: Math.min(rowCount - 1, place.row + 1) };
    case 'Home':
      return mod ? (rowCount > 0 ? { row: 0, column: 0 } : place) : { ...place, column: 0 };
    case 'End':
      return mod
        ? rowCount > 0
          ? { row: rowCount - 1, column: lastColumn }
          : place
        : { ...place, column: lastColumn };
    case 'PageDown':
      if (mod) return null;
      // From the heading it is the page's worth of rows below it, which is at least the first.
      return rowCount === 0
        ? place
        : { ...place, row: Math.min(rowCount - 1, place.row + page(place.row, 1)) };
    case 'PageUp':
      if (mod) return null;
      return place.row < 0
        ? place
        : { ...place, row: Math.max(0, place.row - page(place.row, -1)) };
    default:
      return null;
  }
}

export interface GridKeyboardOptions<TRow> {
  tableRef: RefObject<HTMLTableElement | null>;
  frameRef: RefObject<HTMLElement | null>;
  columns: readonly ResolvedColumn<TRow>[];
  /** The rows of the list, in order: not all of them are drawn in a virtual grid. */
  rows: readonly FlatRow<TRow>[];
  /**
   * Whether the grid has no row because of its filter, so that its body holds the button that clears
   * the filter, which is then the one place of the body (spec phase 6 §3.6).
   */
  emptyCell: boolean;
  /** Whether the heading has a filter row under the titles: a place of the keyboard, between them and the rows. */
  filterRow: boolean;
  /**
   * Brings the row at an index of `rows` into the DOM, which a row that is not drawn needs before it
   * can have the focus; `undefined` when every row is drawn.
   */
  reveal?: (index: number) => void;
  /** A press on a title that sorts; `additive` adds a level (Shift+Enter). */
  onSortPress: (columnId: string, additive: boolean) => void;
  /** `Alt+Shift+←` and `Alt+Shift+→` on the title of a data column: changes its width by `delta` pixels. */
  onResizeBy: (columnId: string, delta: number) => void;
  /** `mod+Shift+←` and `mod+Shift+→` on the title of a data column: moves it one place within its zone. */
  onMoveBy: (columnId: string, step: -1 | 1) => void;
  /**
   * `Alt+↓`, `Shift+F10` and the ContextMenu key on the title of a data column: opens the menu of the
   * column.
   */
  onOpenMenu: (columnId: string) => void;
  onRowActivate: ((row: TRow, key: DataGridKey) => void) | undefined;
  /** Opens or closes the group with this key: Enter, → and ← on its row. */
  onToggleGroup: (key: string) => void;
  /** What choosing rows does with a key; `null` when rows cannot be chosen, and no key is taken. */
  selection: {
    mode: DataGridSelectionMode;
    /** Space on the cell of a row (`range`: with Shift). */
    press: (key: DataGridKey, range: boolean) => void;
    /** mod+A. */
    chooseAll: () => void;
  } | null;
}

export interface GridKeyboard {
  /** The active cell as places, for the cells to know which of them is the one Tab stop. */
  active: ActivePlace | null;
  /**
   * The index of the row the keyboard is leaving for one that is not drawn yet, while the focus has
   * not reached the new row: the window keeps it too, so that no commit takes out the element that
   * has the focus (a popover that holds the grid may close when the focus leaves it).
   */
  held: number | undefined;
  /** Focuses the active cell, and scrolls it into view. */
  focusActive: () => void;
  /**
   * What has the focus when the active cell does: the cell, or its box. Read when something that held the
   * focus for a while (the column menu) gives it back, after the commit that may have moved the cell.
   */
  activeHome: () => HTMLElement | null;
  /**
   * For the body of a virtual grid, after a commit that moved its window: gives a focus the grid
   * lost back to the active cell, and focuses the row a key asked to be drawn. The same function for
   * as long as the grid lives.
   */
  windowDrawn: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLTableElement>) => void;
  onFocus: (event: FocusEvent<HTMLTableElement>) => void;
  onBlur: (event: FocusEvent<HTMLTableElement>) => void;
  onMouseDown: (event: MouseEvent<HTMLTableElement>) => void;
  /** Only with a handler to call: the double press on a row. */
  onDoubleClick: ((event: MouseEvent<HTMLTableElement>) => void) | undefined;
}

/**
 * The keyboard of the grid, after the data grid pattern of the APG (spec phase 6 §3.6): one Tab stop,
 * which is the active cell; arrows, Home, End and the page keys move it; Enter and F2 go into a cell
 * that holds controls, where Tab cycles inside the cell until Esc or F2 comes back. A control of a
 * custom cell is taken out of the Tab order so the grid has the one stop, and given back as it was.
 *
 * It owns no press that is not the grid's: an event that something else already took, one that an
 * input method owns, one from a popup in a cell, one from a grid in a cell, and every key a control
 * of a cell is pressed with in widget mode but Tab, Esc and F2 are left alone.
 */
export function useGridKeyboard<TRow>({
  tableRef,
  frameRef,
  columns,
  rows,
  emptyCell,
  filterRow,
  reveal,
  onSortPress,
  onResizeBy,
  onMoveBy,
  onOpenMenu,
  onRowActivate,
  onToggleGroup,
  selection,
}: GridKeyboardOptions<TRow>): GridKeyboard {
  const [position, setPosition] = useState<Position>({ cell: null, index: 0, columnIndex: 0 });
  const headRows = headRowCount(filterRow);
  const resolved = useMemo(
    () => resolvePlace(position, rows, columns, emptyCell, headRows),
    [position, rows, columns, emptyCell, headRows],
  );
  // The place is read by the titles and the rows through a context: new rows that leave it where it is
  // (a filter that keeps the row it was on at the same index) are no change to what reads it.
  const place = useKept(resolved, samePlace);
  const hasCustomCells = columns.some((column) => column.cell !== undefined);

  // Whether the focus is in the table, kept by the focus handlers and not read from the document: a
  // focused element that is removed fires no focusout in Chromium or Firefox, so after a row goes this
  // still says "inside" while the browser has moved the focus to the body.
  const focusInside = useRef(false);

  // The titles hold the sort buttons; the rows hold what a custom cell puts there.
  useReleaseControls(tableRef, hasCustomCells);
  // The controls of a cell, which the grid released from the Tab order: its own keys go through them.
  // A control that another grid released, one in a cell of this one, is that grid's: its keys go
  // through it, and its one stop stands for it here.
  const controlsOf = (cell: HTMLElement) =>
    getFocusables(cell, { released: true }).filter(
      (control) => !isReleased(control) || control.closest(GRID_SELECTOR) === tableRef.current,
    );

  // A place whose row is not drawn yet (a virtual window): it is focused after the commit that draws it.
  const pendingFocus = useRef<ActivePlace | null>(null);
  const [held, setHeld] = useState<number | undefined>(undefined);
  // The row that was brought into the DOM for a key is drawn now: after a commit of the grid, or of
  // the body alone, whose window it is (`windowDrawn`). Once: a row that is still missing is not asked
  // for again, which would be a loop. The focus has then left the row that was held, or there is
  // nothing to move to, so the held row can go.
  const takePending = useCallback(() => {
    const pending = pendingFocus.current;
    if (pending === null) return;
    pendingFocus.current = null;
    const table = tableRef.current;
    const element = table ? cellAt(table, pending) : null;
    if (element) focusInto(homeOf(element), element);
    setHeld(undefined);
  }, [tableRef]);
  const focusPlace = (target: ActivePlace | null): void => {
    const table = tableRef.current;
    const element = table && target ? cellAt(table, target) : null;
    if (element) focusInto(homeOf(element), element);
    else if (target && target.row >= 0 && reveal) {
      pendingFocus.current = target;
      reveal(target.row);
    }
  };
  const latest = useRef(place);
  useWriteOnCommit(() => {
    latest.current = place;
  });
  const focusActive = useCallback(() => {
    const table = tableRef.current;
    const element = table && latest.current ? cellAt(table, latest.current) : null;
    if (element) focusInto(homeOf(element), element);
  }, [tableRef]);
  const activeHome = useCallback(() => {
    const table = tableRef.current;
    const element = table && latest.current ? cellAt(table, latest.current) : null;
    return element ? homeOf(element) : null;
  }, [tableRef]);
  // After a commit of the body alone (a scroll moved its window), what a commit of the grid does for
  // the focus. A focus the grid had and lost is given to the active cell, which is always drawn: the
  // row of a focused popup in a cell is not the active one, so a scroll can take it out. And a focus
  // that a key is waiting to give lands on the row now drawn.
  const windowDrawn = useCallback(() => {
    const table = tableRef.current;
    if (focusInside.current && table && !table.contains(document.activeElement)) {
      const element = latest.current ? cellAt(table, latest.current) : null;
      if (element) focusInto(homeOf(element), element);
    }
    takePending();
  }, [tableRef, takePending]);

  const choose = (target: ActivePlace): void => {
    const column = columns[target.column];
    const row = rows[target.row];
    if (!column) return;
    const next: Position =
      target.row >= 0 && !row && emptyCell && rows.length === 0
        ? {
            cell: { area: 'empty', column: column.id },
            index: 0,
            columnIndex: target.column,
          }
        : target.row < 0 || !row
          ? {
              cell: {
                area: isFilterPlace(target.row, headRows) ? 'filter' : 'header',
                column: column.id,
              },
              index: position.index,
              columnIndex: target.column,
            }
          : {
              cell: {
                area: 'body',
                key: row.key,
                kind: row.kind,
                groups: groupsAbove(row),
                column: column.id,
              },
              index: target.row,
              columnIndex: target.column,
            };
    // A focus that lands on the cell that is active already is no change, and no render.
    setPosition((current) => (samePosition(current, next) ? current : next));
  };

  // The position follows its row and its column: the key and the id stay, and the indexes are where
  // they are now, which is where the place goes if the row or the column leaves. When one has already
  // left, the place is the row or the column now at its index, and that is what is kept. After the
  // commit, a focus the removal dropped is given back.
  useIsoLayoutEffect(() => {
    const table = tableRef.current;
    const column = place ? columns[place.column] : undefined;
    if (place && column && position.cell) {
      const row = place.row >= 0 ? rows[place.row] : undefined;
      let followed: Position | null = null;
      if (position.cell.area === 'header' || position.cell.area === 'filter') {
        // A place in the filter row is the title's when the row goes, and the other way round never: a
        // title stays a title when a row comes.
        followed = {
          cell: {
            area: isFilterPlace(place.row, headRows) ? 'filter' : 'header',
            column: column.id,
          },
          index: position.index,
          columnIndex: place.column,
        };
      } else if (row) {
        followed = {
          cell: {
            area: 'body',
            key: row.key,
            kind: row.kind,
            groups: groupsAbove(row),
            column: column.id,
          },
          index: place.row,
          columnIndex: place.column,
        };
      }
      if (followed && !samePosition(position, followed)) setPosition(followed);
    }
    // The focus was in the grid and is not any more, which a removed row does: give it to the place.
    if (focusInside.current && table && !table.contains(document.activeElement)) focusPlace(place);
    // The home of the active cell changed under the focus: the box in the title turned enabled while
    // the title had the focus (the rows came), or disabled while the box had it (the rows went; every
    // engine keeps the focus on a control that turns disabled for a frame or more, then blurs it to
    // the body). The keys are read from the home, so the focus goes there; the cell is where it was,
    // so nothing scrolls. Only the two places a home can be are moved from: the cell and its box. A
    // control of a custom cell with the focus (widget mode) is not a home, and keeps it.
    const focused = document.activeElement;
    const activeCell = table && place ? cellAt(table, place) : null;
    if (
      activeCell &&
      focused &&
      (focused === activeCell ||
        (activeCell instanceof HTMLTableCellElement && focused === boxOf(activeCell)))
    ) {
      const home = homeOf(activeCell);
      if (focused !== home) home.focus({ preventScroll: true });
    }
    takePending();
  });

  const activate = (target: Element, table: HTMLTableElement): void => {
    // A group row is one place, whichever part of it is pressed or has the focus: the column stays.
    const groupRow = target.closest('tr.flg-data-grid-group-row');
    if (groupRow && groupRow.closest(GRID_SELECTOR) === table) {
      const tr = groupRow as HTMLTableRowElement;
      choose({
        row: listIndexOf(tr, listRows(table).indexOf(tr)),
        column: latest.current?.column ?? 0,
      });
      return;
    }
    const cell = ownCell(target, table);
    // The empty cell of a filtered grid is the one place of the body, whichever part of it is pressed.
    if (cell?.matches(EMPTY_PLACE_SELECTOR)) {
      choose({ row: 0, column: latest.current?.column ?? 0 });
      return;
    }
    if (!cell?.matches('.flg-data-grid-head, .flg-data-grid-filter-cell, .flg-data-grid-cell'))
      return;
    const tr = cell.parentElement as HTMLTableRowElement;
    const heading = table.tHead ? Array.from(table.tHead.rows).indexOf(tr) : -1;
    const inHead = heading >= 0;
    const drawn = inHead ? -1 : listRows(table).indexOf(tr);
    if (drawn < 0 && !inHead) return;
    // A heading row's place counts up from the body: the last row of the heading is -1.
    const index = inHead ? heading - table.tHead!.rows.length : listIndexOf(tr, drawn);
    choose({ row: index, column: cellsOf(tr).indexOf(cell) });
  };

  // Inside is inside the table's DOM. React sends the focus events of a portal that a cell renders
  // (a third-party popover, a date picker) through the table, though the portal is elsewhere in the
  // DOM: counted as inside, it would have the focus "given back" to the active cell at the next
  // commit, out of the portal's field. The blur of the cell the focus left for the portal said that
  // the focus is out, and a focus or a blur in the portal says nothing more.
  const onFocus = (event: FocusEvent<HTMLTableElement>): void => {
    if (!event.currentTarget.contains(event.target as Node)) return;
    focusInside.current = true;
    if (isOwn(event.target, event.currentTarget)) activate(event.target, event.currentTarget);
  };

  const onBlur = (event: FocusEvent<HTMLTableElement>): void => {
    const table = event.currentTarget;
    const target = event.target as Node;
    if (target.isConnected && !table.contains(target)) return;
    const next = event.relatedTarget;
    // Moving inside the grid, or a node being removed (which some engines report with no target to
    // go to), is not leaving it.
    if (next instanceof Node && table.contains(next)) return;
    if (next === null && !target.isConnected) return;
    focusInside.current = false;
  };

  // A browser that does not focus a button it is pressed on (Safari) says nothing to `onFocus`,
  // so the press makes its cell active here. Where the browser would put the focus is then held
  // to the rule of a press (spec phase 6 §3.6): after it the focus is on the home of the active
  // cell. A control of a cell keeps its own press, and one that a part already took (the sort
  // button, a row's Shift press) is left as that part left it. A press on the cell of a box, beside
  // the box, would focus the cell, which is not its home; a press with Shift or the modifier on a
  // title would start a text selection: both are cancelled and give the focus to the home. A press
  // on the filler column does nothing, and the focus stays: the frame's `tabindex` would take it.
  const onMouseDown = (event: MouseEvent<HTMLTableElement>): void => {
    const table = event.currentTarget;
    if (!isOwn(event.target, table)) return;
    const target = event.target as Element;
    activate(target, table);
    if (event.button !== 0 || event.defaultPrevented) return;
    const cell = ownCell(target, table);
    if (!cell || takesOwnPress({ target, currentTarget: cell })) return;
    if (cell.classList.contains('flg-data-grid-filler')) {
      event.preventDefault();
      return;
    }
    const onTitles = cell.parentElement === titleRow(table);
    if (homeOf(cell) !== cell || (onTitles && addsLevel(event))) {
      event.preventDefault();
      focusHomeOf(cell);
    }
  };

  const onDoubleClick = onRowActivate
    ? (event: MouseEvent<HTMLTableElement>): void => {
        const table = event.currentTarget;
        if (!isOwn(event.target, table)) return;
        const cell = ownCell(event.target as Element, table);
        if (!cell?.matches('.flg-data-grid-cell')) return;
        // The cell is what is pressed: a control in it takes the press, but the cell itself, which is
        // the Tab stop (`tabindex="0"`) when active, is no control of its row.
        if (takesOwnPress({ target: event.target, currentTarget: cell })) return;
        const drawnRow = cell.parentElement as HTMLTableRowElement;
        const row = rows[listIndexOf(drawnRow, listRows(table).indexOf(drawnRow))];
        if (row?.kind === 'data') onRowActivate(row.row, row.key);
      }
    : undefined;

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>): void => {
    const table = event.currentTarget;
    if (event.defaultPrevented || isComposing(event) || !isOwn(event.target, table) || !place) {
      return;
    }
    const cell = cellAt(table, place);
    const target = event.target as Element;
    if (!cell || !cell.contains(target)) return;
    const handled = (): void => event.preventDefault();
    const home = homeOf(cell);

    // A control of the cell has the focus: the keys are its own, but for Tab, Esc and F2.
    if (target !== home) {
      if (hasModifier(event)) return;
      // A control whose popup is open (a Select) keeps Esc, which the browser answers by closing the
      // popup and which no handler cancels; the next Esc is the grid's.
      const popupOpen = target.closest('[aria-expanded="true"]');
      if (event.key === 'Escape' ? !(popupOpen && cell.contains(popupOpen)) : event.key === 'F2') {
        handled();
        focusInto(home, cell);
      } else if (event.key === 'Tab') {
        const controls = controlsOf(cell);
        const at = controls.findIndex((control) => control === target || control.contains(target));
        if (controls.length === 0 || at < 0) return;
        handled();
        const next = controls[(at + (event.shiftKey ? controls.length - 1 : 1)) % controls.length]!;
        focusInto(next, cell);
      }
      return;
    }

    const modifier = isApplePlatform() ? event.metaKey : event.ctrlKey;
    const otherModifier = isApplePlatform() ? event.ctrlKey : event.metaKey;
    const mod = modifier && !otherModifier && !event.altKey && !event.shiftKey;
    const bare = !hasModifier(event) && !event.shiftKey;

    // The titles have the keys of the columns; the filter row, which is no title, has none of them.
    const onTitle = isTitlePlace(place.row, headRows);
    const onFilter = isFilterPlace(place.row, headRows);

    // Enter on a title sorts, and Shift+Enter keeps the other columns' sort and adds this one. The
    // box in the title of the column of boxes is its home and its one control: Enter presses it, as
    // it presses the box of a row, and Shift+Enter does nothing there.
    if (event.key === 'Enter' && onTitle && !hasModifier(event)) {
      if (home !== cell) {
        if (event.shiftKey) return;
        handled();
        home.click();
        return;
      }
      const column = columns[place.column]!;
      if (!column.allowSorting) return;
      handled();
      onSortPress(column.id, event.shiftKey);
      return;
    }
    // Space has no job on a cell of the heading (Enter sorts a title, and a filter cell has no key of its
    // own): it is cancelled, or the browser scrolls the frame or the page a screen down with it. The title
    // of the column of boxes is not one: its box is the home and the target, and keeps Space, which
    // presses it.
    if (event.key === ' ' && place.row < 0 && home === cell && !hasModifier(event)) {
      handled();
      return;
    }

    // Choosing rows: Space on the cell of a row chooses it (Shift: the range to it), and mod+A every row
    // of the scope, from any cell of the grid, the titles too. A box that has the focus is the cell's
    // own target, so these are its keys too; the title's box is a control of its own and keeps Space.
    // In a grid with no row, mod+A on a title is cancelled and does nothing else: there is nothing to
    // choose, and nothing to say.
    const row = place.row >= 0 ? rows[place.row] : undefined;
    if (selection?.mode === 'multiple' && mod && isLetterKey(event, 'a')) {
      handled();
      if (rows.length > 0) selection.chooseAll();
      return;
    }
    // Space has no job on a group row, and is cancelled, or the browser scrolls a screen down with it.
    if (row?.kind === 'group' && event.key === ' ' && !hasModifier(event)) {
      handled();
      return;
    }
    if (selection && row?.kind === 'data' && event.key === ' ' && !hasModifier(event)) {
      handled();
      selection.press(row.key, event.shiftKey && selection.mode === 'multiple');
      return;
    }
    // The keys of the columns, on the title of a data column (the column of boxes has none). Each one
    // is cancelled where it does nothing too, a column that cannot be resized for one, so the browser
    // does nothing with it either (Alt+Shift+arrow selects text in some of them).
    const column = columns[place.column]!;
    if (
      onTitle &&
      isDataColumn(column) &&
      event.altKey &&
      event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      handled();
      onResizeBy(column.id, event.key === 'ArrowLeft' ? -RESIZE_KEY_STEP : RESIZE_KEY_STEP);
      return;
    }
    if (
      onTitle &&
      isDataColumn(column) &&
      modifier &&
      !otherModifier &&
      !event.altKey &&
      event.shiftKey &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      handled();
      onMoveBy(column.id, event.key === 'ArrowLeft' ? -1 : 1);
      return;
    }
    // The menu of the column: `Alt+↓`, `Shift+F10` and the ContextMenu key. Cancelled where the column has
    // no menu too, and a held key opens it once.
    if (
      onTitle &&
      isDataColumn(column) &&
      (isMenuKey(event) ||
        (event.key === 'ArrowDown' &&
          event.altKey &&
          !event.shiftKey &&
          !event.ctrlKey &&
          !event.metaKey))
    ) {
      handled();
      if (!event.repeat) onOpenMenu(column.id);
      return;
    }
    if (!bare && !mod) return;

    // The keys of a group row (the tree grid pattern of the APG): Enter toggles it, → opens a closed one
    // or goes to its first row, ← closes an open one or goes to the group above, Home and End go to the
    // first and the last row of the list. The column the place remembers never changes on a group row.
    if (row?.kind === 'group' && bare) {
      const to = (at: number): void => {
        const target = { row: at, column: place.column };
        if (reveal && !rowAt(table, at)) setHeld(place.row);
        choose(target);
        focusPlace(target);
      };
      if (event.key === 'Enter') {
        handled();
        onToggleGroup(row.key);
        return;
      }
      if (event.key === 'ArrowRight') {
        handled();
        if (!row.expanded) onToggleGroup(row.key);
        else if (rows[place.row + 1]) to(place.row + 1);
        return;
      }
      if (event.key === 'ArrowLeft') {
        handled();
        if (row.expanded) {
          onToggleGroup(row.key);
          return;
        }
        for (let at = place.row - 1; at >= 0; at--) {
          const above = rows[at]!;
          if (above.kind === 'group' && above.level < row.level) {
            to(at);
            return;
          }
        }
        return;
      }
      if (event.key === 'Home' || event.key === 'End') {
        handled();
        const at = event.key === 'Home' ? 0 : rows.length - 1;
        if (at !== place.row) to(at);
        return;
      }
    }

    if (event.key === 'Enter' || event.key === 'F2') {
      if (!bare) return;
      // The box of a cell is its one control, and Enter presses it as it would a button.
      if (home !== cell && event.key === 'Enter') {
        handled();
        home.click();
        return;
      }
      const controls = controlsOf(cell);
      // A filter cell goes into its value, the input or the Select, and not into the operator button that
      // comes before the input: the operator is one Tab away.
      const first = onFilter
        ? (controls.find((control) => control.matches(FILTER_VALUE_SELECTOR)) ?? controls[0])
        : controls[0];
      if (first) {
        handled();
        focusInto(first, cell);
      } else if (event.key === 'Enter' && place.row >= 0 && onRowActivate) {
        const row = rows[place.row]!;
        handled();
        // A group row is handled above, and a detail row, which master-detail adds later, has no row to activate.
        if (row.kind === 'data') onRowActivate(row.row, row.key);
      }
      return;
    }

    // The empty cell is one cell across every column: ↑ goes back to the title of the column the place
    // was at, and the keys that move along a row have nowhere to go.
    const onEmpty = rows.length === 0 && place.row === 0;
    const moved = movedBy(
      event.key,
      mod,
      place,
      rows.length === 0 && emptyCell ? 1 : rows.length,
      columns.length,
      headRows,
      (from, direction) => pageRows(table, frameRef.current, rows, from, direction),
    );
    const next = moved && onEmpty ? { ...moved, column: place.column } : moved;
    if (!next) return;
    handled();
    if (next.row !== place.row || next.column !== place.column) {
      // The row the focus is on stays drawn until it has moved, which for a row that is not drawn yet
      // is after the commit that draws it.
      const table = tableRef.current;
      if (reveal && place.row >= 0 && next.row >= 0 && table && !rowAt(table, next.row)) {
        setHeld(place.row);
      }
      choose(next);
      focusPlace(next);
    }
  };

  return {
    active: place,
    held,
    focusActive,
    activeHome,
    windowDrawn,
    onKeyDown,
    onFocus,
    onBlur,
    onMouseDown,
    onDoubleClick,
  };
}
