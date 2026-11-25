import { hasModifier } from '../../../internal/roving';
import { flushSync } from 'react-dom';
import { flipsOnPress } from '../engine/edit';
import { getFocusables } from '../../../internal/focus';
import { focusInto } from '../grid-dom';
import type { DataGridKey } from '../types';
import type { KeyContext } from './grid-keys';

/**
 * The control of an editor a bare `Enter` is not a save from: a button that is not the trigger of a Select or
 * a Combobox (the calendar of a DatePicker, ✓ and ✕, the steppers of a NumberInput: `Enter` presses them),
 * a Textarea (a new line), and any control whose popup is open (`Enter` chooses in it).
 */
function savesOnEnter(target: Element): boolean {
  if (target.closest('textarea')) return false;
  if (target.closest('[aria-expanded="true"]')) return false;
  return target.tagName !== 'BUTTON' || target.getAttribute('role') === 'combobox';
}

/**
 * The cell `step` places after the place of the keys that can be edited, across the rows, and the index of its row
 * in the list; `null` past the ends.
 */
function nextCell<TRow>(
  keys: KeyContext<TRow>,
  step: -1 | 1,
): { key: DataGridKey; column: string; index: number } | null {
  const { editing, rows, columns, place } = keys;
  let at = place.row;
  let column = place.column + step;
  while (at >= 0 && at < rows.length) {
    if (column < 0 || column >= columns.length) {
      at += step;
      column = step > 0 ? 0 : columns.length - 1;
      continue;
    }
    const candidate = rows[at]!;
    if (
      candidate.kind === 'data' &&
      editing!.canEditCell(candidate.row, columns[column]!, candidate.added === true)
    ) {
      return { key: candidate.key, column: columns[column]!.id, index: at };
    }
    column += step;
  }
  return null;
}

/**
 * The keys of `cell` mode (spec phase 6 §3.6, §6.3). In the cell that is edited: `Esc` gives its value up (a popup
 * of the editor takes the first one), `Enter` commits it (not from a button, a Textarea or a control whose popup is
 * open), `Tab` and `Shift+Tab` commit it and open the next editable cell, across the rows; past the last or before
 * the first the commit leaves the focus on the cell and the key is not cancelled, so the browser takes it out of the
 * grid. Every other key is the editor's. On a cell that can be edited and is not: `Enter` and `F2` start the edit, a
 * character (no modifier but Shift, not Space) opens an editor that has a text field with that character as its
 * text, and `Space` flips a boolean cell and commits it, choosing no row. A cell with a control of its own, and the
 * cell of the buttons, are left to the widget mode.
 */
function cellKeys<TRow>(keys: KeyContext<TRow>): boolean {
  const { editing, event, row, cell, target, column } = keys;
  if (!editing || row?.kind !== 'data') return false;
  if (cell.hasAttribute('data-editing')) {
    if (event.key === 'Escape' && !hasModifier(event) && !event.shiftKey) {
      if (target.closest('[aria-expanded="true"]')) return true;
      event.preventDefault();
      editing.cancel();
      return true;
    }
    if (event.key === 'Enter' && keys.bare && savesOnEnter(target)) {
      event.preventDefault();
      editing.save();
      return true;
    }
    if (event.key === 'Tab' && !hasModifier(event)) {
      // The focus goes to the cell first: an editor that settles its text when it loses the focus (the
      // NumberInput) does it now, and the cell is committed with what was typed, by the editor's own blur. It is
      // drawn before the key's own action goes on from the cell (`flushSync`): the editor is gone by then, or a
      // browser that draws later (Firefox) would take the key into the editor that is still there.
      flushSync(() => focusInto(cell, cell));
      // A value that fails its rules keeps the editor, and the focus with it.
      if (editing.targetColumn() !== null) {
        event.preventDefault();
        return true;
      }
      const next = nextCell(keys, event.shiftKey ? -1 : 1);
      // Past the last cell the key leaves the grid: the new rows are sent, and one that fails its rules keeps the key.
      if (!next && !editing.leave()) event.preventDefault();
      if (next) {
        event.preventDefault();
        // A virtual grid scrolls to the row first, as an arrow does: the row is drawn under the heading, and
        // the editor that opens there has the focus.
        keys.reveal?.(next.index);
        editing.start(next.key, next.column);
      }
      return true;
    }
    return target !== cell;
  }
  if (cell.hasAttribute('data-actions') || target !== cell) return false;
  if (!editing.canEditCell(row.row, column, row.added === true)) return false;
  if ((event.key === 'Enter' || event.key === 'F2') && keys.bare) {
    event.preventDefault();
    editing.start(row.key, column.id);
    return true;
  }
  if (event.key === ' ' && keys.bare && flipsOnPress(column)) {
    event.preventDefault();
    editing.toggle(row.key, column.id);
    return true;
  }
  if (
    event.key.length === 1 &&
    event.key !== ' ' &&
    !hasModifier(event) &&
    editing.canType(column)
  ) {
    event.preventDefault();
    editing.start(row.key, column.id, event.key);
    return true;
  }
  return false;
}

