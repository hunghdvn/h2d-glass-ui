import { useCallback, useMemo, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent, RefObject } from 'react';
import { getFocusables, isReleased } from '../../../internal/focus';
import { isComposing } from '../../../internal/roving';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { ResolvedColumn } from '../engine/columns';
import type { FlatRow } from '../engine/flatten';
import {
  boxOf,
  cellAt,
  GRID_SELECTOR,
  focusInto,
  headRowCount,
  homeOf,
  isFilterPlace,
  isOwn,
} from '../grid-dom';
import type { DataGridKey, DataGridSelectionMode } from '../types';
import {
  createKeyContext,
  detailRowKeys,
  enterKeys,
  groupRowKeys,
  headingKeys,
  moveKeys,
  rowKeys,
  widgetKeys,
} from './grid-keys';
import type { KeyEnv } from './grid-keys';
import { activate, pressCell, pressTwice } from './grid-pointer';
import type { PointerContext } from './grid-pointer';
import { groupsAbove, resolvePlace, samePlace, samePosition } from './grid-place';
import type { ActiveCell, ActivePlace, Position } from './grid-place';
import { useKept } from './use-kept';
import { useReleaseControls } from './use-release-controls';

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
   * Whether the grid has details (`renderDetail`): what a detail draws on its own, a link that comes after
   * a load, is a control of its cell, so the rows' controls are released as a custom cell's are.
   */
  details: boolean;
  /**
   * Whether the grid draws a footer of totals: a row of the keyboard under the last row, reached by `↓`
   * from it. With no row in the list the footer is no place.
   */
  footer: boolean;
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
   * `mod+Shift+↑` and `mod+Shift+↓` on any cell of a data row: moves the row one place (`repeat` is a held
   * key). `undefined` when the grid does not reorder rows, and the keys are not taken.
   */
  onMoveRow: ((key: DataGridKey, step: -1 | 1, repeat: boolean) => void) | undefined;
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
   * Puts the active place on the data row with this key, at the column the place remembers, and gives it the
   * focus when the grid has it; nothing when the row is not in the list.
   */
  focusRow: (key: DataGridKey) => void;
  /**
   * What the active place is, said by the kind and key of its row and the groups it is inside, as of the
   * last commit; `null` before anything was chosen. The same function for as long as the grid lives.
   */
  placeCell: () => ActiveCell | null;
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
  details,
  footer,
  reveal,
  onSortPress,
  onResizeBy,
  onMoveBy,
  onMoveRow,
  onOpenMenu,
  onRowActivate,
  onToggleGroup,
  selection,
}: GridKeyboardOptions<TRow>): GridKeyboard {
  const [position, setPosition] = useState<Position>({ cell: null, index: 0, columnIndex: 0 });
  const headRows = headRowCount(filterRow);
  // The footer is a place only while there is a row for it to stand under, as the empty cell of a
  // filtered grid is the one place of a body with none.
  const footerAt = footer && rows.length > 0 ? rows.length : null;
  const resolved = useMemo(
    () => resolvePlace(position, rows, columns, emptyCell, headRows, footerAt !== null),
    [position, rows, columns, emptyCell, headRows, footerAt],
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
  useReleaseControls(tableRef, hasCustomCells || details);
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
    const element = table ? cellAt(table, pending, latestFooter.current) : null;
    if (element) focusInto(homeOf(element), element);
    setHeld(undefined);
  }, [tableRef]);
  const focusPlace = (target: ActivePlace | null): void => {
    const table = tableRef.current;
    const element = table && target ? cellAt(table, target, footerAt) : null;
    if (element) focusInto(homeOf(element), element);
    else if (target && target.row >= 0 && target.row < rows.length && reveal) {
      pendingFocus.current = target;
      reveal(target.row);
    }
  };
  const latest = useRef(place);
  const latestFooter = useRef(footerAt);
  const latestCell = useRef(position.cell);
  useWriteOnCommit(() => {
    latestCell.current = position.cell;
    latest.current = place;
    latestFooter.current = footerAt;
  });
  const focusActive = useCallback(() => {
    const table = tableRef.current;
    const element =
      table && latest.current ? cellAt(table, latest.current, latestFooter.current) : null;
    if (element) focusInto(homeOf(element), element);
  }, [tableRef]);
  const focusRow = (key: DataGridKey): void => {
    const at = rows.findIndex((row) => row.kind === 'data' && Object.is(row.key, key));
    const column = latest.current?.column;
    if (at < 0 || column === undefined) return;
    const target = { row: at, column };
    choose(target);
    if (focusInside.current) focusPlace(target);
  };
  // What the place is, as of the last commit: the grouping reads it to follow a group that closes.
  const placeCell = useCallback(() => latestCell.current, []);
  const activeHome = useCallback(() => {
    const table = tableRef.current;
    const element =
      table && latest.current ? cellAt(table, latest.current, latestFooter.current) : null;
    return element ? homeOf(element) : null;
  }, [tableRef]);
  // After a commit of the body alone (a scroll moved its window), what a commit of the grid does for
  // the focus. A focus the grid had and lost is given to the active cell, which is always drawn: the
  // row of a focused popup in a cell is not the active one, so a scroll can take it out. And a focus
  // that a key is waiting to give lands on the row now drawn.
  const windowDrawn = useCallback(() => {
    const table = tableRef.current;
    if (focusInside.current && table && !table.contains(document.activeElement)) {
      const element = latest.current ? cellAt(table, latest.current, latestFooter.current) : null;
      if (element) focusInto(homeOf(element), element);
    }
    takePending();
  }, [tableRef, takePending]);

  const choose = (target: ActivePlace): void => {
    const column = columns[target.column];
    const row = rows[target.row];
    if (!column) return;
    const next: Position =
      target.row === footerAt
        ? {
            cell: { area: 'footer', column: column.id },
            index: target.row,
            columnIndex: target.column,
          }
        : target.row >= 0 && !row && emptyCell && rows.length === 0
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
                  groups: groupsAbove(rows, target.row),
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
      } else if (position.cell.area === 'footer' && place.row === footerAt) {
        followed = {
          cell: { area: 'footer', column: column.id },
          index: place.row,
          columnIndex: place.column,
        };
      } else if (row) {
        followed = {
          cell: {
            area: 'body',
            key: row.key,
            kind: row.kind,
            groups: groupsAbove(rows, place.row),
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
    const activeCell = table && place ? cellAt(table, place, footerAt) : null;
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

  // What the presses of the pointer read of this hook; the column is read when a press needs it.
  const pointer: PointerContext<TRow> = {
    rows,
    footerAt,
    choose,
    column: () => latest.current?.column ?? 0,
    onRowActivate,
  };

  // Inside is inside the table's DOM. React sends the focus events of a portal that a cell renders
  // (a third-party popover, a date picker) through the table, though the portal is elsewhere in the
  // DOM: counted as inside, it would have the focus "given back" to the active cell at the next
  // commit, out of the portal's field. The blur of the cell the focus left for the portal said that
  // the focus is out, and a focus or a blur in the portal says nothing more.
  const onFocus = (event: FocusEvent<HTMLTableElement>): void => {
    if (!event.currentTarget.contains(event.target as Node)) return;
    focusInside.current = true;
    if (isOwn(event.target, event.currentTarget)) {
      activate(pointer, event.target as Element, event.currentTarget);
    }
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

  const onMouseDown = (event: MouseEvent<HTMLTableElement>): void => pressCell(pointer, event);
  const onDoubleClick = onRowActivate
    ? (event: MouseEvent<HTMLTableElement>): void => pressTwice(pointer, event)
    : undefined;

  // What the handlers of the keys read: this render's rows and columns, and the actions above.
  const env: KeyEnv<TRow> = {
    rows,
    columns,
    headRows,
    footerAt,
    emptyCell,
    frameRef,
    choose,
    focusPlace,
    setHeld,
    controlsOf,
    reveal,
    onSortPress,
    onResizeBy,
    onMoveBy,
    onMoveRow,
    onOpenMenu,
    onRowActivate,
    onToggleGroup,
    selection,
  };

  // The handlers run in this order, and the first that takes the event ends it: a control of the cell
  // that has the focus, the heading, the rows. What only a bare key or the modifier does comes after.
  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>): void => {
    const table = event.currentTarget;
    if (event.defaultPrevented || isComposing(event) || !isOwn(event.target, table) || !place) {
      return;
    }
    const cell = cellAt(table, place, footerAt);
    if (!cell || !cell.contains(event.target as Element)) return;
    const keys = createKeyContext(env, event, place, cell);
    if (widgetKeys(keys) || headingKeys(keys) || rowKeys(keys)) return;
    if (!keys.bare && !keys.mod) return;
    if (groupRowKeys(keys) || detailRowKeys(keys) || enterKeys(keys)) return;
    moveKeys(keys);
  };

  return {
    active: place,
    held,
    focusActive,
    focusRow,
    placeCell,
    activeHome,
    windowDrawn,
    onKeyDown,
    onFocus,
    onBlur,
    onMouseDown,
    onDoubleClick,
  };
}
