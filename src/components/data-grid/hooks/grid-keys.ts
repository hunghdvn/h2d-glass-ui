import type { Dispatch, KeyboardEvent, RefObject, SetStateAction } from 'react';
import { isLetterKey } from '../../../internal/letter-key';
import { isMenuKey } from '../../../internal/menu-key';
import { isApplePlatform } from '../../../internal/platform';
import { hasModifier } from '../../../internal/roving';
import { isDataColumn } from '../engine/columns';
import type { ResolvedColumn } from '../engine/columns';
import type { FlatRow } from '../engine/flatten';
import { RESIZE_KEY_STEP } from '../engine/layout';
import {
  FILTER_VALUE_SELECTOR,
  focusInto,
  homeOf,
  isFilterPlace,
  isTitlePlace,
  rowAt,
} from '../grid-dom';
import type { DataGridKey, DataGridSelectionMode } from '../types';
import type { ActivePlace } from './grid-place';
import { movedBy, pageStepRows } from './key-moves';

/**
 * What the keyboard hook hands to the handlers of the keys: the rows and the columns as they are in this
 * render, the actions a key may take (the hook's own, which read the latest place as the keyboard always
 * did) and the callbacks the grid was given. The same closures the keys used when `onKeyDown` held them.
 */
export interface KeyEnv<TRow> {
  rows: readonly FlatRow<TRow>[];
  columns: readonly ResolvedColumn<TRow>[];
  headRows: number;
  /** The place past the last row, where the footer of totals is; `null` with no footer place. */
  footerAt: number | null;
  /** Whether the grid has no row because of its filter, so its body is the one empty cell. */
  emptyCell: boolean;
  /** The scroll frame, read when a page key asks how many rows fit. */
  frameRef: RefObject<HTMLElement | null>;
  /** Makes the place the active one. */
  choose: (target: ActivePlace) => void;
  /** Focuses the cell of a place, or asks for its row to be drawn first. */
  focusPlace: (target: ActivePlace | null) => void;
  /** Holds a row of the window while the focus moves to a row that is not drawn yet. */
  setHeld: Dispatch<SetStateAction<number | undefined>>;
  /** The controls of a cell, which the grid released from the Tab order. */
  controlsOf: (cell: HTMLElement) => HTMLElement[];
  reveal: ((index: number) => void) | undefined;
  onSortPress: (columnId: string, additive: boolean) => void;
  onResizeBy: (columnId: string, delta: number) => void;
  onMoveBy: (columnId: string, step: -1 | 1) => void;
  onMoveRow: ((key: DataGridKey, step: -1 | 1, repeat: boolean) => void) | undefined;
  onOpenMenu: (columnId: string) => void;
  onRowActivate: ((row: TRow, key: DataGridKey) => void) | undefined;
  onToggleGroup: (key: string) => void;
  selection: {
    mode: DataGridSelectionMode;
    press: (key: DataGridKey, range: boolean) => void;
    chooseAll: () => void;
  } | null;
}

/** One key press, with what a handler reads of it: the event, the place and its cell, the modifiers. */
export interface KeyContext<TRow> extends KeyEnv<TRow> {
  event: KeyboardEvent<HTMLTableElement>;
  table: HTMLTableElement;
  /** The element the event came from, inside `cell`. */
  target: Element;
  place: ActivePlace;
  /** The element of the place: a cell, or the row itself for a group row. */
  cell: HTMLElement;
  /** What has the focus when the cell does: the cell, or its box. */
  home: HTMLElement;
  /** The row of the place; `undefined` in the heading, the empty cell and a footer that has no row. */
  row: FlatRow<TRow> | undefined;
  column: ResolvedColumn<TRow>;
  /** The key of the platform's modifier, with Shift, Alt and the other modifier up. */
  mod: boolean;
  /** The platform's modifier is down, the other one is not (Shift and Alt are not looked at). */
  modifier: boolean;
  otherModifier: boolean;
  /** No modifier, Shift included. */
  bare: boolean;
  /** The place is on the titles, and not on the filter row. */
  onTitle: boolean;
  /** The place is on the filter row. */
  onFilter: boolean;
}