/**
 * The keys of the form row (`form` mode), which are the ones of its cell: the keys inside the form are the form's own
 * (`isOwn`). `Esc` gives the form up and `Enter` or `F2` go into it, to its first control; every other key is the
 * grid's, which moves between rows and does nothing along this one.
 */
function formKeys<TRow>(keys: KeyContext<TRow>): boolean {
  const { editing, event, cell, target } = keys;
  if (!editing || target !== cell || !keys.bare) return false;
  if (event.key === 'Escape') {
    event.preventDefault();
    editing.cancel();
    return true;
  }
  if (event.key === 'Enter' || event.key === 'F2') {
    event.preventDefault();
    const first = getFocusables(cell)[0];
    if (first) focusInto(first, cell);
    return true;
  }
  return false;
}

/**
 * The keys of editing, tried before every other handler (spec phase 6 §3.6, §6.3 "Năm chế độ").
 *
 * Outside the row being edited, a bare `Enter` or `F2` on a cell of a row that can be edited starts the edit
 * and puts the focus in the editor of that column, else the first editor of the row; on the cell of the buttons
 * they keep their widget mode, and `onRowActivate` is for the rows that cannot be edited.
 *
 * Inside it, `Enter` saves (from an editor, or a cell of the row that has no control; not from a button, not
 * from a Textarea, not from a control whose popup is open), and `Esc` gives the edit up, unless a popup of an
 * editor is open, which takes that first `Esc`. Every other key of an editor, of ✓ and of ✕ is theirs: the
 * handler takes it without cancelling it, so neither the widget mode's Tab cycle nor a move of the grid runs,
 * and `Tab` goes to the next stop of the page, the editors, ✓ and ✕ in DOM order and then out of the grid.
 * The keys of a cell the user stands on, with no control in it, are the grid's (the arrows move).
 */
export function editKeys<TRow>(keys: KeyContext<TRow>): boolean {
  const { editing, event, row, cell, target, column } = keys;
  if (editing && row?.kind === 'form') return formKeys(keys);
  if (!editing || row?.kind !== 'data') return false;
  if (editing.cell) return cellKeys(keys);
  const onActions = cell.hasAttribute('data-actions');
  if (!Object.is(editing.target(), row.key)) {
    if (!keys.bare || (event.key !== 'Enter' && event.key !== 'F2')) return false;
    if (onActions || !editing.canStart(row.row)) return false;
    event.preventDefault();
    editing.start(row.key, column.id);
    return true;
  }
  const inside = target !== cell;
  if (event.key === 'Escape' && !hasModifier(event) && !event.shiftKey) {
    // The popup of an editor is closed by the first `Esc`, which the control answers itself.
    if (target.closest('[aria-expanded="true"]')) return true;
    event.preventDefault();
    editing.cancel();
    return true;
  }
  if (event.key === 'Enter' && keys.bare && !onActions && (!inside || savesOnEnter(target))) {
    event.preventDefault();
    editing.save();
    return true;
  }
  // A key of a control of the row being edited (an editor, ✓, ✕) is the control's own.
  return inside;
}
