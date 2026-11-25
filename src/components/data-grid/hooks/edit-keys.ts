import { hasModifier } from '../../../internal/roving';
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
  if (!editing || row?.kind !== 'data') return false;
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