/** The context of the key press at `place`, whose element is `cell` and which came from `target`. */
export function createKeyContext<TRow>(
  env: KeyEnv<TRow>,
  event: KeyboardEvent<HTMLTableElement>,
  place: ActivePlace,
  cell: HTMLElement,
): KeyContext<TRow> {
  const modifier = isApplePlatform() ? event.metaKey : event.ctrlKey;
  const otherModifier = isApplePlatform() ? event.ctrlKey : event.metaKey;
  return {
    ...env,
    event,
    table: event.currentTarget,
    target: event.target as Element,
    place,
    cell,
    home: homeOf(cell),
    row: place.row >= 0 ? env.rows[place.row] : undefined,
    column: env.columns[place.column]!,
    modifier,
    otherModifier,
    mod: modifier && !otherModifier && !event.altKey && !event.shiftKey,
    bare: !hasModifier(event) && !event.shiftKey,
    onTitle: isTitlePlace(place.row, env.headRows),
    onFilter: isFilterPlace(place.row, env.headRows),
  };
}

/**
 * A control of the cell has the focus: the keys are its own, but for Tab, Esc and F2. Takes the event
 * whenever the focus is not on the cell's home, whether or not it cancelled it.
 */
export function widgetKeys<TRow>(keys: KeyContext<TRow>): boolean {
  const { event, target, cell, home, controlsOf } = keys;
  if (target === home) return false;
  if (hasModifier(event)) return true;
  // A control whose popup is open (a Select) keeps Esc, which the browser answers by closing the
  // popup and which no handler cancels; the next Esc is the grid's.
  const popupOpen = target.closest('[aria-expanded="true"]');
  if (event.key === 'Escape' ? !(popupOpen && cell.contains(popupOpen)) : event.key === 'F2') {
    event.preventDefault();
    focusInto(home, cell);
  } else if (event.key === 'Tab') {
    const controls = controlsOf(cell);
    const at = controls.findIndex((control) => control === target || control.contains(target));
    if (controls.length === 0 || at < 0) return true;
    event.preventDefault();
    const next = controls[(at + (event.shiftKey ? controls.length - 1 : 1)) % controls.length]!;
    focusInto(next, cell);
  }
  return true;
}

/**
 * The keys of the heading: Enter on a title sorts, and Shift+Enter keeps the other columns' sort and adds
 * this one; Space is cancelled; the keys of the columns on the title of a data column (resize, move, the
 * menu). The titles have the keys of the columns; the filter row, which is no title, has none of them.
 */
export function headingKeys<TRow>(keys: KeyContext<TRow>): boolean {
  const { event, place, cell, home, column, onTitle, modifier, otherModifier } = keys;
  const handled = (): void => event.preventDefault();
  // The box in the title of the column of boxes is its home and its one control: Enter presses it, as
  // it presses the box of a row, and Shift+Enter does nothing there.
  if (event.key === 'Enter' && onTitle && !hasModifier(event)) {
    if (home !== cell) {
      if (event.shiftKey) return true;
      handled();
      home.click();
      return true;
    }
    if (!column.allowSorting) return true;
    handled();
    keys.onSortPress(column.id, event.shiftKey);
    return true;
  }
  // Space has no job on a cell of the heading (Enter sorts a title, and a filter cell has no key of its
  // own): it is cancelled, or the browser scrolls the frame or the page a screen down with it. The title
  // of the column of boxes is not one: its box is the home and the target, and keeps Space, which
  // presses it.
  if (event.key === ' ' && place.row < 0 && home === cell && !hasModifier(event)) {
    handled();
    return true;
  }
  // The keys of the columns, on the title of a data column (the column of boxes has none). Each one
  // is cancelled where it does nothing too, a column that cannot be resized for one, so the browser
  // does nothing with it either (Alt+Shift+arrow selects text in some of them).
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
    keys.onResizeBy(column.id, event.key === 'ArrowLeft' ? -RESIZE_KEY_STEP : RESIZE_KEY_STEP);
    return true;
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
    keys.onMoveBy(column.id, event.key === 'ArrowLeft' ? -1 : 1);
    return true;
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
    if (!event.repeat) keys.onOpenMenu(column.id);
    return true;
  }
  return false;
}

