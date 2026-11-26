import { isNumber } from '../../../internal/number';
import type { ResolvedColumn } from './columns';
import { isBlank } from './values';

/** The editors the grid makes by itself; a `datetime` has none (its column brings an `editor`). */
export type EditorKind = 'string' | 'number' | 'date' | 'boolean' | 'select' | 'combobox';

/** The longest lookup a Select is used for: a longer one is a list to search, a Combobox. */
export const SELECT_LIMIT = 20;

/**
 * The editor a column gets by its type and its lookup (spec phase 6 §6.3): a lookup is a Select up to
 * `SELECT_LIMIT` items and a Combobox above, and `lookup.searchable` forces one or the other. `null` for a
 * `datetime`, which has an editor only when the caller gives one.
 */
export function editorKind<TRow>(column: ResolvedColumn<TRow>): EditorKind | null {
  const { choices } = column;
  if (choices) {
    const searchable = column.column.lookup?.searchable;
    return (typeof searchable === 'boolean' ? searchable : choices.length > SELECT_LIMIT)
      ? 'combobox'
      : 'select';
  }
  switch (column.dataType) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    case 'boolean':
      return 'boolean';
    default:
      return null;
  }
}

/**
 * What an editor is given for the value the column holds in the row: the string of a string column (`''` for
 * a blank), the number (`null` for none), the ISO day of a date, a boolean (`false` for a blank), and for a
 * lookup the string of the item's value (`null` for none: the Select's placeholder). The same reading the cell
 * makes, so what the editor shows is what the cell showed.
 */
export function toEditorValue<TRow>(column: ResolvedColumn<TRow>, row: TRow): unknown {
  const value = column.value(row);
  if (column.choices) return isBlank(value) ? null : String(value);
  switch (column.dataType) {
    case 'string':
      return isBlank(value) ? '' : String(value);
    case 'number':
      return isNumber(value) ? value : null;
    case 'date': {
      const day = column.filterKey(row);
      return typeof day === 'string' ? day : null;
    }
    case 'boolean':
      return value === true;
    default:
      return value ?? null;
  }
}

/** What an editor shows for a value that is blank: the cell of a new row whose field was never given reads as one. */
export function blankEditorValue<TRow>(column: ResolvedColumn<TRow>): unknown {
  if (column.choices) return null;
  switch (column.dataType) {
    case 'string':
      return '';
    case 'boolean':
      return false;
    default:
      return null;
  }
}

/**
 * What the editor's value is as the row holds it: the string and the number as they are, a lookup string as
 * the item's own value (a number stays a number; a string no item has is `null`), and a day as the type the
 * row held: a `Date` goes back as a `Date` at the UTC midnight of the day (a `date` column shows a `Date` by
 * its UTC day, so a local midnight would show the day before in a zone east of UTC), anything else as the ISO
 * day. `row` is the row the value is written to, which tells the type that was there.
 */
export function fromEditorValue<TRow>(
  column: ResolvedColumn<TRow>,
  editorValue: unknown,
  row: TRow,
): unknown {
  if (column.choices) {
    if (editorValue === null || editorValue === undefined) return null;
    return column.choices.find((choice) => String(choice.value) === editorValue)?.value ?? null;
  }
  if (column.dataType === 'date') {
    if (typeof editorValue !== 'string') return null;
    return column.value(row) instanceof Date ? new Date(`${editorValue}T00:00:00Z`) : editorValue;
  }
  return editorValue ?? null;
}
