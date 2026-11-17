import { useCallback, useMemo, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent, RefObject } from 'react';
import { POPUP_SELECTOR, takesOwnPress } from '../../../internal/controls';
import { getFocusables, getTabbableKinds } from '../../../internal/focus';
import { isApplePlatform } from '../../../internal/platform';
import { hasModifier, isComposing } from '../../../internal/roving';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { useWriteOnCommit } from '../../../internal/use-write-on-commit';
import type { ResolvedColumn } from '../engine/columns';
import type { FlatRow } from '../engine/flatten';
import type { DataGridKey } from '../types';

/**
 * Where the keyboard is in the grid: a column title, or a cell of a row, said by what they are and
 * not by where they are drawn (a row key and a column id), so a sort, a page or a window that moves
 * the row does not lose the place.
 */
export type ActiveCell =
  { area: 'header'; column: string } | { area: 'body'; key: DataGridKey; column: string };

/** The active cell as places in the drawn grid: `row` is -1 for the titles, else an index of `rows`. */
export interface ActivePlace {
  row: number;
  column: number;
}

interface Position {
  /** What was chosen, or `null` before anything was: the first cell of the first row. */
  cell: ActiveCell | null;
  /** The index its row had when last seen, which is where the place goes when the row leaves. */
  index: number;
}

function samePosition(a: Position, b: Position): boolean {
  if (a.index !== b.index || a.cell?.area !== b.cell?.area || a.cell?.column !== b.cell?.column) {
    return false;
  }
  return a.cell?.area !== 'body' || (b.cell?.area === 'body' && a.cell.key === b.cell.key);
}

/**
 * The place the position has now. A row that is gone leaves the place at the same index, as far as
 * the rows reach, and at the title of its column when none is left; a column that is gone leaves it
 * in the first. Nothing chosen yet is the first cell of the first row, or the first title.
 */
export function resolvePlace(
  position: Position,
  rows: readonly FlatRow<unknown>[],
  columns: readonly { id: string }[],
): ActivePlace | null {
  if (columns.length === 0) return null;
  const { cell } = position;
  const column = Math.max(
    0,
    columns.findIndex((candidate) => candidate.id === cell?.column),
  );
  if (cell?.area === 'header' || rows.length === 0) return { row: -1, column };
  if (cell === null) return { row: 0, column };
  const found = rows.findIndex((row) => row.key === cell.key);
  return { row: found >= 0 ? found : Math.min(position.index, rows.length - 1), column };
}

/** The cell of a place in the drawn grid, `null` where there is none (the row is not drawn). */
function cellAt(table: HTMLTableElement, place: ActivePlace): HTMLTableCellElement | null {
  const row = place.row < 0 ? table.tHead?.rows[0] : dataRows(table)[place.row];
  return row?.cells[place.column] ?? null;
}

/** The rows of data, in order: the other rows of the body (the spacers of a window) are not these. */
function dataRows(table: HTMLTableElement): HTMLTableRowElement[] {
  return Array.from(table.tBodies[0]?.rows ?? []).filter((row) =>
    row.classList.contains('flg-data-grid-row'),
  );
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
  if (!(target instanceof Element) || target.closest('table[role="grid"]') !== table) return false;
  const popup = target.closest(POPUP_SELECTOR);
  return popup === null || !table.contains(popup);
}

/**
 * Focuses `element` without the browser scrolling, then scrolls it into view the least it takes:
 * the browser's own scroll would leave it under the sticky heading, and `scrollIntoView` respects
 * the `scroll-padding` the frame has for it. Never smooth (spec phase 6 §3.10).
 */