/**
 * The keys of the rows: Space on the cell of a row chooses it (Shift: the range to it), and mod+A every row
 * of the scope, from any cell of the grid, the titles too. A box that has the focus is the cell's
 * own target, so these are its keys too; the title's box is a control of its own and keeps Space. In a grid
 * with no row, mod+A on a title is cancelled and does nothing else: there is nothing to choose, and
 * nothing to say. `mod+Shift+↑` and `mod+Shift+↓` on any cell of a data row move it one place.
 */
export function rowKeys<TRow>(keys: KeyContext<TRow>): boolean {
  const { event, place, cell, home, row, rows, selection, footerAt, modifier, otherModifier } =
    keys;
  const handled = (): void => event.preventDefault();
  if (selection?.mode === 'multiple' && keys.mod && isLetterKey(event, 'a')) {
    handled();
    if (rows.length > 0) selection.chooseAll();
    return true;
  }
  // Space has no job on a group row, a detail row or the footer, and is cancelled, or the browser scrolls a
  // screen down with it. On the button of a detail, and on the handle of a row, it is the button's: it
  // opens or closes the detail, or opens the row menu, and chooses no row.
  const service = home !== cell ? cell.getAttribute('data-service') : null;
  const onToggle = service === 'detail' || service === 'drag';
  if (
    (row?.kind === 'group' || row?.kind === 'detail' || place.row === footerAt) &&
    event.key === ' ' &&
    !hasModifier(event)
  ) {
    handled();
    return true;
  }
  if (selection && row?.kind === 'data' && !onToggle && event.key === ' ' && !hasModifier(event)) {
    handled();
    selection.press(row.key, event.shiftKey && selection.mode === 'multiple');
    return true;
  }
  // The keys of a row: each is cancelled where the row cannot go that way too, so the browser does
  // nothing with it either.
  if (
    keys.onMoveRow &&
    row?.kind === 'data' &&
    modifier &&
    !otherModifier &&
    !event.altKey &&
    event.shiftKey &&
    (event.key === 'ArrowUp' || event.key === 'ArrowDown')
  ) {
    handled();
    keys.onMoveRow(row.key, event.key === 'ArrowUp' ? -1 : 1, event.repeat);
    return true;
  }
  return false;
}

/**
 * The keys of a group row (the tree grid pattern of the APG): Enter toggles it, → opens a closed one
 * or goes to its first row, ← closes an open one or goes to the group above, Home and End go to the
 * first and the last row of the list. The column the place remembers never changes on a group row.
 */
export function groupRowKeys<TRow>(keys: KeyContext<TRow>): boolean {
  const { event, place, row, rows, table, reveal, bare, choose, focusPlace } = keys;
  if (row?.kind !== 'group' || !bare) return false;
  const handled = (): void => event.preventDefault();
  const to = (at: number): void => {
    const target = { row: at, column: place.column };
    if (reveal && !rowAt(table, at)) keys.setHeld(place.row);
    choose(target);
    focusPlace(target);
  };
  if (event.key === 'Enter') {
    handled();
    // A held key repeats: one press is one toggle.
    if (!event.repeat) keys.onToggleGroup(row.key);
    return true;
  }
  if (event.key === 'ArrowRight') {
    handled();
    if (!row.expanded) keys.onToggleGroup(row.key);
    else if (rows[place.row + 1]) to(place.row + 1);
    return true;
  }
  if (event.key === 'ArrowLeft') {
    handled();
    if (row.expanded) {
      keys.onToggleGroup(row.key);
      return true;
    }
    for (let at = place.row - 1; at >= 0; at--) {
      const above = rows[at]!;
      if (above.kind === 'group' && above.level < row.level) {
        to(at);
        return true;
      }
    }
    return true;
  }
  if (event.key === 'Home' || event.key === 'End') {
    handled();
    const at = event.key === 'Home' ? 0 : rows.length - 1;
    if (at !== place.row) to(at);
    return true;
  }
  return false;
}

