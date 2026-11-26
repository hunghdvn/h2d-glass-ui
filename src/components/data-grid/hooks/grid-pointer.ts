import type { MouseEvent } from 'react';
import { takesOwnPress } from '../../../internal/controls';
import { isSavedRow } from '../engine/flatten';
import type { FlatRow } from '../engine/flatten';
import {
  addsLevel,
  cellsOf,
  EMPTY_PLACE_SELECTOR,
  focusHomeOf,
  GRID_SELECTOR,
  holdsEditing,
  homeOf,
  isOwn,
  listIndexOf,
  listRows,
  ownCell,
  titleRow,
} from '../grid-dom';
import type { DataGridKey } from '../types';
import type { ActivePlace } from './grid-place';

/** What the presses of the pointer read of the keyboard hook: the rows, the footer and where to put the place. */
export interface PointerContext<TRow> {
  rows: readonly FlatRow<TRow>[];
  /** The place past the last row, where the footer of totals is; `null` with no footer place. */
  footerAt: number | null;
  /** Makes the place the active one. */
  choose: (target: ActivePlace) => void;
  /** The column the active place remembers, read when a press needs it: 0 before there is one. */
  column: () => number;
  onRowActivate: ((row: TRow, key: DataGridKey) => void) | undefined;
}

/**
 * Makes the cell `target` is in (a press on it, or the focus that came to it) the active place. A group
 * row, a detail row, the empty cell and the footer are each one place, whichever part is pressed.
 */
export function activate<TRow>(
  pointer: PointerContext<TRow>,
  target: Element,
  table: HTMLTableElement,
): void {
  const { choose, column, footerAt } = pointer;
  // A group row is one place, whichever part of it is pressed or has the focus: the column stays.
  const groupRow = target.closest('tr.flg-data-grid-group-row');
  if (groupRow && groupRow.closest(GRID_SELECTOR) === table) {
    const tr = groupRow as HTMLTableRowElement;
    choose({
      row: listIndexOf(tr, listRows(table).indexOf(tr)),
      column: column(),
    });
    return;
  }
  const cell = ownCell(target, table);
  // A detail row and a form row are one place, whichever part of them is pressed or has the focus: the column stays.
  if (cell?.matches('.flg-data-grid-detail-cell, .flg-data-grid-form-cell')) {
    const tr = cell.parentElement as HTMLTableRowElement;
    choose({
      row: listIndexOf(tr, listRows(table).indexOf(tr)),
      column: column(),
    });
    return;
  }
  // The empty cell of a filtered grid is the one place of the body, whichever part of it is pressed.
  if (cell?.matches(EMPTY_PLACE_SELECTOR)) {
    choose({ row: 0, column: column() });
    return;
  }
  if (cell?.matches('.flg-data-grid-foot-cell')) {
    if (footerAt !== null) {
      choose({
        row: footerAt,
        column: cellsOf(cell.parentElement as HTMLTableRowElement).indexOf(cell),
      });
    }
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
}

/**
 * A browser that does not focus a button it is pressed on (Safari) says nothing to `onFocus`,
 * so the press makes its cell active here. Where the browser would put the focus is then held
 * to the rule of a press (spec phase 6 §3.6): after it the focus is on the home of the active
 * cell. A control of a cell keeps its own press, and one that a part already took (the sort
 * button, a row's Shift press) is left as that part left it. A press on the cell of a box, beside
 * the box, would focus the cell, which is not its home; a press with Shift or the modifier on a
 * title would start a text selection: both are cancelled and give the focus to the home. A press
 * on the filler column or on an indent does nothing, and the focus stays: the frame's `tabindex`
 * would take it.
 */
export function pressCell<TRow>(
  pointer: PointerContext<TRow>,
  event: MouseEvent<HTMLTableElement>,
): void {
  const table = event.currentTarget;
  if (!isOwn(event.target, table)) return;
  const target = event.target as Element;
  activate(pointer, target, table);
  if (event.button !== 0 || event.defaultPrevented) return;
  const cell = ownCell(target, table);
  if (!cell || takesOwnPress({ target, currentTarget: cell })) return;
  // The filler and the indents are no place: a press on one does nothing, as the active place stays,
  // and cancelling it keeps the browser from giving the focus to the frame's `tabindex="-1"`. The
  // indents of a group row are the exception: the row is a place of its own (`tabindex`), and the
  // press gives it the focus.
  if (
    cell.classList.contains('flg-data-grid-filler') ||
    (cell.classList.contains('flg-data-grid-indent') && !cell.closest('.flg-data-grid-group-row'))
  ) {
    event.preventDefault();
    return;
  }
  // A press on an editor cell, beside its editor, moves no focus: no frame of the grid and no `<body>`.
  if (cell.hasAttribute('data-editor')) {
    event.preventDefault();
    return;
  }
  const onTitles = cell.parentElement === titleRow(table);
  if (homeOf(cell) !== cell || (onTitles && addsLevel(event))) {
    event.preventDefault();
    focusHomeOf(cell);
  }
}

/** The double press on the cell of a data row: activates the row, unless a control of the cell took the press. */
export function pressTwice<TRow>(
  pointer: PointerContext<TRow>,
  event: MouseEvent<HTMLTableElement>,
): void {
  const { rows, onRowActivate } = pointer;
  const table = event.currentTarget;
  if (!onRowActivate || !isOwn(event.target, table)) return;
  const cell = ownCell(event.target as Element, table);
  if (!cell?.matches('.flg-data-grid-cell')) return;
  // The cell is what is pressed: a control in it takes the press, but the cell itself, which is
  // the Tab stop (`tabindex="0"`) when active, is no control of its row.
  if (takesOwnPress({ target: event.target, currentTarget: cell }) || holdsEditing(cell)) return;
  // A double press on a cell that can be edited is the cell's (`cell` mode): it activates no row.
  if (cell.hasAttribute('data-editable')) return;
  const drawnRow = cell.parentElement as HTMLTableRowElement;
  const row = rows[listIndexOf(drawnRow, listRows(table).indexOf(drawnRow))];
  if (row !== undefined && isSavedRow(row)) onRowActivate(row.row, row.key);
}