function focusInto(element: HTMLElement): void {
  element.focus({ preventScroll: true });
  if (typeof element.scrollIntoView === 'function') {
    element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

/** How many rows the frame shows under the heading, and at least one. */
function pageRows(table: HTMLTableElement, frame: HTMLElement | null): number {
  const row = dataRows(table)[0]?.offsetHeight ?? 0;
  if (!frame || row === 0) return 1;
  return Math.max(1, Math.floor((frame.clientHeight - (table.tHead?.offsetHeight ?? 0)) / row));
}

/** Where a key that moves the active cell takes it, or `null` for a key that does not. */
function movedBy(
  key: string,
  mod: boolean,
  place: ActivePlace,
  rowCount: number,
  columnCount: number,
  page: () => number,
): ActivePlace | null {
  const lastColumn = columnCount - 1;
  switch (key) {
    case 'ArrowLeft':
      return mod ? null : { ...place, column: Math.max(0, place.column - 1) };
    case 'ArrowRight':
      return mod ? null : { ...place, column: Math.min(lastColumn, place.column + 1) };
    case 'ArrowUp':
      return mod ? null : { ...place, row: Math.max(-1, place.row - 1) };
    case 'ArrowDown':
      if (mod) return null;
      // From the titles to the first row; past the last row there is nowhere.
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
      // From the titles it is the page's worth of rows below them, which is at least the first.
      return rowCount === 0 ? place : { ...place, row: Math.min(rowCount - 1, place.row + page()) };
    case 'PageUp':
      if (mod) return null;
      return place.row < 0 ? place : { ...place, row: Math.max(0, place.row - page()) };
    default:
      return null;
  }
}

export interface GridKeyboardOptions<TRow> {
  tableRef: RefObject<HTMLTableElement | null>;
  frameRef: RefObject<HTMLElement | null>;
  columns: readonly ResolvedColumn<TRow>[];
  /** The rows that are drawn, in order. */
  rows: readonly FlatRow<TRow>[];
  /** A press on a title that sorts; `additive` adds a level (Shift+Enter). */
  onSortPress: (columnId: string, additive: boolean) => void;
  onRowActivate: ((row: TRow, key: DataGridKey) => void) | undefined;
}

export interface GridKeyboard {
  /** The active cell as places, for the cells to know which of them is the one Tab stop. */
  active: ActivePlace | null;
  /** Focuses the active cell, and scrolls it into view. */
  focusActive: () => void;
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
  onSortPress,
  onRowActivate,
}: GridKeyboardOptions<TRow>): GridKeyboard {
  const [position, setPosition] = useState<Position>({ cell: null, index: 0 });
  const place = useMemo(() => resolvePlace(position, rows, columns), [position, rows, columns]);
  const hasCustomCells = columns.some((column) => column.cell !== undefined);

  // Whether the focus is in the table, kept by the focus handlers and not read from the document: a
  // focused element that is removed fires no focusout in Chromium or Firefox, so after a row goes this
  // still says "inside" while the browser has moved the focus to the body.
  const focusInside = useRef(false);

  // The controls this grid took out of the Tab order, with the `tabindex` each had.
  const released = useRef(new Map<HTMLElement, string | null>());
  useIsoLayoutEffect(() => {
    const map = released.current;
    return () => {
      for (const [element, tabindex] of map) {
        // A caller that set another value since is not undone.
        if (element.getAttribute('tabindex') !== '-1') continue;
        if (tabindex === null) element.removeAttribute('tabindex');
        else element.setAttribute('tabindex', tabindex);
      }
      map.clear();
    };
  }, []);
  useIsoLayoutEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const map = released.current;
    for (const element of map.keys()) if (!element.isConnected) map.delete(element);
    // The titles hold the sort buttons; the rows hold what a custom cell puts there.
    const sections = [table.tHead, ...(hasCustomCells ? Array.from(table.tBodies) : [])];
    for (const section of sections) {
      if (!section) continue;
      for (const element of getTabbableKinds(section)) {
        // A cell is the stop and not a control of it, and a grid in a cell keeps its own stop.
        if (element instanceof HTMLTableCellElement && element.closest('table') === table) continue;
        if (element.closest('table[role="grid"]') !== table) continue;
        map.set(element, element.getAttribute('tabindex'));
        element.setAttribute('tabindex', '-1');
      }
    }
  });
  const controlsOf = (cell: HTMLElement) => getFocusables(cell, released.current);

  const focusPlace = (target: ActivePlace | null): void => {
    const table = tableRef.current;
    const element = table && target ? cellAt(table, target) : null;
    if (element) focusInto(element);
  };
  const latest = useRef(place);
  useWriteOnCommit(() => {
    latest.current = place;
  });
  const focusActive = useCallback(() => {
    const table = tableRef.current;
    const element = table && latest.current ? cellAt(table, latest.current) : null;
    if (element) focusInto(element);
  }, [tableRef]);

  const choose = (target: ActivePlace): void => {
    const column = columns[target.column];
    const row = rows[target.row];
    if (!column) return;
    const next: Position =
      target.row < 0 || !row
        ? { cell: { area: 'header', column: column.id }, index: position.index }
        : { cell: { area: 'body', key: row.key, column: column.id }, index: target.row };
    // A focus that lands on the cell that is active already is no change, and no render.
    setPosition((current) => (samePosition(current, next) ? current : next));
  };

  // The position follows its row: the key stays and the index is where the row is now, which is where
  // the place goes if the row leaves. When the row has already left, the place is the row now at its
  // index, and that is what is kept. After the commit, a focus the removal dropped is given back.
  useIsoLayoutEffect(() => {
    const table = tableRef.current;
    if (place && place.row >= 0 && position.cell?.area === 'body') {
      const row = rows[place.row]!;
      const column = columns[place.column]!;
      if (
        position.cell.key !== row.key ||
        position.cell.column !== column.id ||
        position.index !== place.row
      ) {
        setPosition({
          cell: { area: 'body', key: row.key, column: column.id },
          index: place.row,
        });
      }
    }
    // The focus was in the grid and is not any more, which a removed row does: give it to the place.
    if (focusInside.current && table && !table.contains(document.activeElement)) focusPlace(place);
  });

  const activate = (target: Element, table: HTMLTableElement): void => {
    const cell = ownCell(target, table);
    if (!cell?.matches('.flg-data-grid-head, .flg-data-grid-cell')) return;
    const inHead = cell.parentElement?.parentElement === table.tHead;
    const index = inHead ? -1 : dataRows(table).indexOf(cell.parentElement as HTMLTableRowElement);
    if (index < 0 && !inHead) return;
    choose({ row: index, column: cell.cellIndex });
  };

  const onFocus = (event: FocusEvent<HTMLTableElement>): void => {
    focusInside.current = true;
    if (isOwn(event.target, event.currentTarget)) activate(event.target, event.currentTarget);
  };

  const onBlur = (event: FocusEvent<HTMLTableElement>): void => {
    const next = event.relatedTarget;
    // Moving inside the grid, or a node being removed (which some engines report with no target to
    // go to), is not leaving it.
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    if (next === null && !(event.target as Node).isConnected) return;
    focusInside.current = false;
  };

  // A browser that does not focus a button it is pressed on (Safari) says nothing to `onFocus`.
  const onMouseDown = (event: MouseEvent<HTMLTableElement>): void => {
    if (isOwn(event.target, event.currentTarget))
      activate(event.target as Element, event.currentTarget);
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
        const row = rows[dataRows(table).indexOf(cell.parentElement as HTMLTableRowElement)];
        if (row) onRowActivate(row.row, row.key);
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

    // A control of the cell has the focus: the keys are its own, but for Tab, Esc and F2.
    if (target !== cell) {
      if (hasModifier(event)) return;
      // A control whose popup is open (a Select) keeps Esc, which the browser answers by closing the
      // popup and which no handler cancels; the next Esc is the grid's.
      const popupOpen = target.closest('[aria-expanded="true"]');
      if (event.key === 'Escape' ? !(popupOpen && cell.contains(popupOpen)) : event.key === 'F2') {
        handled();
        focusInto(cell);
      } else if (event.key === 'Tab') {
        const controls = controlsOf(cell);
        const at = controls.findIndex((control) => control === target || control.contains(target));
        if (controls.length === 0 || at < 0) return;
        handled();
        focusInto(controls[(at + (event.shiftKey ? controls.length - 1 : 1)) % controls.length]!);
      }
      return;
    }

    const modifier = isApplePlatform() ? event.metaKey : event.ctrlKey;
    const otherModifier = isApplePlatform() ? event.ctrlKey : event.metaKey;
    const mod = modifier && !otherModifier && !event.altKey && !event.shiftKey;
    const bare = !hasModifier(event) && !event.shiftKey;

    // Enter on a title sorts, and Shift+Enter keeps the other columns' sort and adds this one.
    if (event.key === 'Enter' && place.row < 0 && !hasModifier(event)) {
      const column = columns[place.column]!;
      if (!column.allowSorting) return;
      handled();
      onSortPress(column.id, event.shiftKey);
      return;
    }
    if (!bare && !mod) return;

    if (event.key === 'Enter' || event.key === 'F2') {
      if (!bare) return;
      const controls = controlsOf(cell);
      if (controls.length > 0) {
        handled();
        focusInto(controls[0]!);
      } else if (event.key === 'Enter' && place.row >= 0 && onRowActivate) {
        const row = rows[place.row]!;
        handled();
        onRowActivate(row.row, row.key);
      }
      return;
    }

    const next = movedBy(event.key, mod, place, rows.length, columns.length, () =>
      pageRows(table, frameRef.current),
    );
    if (!next) return;
    handled();
    if (next.row !== place.row || next.column !== place.column) {
      choose(next);
      focusPlace(next);
    }
  };

  return { active: place, focusActive, onKeyDown, onFocus, onBlur, onMouseDown, onDoubleClick };
}