/**
 * A detail row is one cell: the keys that move along a row have nowhere to go, and are cancelled, or the
 * browser scrolls the frame sideways with them. Enter and F2 go into its content; ↑ and ↓ leave it.
 */
export function detailRowKeys<TRow>(keys: KeyContext<TRow>): boolean {
  const { event, row, bare } = keys;
  if (
    row?.kind === 'detail' &&
    bare &&
    (event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'Home' ||
      event.key === 'End')
  ) {
    event.preventDefault();
    return true;
  }
  return false;
}

/** Enter and F2: into the controls of the cell, the press of its box, or the activation of the row. */
export function enterKeys<TRow>(keys: KeyContext<TRow>): boolean {
  const { event, place, cell, home, row, onFilter, footerAt, controlsOf } = keys;
  if (event.key !== 'Enter' && event.key !== 'F2') return false;
  if (!keys.bare) return true;
  // The footer holds nothing to go into or to activate.
  if (place.row === footerAt) return true;
  // The box of a cell is its one control, and Enter presses it as it would a button.
  if (home !== cell && event.key === 'Enter') {
    event.preventDefault();
    home.click();
    return true;
  }
  const controls = controlsOf(cell);
  // A filter cell goes into its value, the input or the Select, and not into the operator button that
  // comes before the input: the operator is one Tab away.
  const first = onFilter
    ? (controls.find((control) => control.matches(FILTER_VALUE_SELECTOR)) ?? controls[0])
    : controls[0];
  if (first) {
    event.preventDefault();
    focusInto(first, cell);
  } else if (event.key === 'Enter' && place.row >= 0 && keys.onRowActivate) {
    // A group row is handled above, and a detail row is no row of data to activate: Enter does nothing there.
    if (row?.kind !== 'data') return true;
    event.preventDefault();
    keys.onRowActivate(row.row, row.key);
  }
  return true;
}

/** The keys that move the active cell: arrows, Home, End and the page keys. */
export function moveKeys<TRow>(keys: KeyContext<TRow>): boolean {
  const { event, place, rows, columns, table, footerAt, mod, choose, focusPlace } = keys;
  // The empty cell is one cell across every column: ↑ goes back to the title of the column the place
  // was at, and the keys that move along a row have nowhere to go.
  const onEmpty = rows.length === 0 && place.row === 0;
  const moved = movedBy(
    event.key,
    mod,
    place,
    rows.length === 0 && keys.emptyCell ? 1 : rows.length + (footerAt !== null ? 1 : 0),
    columns.length,
    keys.headRows,
    (from, direction) => pageStepRows(table, keys.frameRef.current, rows, from, direction),
    footerAt !== null,
  );
  const next = moved && onEmpty ? { ...moved, column: place.column } : moved;
  if (!next) return false;
  event.preventDefault();
  if (next.row !== place.row || next.column !== place.column) {
    // The row the focus is on stays drawn until it has moved, which for a row that is not drawn yet
    // is after the commit that draws it.
    const inBody = (row: number) => row >= 0 && row < rows.length;
    if (keys.reveal && inBody(place.row) && inBody(next.row) && !rowAt(table, next.row)) {
      keys.setHeld(place.row);
    }
    choose(next);
    focusPlace(next);
  }
  return true;
}
