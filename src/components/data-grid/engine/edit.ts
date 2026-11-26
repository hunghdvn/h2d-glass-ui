import { devWarn } from '../../../internal/warn';
import type {
  DataGridChange,
  DataGridDataType,
  DataGridEditMode,
  DataGridEditing,
  DataGridKey,
} from '../types';
import { isDataColumn } from './columns';
import type { ResolvedColumn } from './columns';
import type { FlatDataRow } from './flatten';
import { isBlank, toComparable, toFilterKey } from './values';

/**
 * A change the grid holds and has not saved, one for each row. `data` is the fields of the row (a computed
 * column's value is turned into fields by its `setValue` when it is set, so a change never holds column
 * ids). `row` is the saved row the change was made on: it stays when the row leaves `data`, as a row of
 * another page of a server grid does. A `remove` keeps the `data` of the update it was made over, which an
 * undo gives back.
 */
export type PendingChange<TRow> =
  | { type: 'insert'; key: string; data: Partial<TRow> }
  | { type: 'update'; key: DataGridKey; data: Partial<TRow>; row: TRow }
  | { type: 'remove'; key: DataGridKey; row: TRow; data?: Partial<TRow> };

/** What `mergeChange` is asked: a change to make, or the undo of a remove. */
export type ChangeRequest<TRow> = PendingChange<TRow> | { type: 'undo' };

/**
 * The rows as the grid shows them over the saved ones (step 2 of spec 3.5). A row is looked up by its
 * object or by its key, both of the data it was made from.
 */
export interface ShownRows<TRow> {
  /**
   * The row as it is shown: a changed row is one new object, `{ ...row, ...data }`, the same object until
   * its change changes; every other row is the object it was.
   */
  shown(row: TRow, key: DataGridKey): TRow;
  /**
   * The row as a total reads it: the shown row, or `null` for a row that is marked for deletion, which no
   * total counts. A row without a change is itself.
   */
  view(row: TRow): TRow | null;
  /**
   * The keys of the rows that must not move: every key with a change, and the keys the caller asked for
   * (the row being edited).
   */
  pinned: ReadonlySet<DataGridKey>;
  /** The rows of the data whose key is pinned; the search and the filter keep them whatever they read. */
  pinnedRows: ReadonlySet<TRow>;
  /** The keys of the rows marked for deletion. */
  deleted: ReadonlySet<DataGridKey>;
  /** The new rows in the order they were added, each as a row of its data, with its temporary key. */
  added: readonly { key: string; row: TRow }[];
}

const isFilled = (data: object | undefined): data is object =>
  data !== undefined && Object.keys(data).length > 0;

/**
 * The change that stands for `previous` followed by `next`, or `null` for none. An update over an update
 * merges the data; an insert that is updated stays an insert; an insert that is removed was never saved, so
 * it is no change; an update that is removed is a remove that keeps the data; an undo of a remove is the
 * update it kept, or none. An undo of anything else changes nothing.
 */
export function mergeChange<TRow>(
  previous: PendingChange<TRow> | undefined,
  next: ChangeRequest<TRow>,
): PendingChange<TRow> | null {
  if (next.type === 'undo') {
    if (previous?.type !== 'remove') return previous ?? null;
    return isFilled(previous.data)
      ? { type: 'update', key: previous.key, data: previous.data, row: previous.row }
      : null;
  }
  if (!previous) return next;
  switch (previous.type) {
    case 'insert':
      if (next.type === 'remove') return null;
      if (next.type === 'update') {
        return { type: 'insert', key: previous.key, data: { ...previous.data, ...next.data } };
      }
      return next;
    case 'update':
      if (next.type === 'update') {
        return { ...previous, data: { ...previous.data, ...next.data } };
      }
      if (next.type === 'remove') {
        return isFilled(previous.data)
          ? { type: 'remove', key: previous.key, row: previous.row, data: previous.data }
          : { type: 'remove', key: previous.key, row: previous.row };
      }
      return next;
    case 'remove':
      if (next.type === 'update') {
        return { ...previous, data: { ...previous.data, ...next.data } };
      }
      return previous;
  }
}

// Two values of a field are one: two blanks are, a `date` is its ISO day, a `datetime` its instant, a `Date`
// of a field no column reads its instant, and anything else `Object.is`.
function sameValue(a: unknown, b: unknown, dataType: DataGridDataType | undefined): boolean {
  const blankA = isBlank(a);
  const blankB = isBlank(b);
  if (blankA || blankB) return blankA && blankB;
  if (dataType === 'date') {
    const dayA = toFilterKey(a, 'date', 'UTC');
    const dayB = toFilterKey(b, 'date', 'UTC');
    if (dayA !== null && dayB !== null) return dayA === dayB;
  } else if (dataType === 'datetime') {
    const instantA = toComparable(a, 'datetime');
    const instantB = toComparable(b, 'datetime');
    if (instantA !== null && instantB !== null) return instantA === instantB;
  }
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return Object.is(a, b);
}

/**
 * The fields of `data` that differ from the saved row, as `data` holds them; `{}` when none do. A field is
 * compared as the column that reads it compares (`sameValue`), so a value typed back to the saved one is
 * no difference.
 */
export function rowDiff<TRow>(
  saved: TRow,
  data: Partial<TRow>,
  columns: readonly ResolvedColumn<TRow>[],
): Partial<TRow> {
  const types = new Map<string, DataGridDataType>();
  for (const { column, dataType } of columns) {
    if (typeof column.field === 'string') types.set(column.field, dataType);
  }
  const was = saved as Record<string, unknown>;
  const diff: Record<string, unknown> = {};
  for (const field of Object.keys(data)) {
    const value = (data as Record<string, unknown>)[field];
    if (!sameValue(Object.hasOwn(was, field) ? was[field] : undefined, value, types.get(field))) {
      diff[field] = value;
    }
  }
  return diff as Partial<TRow>;
}

/**
 * The change as it stands to be kept: an update is cut down to the fields that differ from the saved row,
 * and is no change (`null`) when none do; an insert and a remove are as they are.
 */
export function trimChange<TRow>(
  change: PendingChange<TRow>,
  columns: readonly ResolvedColumn<TRow>[],
): PendingChange<TRow> | null {
  if (change.type !== 'update') return change;
  const diff = rowDiff(change.row, change.data, columns);
  const count = Object.keys(diff).length;
  if (count === 0) return null;
  return count === Object.keys(change.data).length ? change : { ...change, data: diff };
}

/**
 * The changes of `batch` mode that are left once `sent` has gone through: what was sent is done, and what was changed
 * again while the save was pending stays, over the row as it is saved now (the old row with the fields that were
 * sent), so that the next save sends only what the first did not. `held` are the changes that are no new row.
 */
export function settleChanges<TRow>(
  held: ReadonlyMap<DataGridKey, PendingChange<TRow>>,
  sent: ReadonlyMap<DataGridKey, PendingChange<TRow>>,
  columns: readonly ResolvedColumn<TRow>[],
): Map<DataGridKey, PendingChange<TRow>> {
  const rest = new Map<DataGridKey, PendingChange<TRow>>();
  for (const [key, change] of held) {
    const was = sent.get(key);
    if (was === undefined) {
      rest.set(key, change);
    } else if (was === change || (was.type === 'remove' && change.type === 'remove')) {
      // What was sent is done: a delete made anew (the row deleted, taken back and deleted again) is the same one.
      continue;
    } else if (was.type === 'update' && change.type !== 'insert') {
      const saved = { ...change.row, ...was.data };
      const left: Record<string, unknown> = {};
      const data = change.type === 'update' ? change.data : {};
      for (const [field, value] of Object.entries(data)) {
        if (!Object.hasOwn(was.data, field) || !Object.is((was.data as never)[field], value)) {
          left[field] = value;
        }
      }
      const kept: PendingChange<TRow> =
        change.type === 'remove'
          ? { type: 'remove', key, row: saved }
          : { type: 'update', key, data: left as Partial<TRow>, row: saved };
      const trimmed = trimChange(kept, columns);
      if (trimmed) rest.set(key, trimmed);
    } else {
      rest.set(key, change);
    }
  }
  return rest;
}

// The shown row of a change is remembered by the object that holds its data, so it is the same object until
// the change is made anew (a merge makes a new `data`), and by the row it was made over, so a row the data
// replaces is shown anew.
const overlays = new WeakMap<object, { row: object; value: object }>();
function overlay<TRow>(row: TRow, data: Partial<TRow>): TRow {
  const hit = overlays.get(data);
  if (hit && hit.row === row) return hit.value as TRow;
  const value = { ...(row as object), ...data } as TRow;
  overlays.set(data, { row: row as object, value: value as object });
  return value;
}

// The row of a new row's data, by the same rule.
const created = new WeakMap<object, object>();
function createdRow<TRow>(data: Partial<TRow>): TRow {
  let row = created.get(data);
  if (!row) {
    row = { ...data };
    created.set(data, row);
  }
  return row as TRow;
}

const NONE: ShownRows<never> = {
  shown: (row) => row,
  view: (row) => row,
  pinned: new Set(),
  pinnedRows: new Set(),
  deleted: new Set(),
  added: [],
};

/**
 * The rows over the saved ones. `rows` are the rows of the data and `rowKey` reads their keys (a key of a
 * row that has none is the one it has in the data, which is not always the one the sorted list gives it).
 * `also` are keys to pin besides those of the changes: the row being edited. With no change and nothing to
 * pin the one constant object is given back.
 */
export function applyChanges<TRow>(
  rows: readonly TRow[],
  changes: ReadonlyMap<DataGridKey, PendingChange<TRow>>,
  rowKey: (row: TRow, index: number) => DataGridKey,
  also: Iterable<DataGridKey> = [],
): ShownRows<TRow> {
  const pinned = new Set<DataGridKey>(changes.keys());
  for (const key of also) pinned.add(key);
  if (pinned.size === 0) return NONE as ShownRows<TRow>;

  const deleted = new Set<DataGridKey>();
  const added: { key: string; row: TRow }[] = [];
  for (const change of changes.values()) {
    if (change.type === 'insert') added.push({ key: change.key, row: createdRow(change.data) });
    else if (change.type === 'remove') deleted.add(change.key);
  }

  const shown = (row: TRow, key: DataGridKey): TRow => {
    const change = changes.get(key);
    const data = change && change.type !== 'insert' ? change.data : undefined;
    return isFilled(data) ? overlay(row, data) : row;
  };
  const pinnedRows = new Set<TRow>();
  const views = new Map<TRow, TRow | null>();
  rows.forEach((row, index) => {
    const key = rowKey(row, index);
    if (!pinned.has(key)) return;
    pinnedRows.add(row);
    views.set(row, deleted.has(key) ? null : shown(row, key));
  });

  return {
    shown,
    view: (row) => (views.has(row) ? views.get(row)! : row),
    pinned,
    pinnedRows,
    deleted,
    added,
  };
}

/**
 * What `onSaving` is given: one change for each row, in the order the rows were first changed. An update
 * carries only the fields that differ from the saved row and the row itself, and one that differs in none
 * is not sent; a remove does not carry the data it kept.
 */
export function savingChanges<TRow>(
  changes: ReadonlyMap<DataGridKey, PendingChange<TRow>>,
  columns: readonly ResolvedColumn<TRow>[],
): DataGridChange<TRow>[] {
  const saving: DataGridChange<TRow>[] = [];
  for (const change of changes.values()) {
    if (change.type === 'insert') {
      saving.push({ type: 'insert', key: change.key, data: change.data });
    } else if (change.type === 'remove') {
      saving.push({ type: 'remove', key: change.key, row: change.row });
    } else {
      const data = rowDiff(change.row, change.data, columns);
      if (Object.keys(data).length > 0) {
        saving.push({ type: 'update', key: change.key, data, row: change.row });
      }
    }
  }
  return saving;
}

/**
 * The rows the search or the filter kept, and the rows that must not leave: the pinned ones, in the order of
 * `source`. The same array when the step kept every one of them.
 */
export function withPinned<TRow>(
  source: readonly TRow[],
  kept: readonly TRow[],
  pinned: ReadonlySet<TRow>,
): readonly TRow[] {
  if (pinned.size === 0 || kept === source) return kept;
  const keptSet = new Set(kept);
  const all = source.filter((row) => keptSet.has(row) || pinned.has(row));
  return all.length === kept.length ? kept : all;
}

// A shown row as a row of the list, by the saved row of the list and the row it is shown as.
const shownFlat = new WeakMap<object, { row: unknown; flat: object }>();
/**
 * The data rows of the list with the shown row of each row that has a change; every other row is the object
 * it was, and so is the list when none is shown otherwise. A shown row is the same object while its row is, so
 * only the row that changed is drawn again. `previous` is the list made the last time, given back when every
 * row of the new one is the same.
 */
export function overlayRows<TRow>(
  keyed: readonly FlatDataRow<TRow>[],
  changes: ShownRows<TRow> | null,
  previous: readonly FlatDataRow<TRow>[] | undefined,
): readonly FlatDataRow<TRow>[] {
  if (!changes) return keyed;
  let changed = false;
  const list = keyed.map((flat) => {
    if (!changes.pinned.has(flat.key)) return flat;
    const row = changes.shown(flat.row, flat.key);
    if (row === flat.row) return flat;
    changed = true;
    const hit = shownFlat.get(flat);
    if (hit && hit.row === row) return hit.flat as FlatDataRow<TRow>;
    const made: FlatDataRow<TRow> = { ...flat, row };
    shownFlat.set(flat, { row, flat: made });
    return made;
  });
  if (!changed) return keyed;
  return previous &&
    previous.length === list.length &&
    list.every((one, at) => one === previous[at])
    ? previous
    : list;
}

// A new row has no groups.
const NO_GROUPS: readonly string[] = [];
const freshFlat = new WeakMap<object, FlatDataRow<unknown>>();
/** A new row as a row of the list: outside every group, at level 1, the same object while its row is. */
export function freshRow<TRow>(added: { key: string; row: TRow }): FlatDataRow<TRow> {
  const hit = freshFlat.get(added.row as object);
  if (hit && hit.key === added.key) return hit as FlatDataRow<TRow>;
  const made: FlatDataRow<TRow> = {
    kind: 'data',
    key: added.key,
    row: added.row,
    level: 1,
    groups: NO_GROUPS,
    setsize: 0,
    posinset: 0,
    added: true,
  };
  freshFlat.set(added.row as object, made as FlatDataRow<unknown>);
  return made;
}

/** The modes whose editors sit in the cells of the rows (the form and the popup do not). */
const IN_CELL_MODES: readonly DataGridEditMode[] = ['row', 'cell', 'batch'];

/**
 * Whether a mode edits one cell at a time, with no Edit button: `cell`, which sends each cell as it is left, and
 * `batch`, which keeps each as a change until the save bar sends them all.
 */
export const editsCells = (mode: DataGridEditMode): boolean => mode === 'cell' || mode === 'batch';

/**
 * Whether a row can be edited at all: `allowUpdating` of the editing (`true` when left out, or a function of
 * the row), and always for a new row, which is edited whatever `allowUpdating` says.
 */
export function canUpdate<TRow>(
  row: TRow,
  editing: DataGridEditing<TRow> | null,
  added = false,
): boolean {
  if (editing === null) return false;
  if (added) return true;
  const { allowUpdating } = editing;
  if (typeof allowUpdating !== 'function') return allowUpdating !== false;
  try {
    return allowUpdating(row) !== false;
  } catch {
    // The app's function is called from a render and from handlers: a throw is a no, and the grid goes on.
    devWarn('<DataGrid> editing.allowUpdating threw: the row cannot be edited.');
    return false;
  }
}

/**
 * Whether a row can be deleted: `allowDeleting` of the editing (`false` when left out, or a function of the
 * row, of which only a `true` answer counts).
 */
export function canDelete<TRow>(row: TRow, editing: DataGridEditing<TRow> | null): boolean {
  if (editing === null) return false;
  const { allowDeleting } = editing;
  if (typeof allowDeleting !== 'function') return allowDeleting === true;
  try {
    return allowDeleting(row) === true;
  } catch {
    devWarn('<DataGrid> editing.allowDeleting threw: the row cannot be deleted.');
    return false;
  }
}

/**
 * Whether a mode edits the fields of a row as a form lays them out (every data column, in the layout's order): the
 * form in the place of the row, and the popup.
 */
export const hasFormFields = (mode: DataGridEditMode): boolean =>
  mode === 'form' || mode === 'popup';

/** Whether a mode starts the edit of a row with a button (Edit): the modes that edit a cell have none. */
export const hasEditButton = (mode: DataGridEditMode): boolean =>
  mode === 'row' || hasFormFields(mode);

/**
 * Whether the column of buttons is drawn: a button can stand in it, which is when rows may be deleted
 * (`allowDeleting` is `true` or a function) or, in a mode that has an Edit button, updated (a function may
 * say yes for some).
 */
export function drawsActions<TRow>(editing: DataGridEditing<TRow>): boolean {
  const { allowUpdating, allowDeleting, mode } = editing;
  const deletes = allowDeleting !== undefined && allowDeleting !== false;
  // A new row of `row` mode has ✓ and ✕ in the column, so a grid that only adds draws it too; the form of a new row has
  // its own buttons.
  const adds = mode === 'row' && editing.allowAdding === true;
  return deletes || (hasEditButton(mode) && (allowUpdating !== false || adds));
}

/**
 * The columns the form has as fields (spec phase 6 §6.3 `form`): every data column in the order of `order` (the ids
 * of the grid's columns in their layout order, shown, hidden and grouped ones alike), but those that say
 * `form.visible: false`. An id of no column, and a column that is no data column, are left out.
 */
export function formColumns<TRow>(
  columns: readonly ResolvedColumn<TRow>[],
  order: readonly string[],
): ResolvedColumn<TRow>[] {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const fields: ResolvedColumn<TRow>[] = [];
  for (const id of order) {
    const column = byId.get(id);
    if (column && isDataColumn(column) && column.column.form?.visible !== false)
      fields.push(column);
  }
  return fields;
}

/** How many columns of the form's grid a field spans: two for a `multiline` string column and for `form.span: 2`. */
export function formSpan<TRow>(column: ResolvedColumn<TRow>): 1 | 2 {
  const { multiline, form } = column.column;
  return form?.span === 2 || (multiline === true && column.dataType === 'string') ? 2 : 1;
}

/** Whether a cell of a column is flipped by `Space` and a press in the modes that edit a cell: a plain boolean. */
export function flipsOnPress<TRow>(column: ResolvedColumn<TRow>): boolean {
  return column.dataType === 'boolean' && !column.choices;
}

/**
 * Whether the cell of a column in a row can be edited: the one rule every part asks (the cells, the keys, the
 * form), none repeats it. Editing is on; the row may be updated (`canUpdate`); the column is a data column
 * whose `allowEditing` says yes for the row (`true` when left out); it has a field to write, or a
 * `setValue`; a `datetime` has an editor only when the caller gave one; and a `multiline` column is edited in
 * the form and the popup, and shown as text where the editor sits in the cell.
 */
export function canEdit<TRow>(
  column: ResolvedColumn<TRow>,
  row: TRow,
  editing: DataGridEditing<TRow> | null,
  added = false,
): boolean {
  if (editing === null || !isDataColumn(column) || !canUpdate(row, editing, added)) return false;
  const { column: given } = column;
  const { allowEditing } = given;
  if (typeof allowEditing === 'function') {
    try {
      if (allowEditing(row) === false) return false;
    } catch {
      devWarn('<DataGrid> a column allowEditing threw: the cell cannot be edited.');
      return false;
    }
  } else if (allowEditing === false) {
    return false;
  }
  const writes =
    typeof given.field === 'string' ||
    ('setValue' in given && typeof given.setValue === 'function');
  if (!writes) return false;
  if (column.dataType === 'datetime' && typeof given.editor !== 'function') return false;
  // A multiline column is a string column; the option of any other type is ignored (the grid warns).
  if (
    given.multiline === true &&
    column.dataType === 'string' &&
    IN_CELL_MODES.includes(editing.mode)
  ) {
    return false;
  }
  return true;
}

/**
 * Whether a row has a field that can be edited among `columns` (the cells it draws, or the fields of the form): a row
 * with none has nothing to start editing, so it has no Edit button and no key starts it.
 */
export function canEditAny<TRow>(
  row: TRow,
  columns: readonly ResolvedColumn<TRow>[],
  editing: DataGridEditing<TRow> | null,
): boolean {
  return columns.some((column) => canEdit(column, row, editing));
}

/** What a row shows of the change held over it (batch mode): that it is marked for deletion, or which cells changed. */
export interface RowMarks {
  readonly deleted: boolean;
  /** The ids of the columns whose cell is not what the saved row has. */
  readonly changed: ReadonlySet<string>;
  /** The cells a refused save named, by column id, with the words it gave. */
  readonly invalid?: ReadonlyMap<string, string>;
  /** The row's change is being sent: Undo and Delete wait for the answer. */
  readonly sending?: true;
}

const NO_COLUMNS: ReadonlySet<string> = new Set();
const DELETED: RowMarks = { deleted: true, changed: NO_COLUMNS };
const NOT_CHANGED: RowMarks = { deleted: false, changed: NO_COLUMNS };
const marked = new WeakMap<object, { columns: readonly unknown[]; marks: RowMarks }>();
const sendingOf = new WeakMap<RowMarks, RowMarks>();
const faultedOf = new WeakMap<RowMarks, WeakMap<object, RowMarks>>();

/**
 * The marks of a row that has a change: `remove` marks the whole row and no cell, an `update` marks the cells
 * whose value is not the saved one. A field column is changed when its field is in the difference from the saved
 * row; a computed column only when it can be set (`setValue`) and its value is not the saved row's, so the total
 * that reads a quantity is not marked when the quantity is. An insert marks no cell (a new row has its own marks).
 */
export function rowMarks<TRow>(
  change: PendingChange<TRow>,
  columns: readonly ResolvedColumn<TRow>[],
): RowMarks {
  if (change.type === 'remove') return DELETED;
  if (change.type === 'insert') return NOT_CHANGED;
  // The marks of a change are the same object while the change and the columns are, so a row that is given them
  // as a prop draws again only when its own change moves.
  const hit = marked.get(change);
  if (hit && hit.columns === columns) return hit.marks;
  const diff = rowDiff(change.row, change.data, columns);
  const shown = { ...change.row, ...change.data };
  const changed = new Set<string>();
  for (const column of columns) {
    if (!isDataColumn(column)) continue;
    const { field } = column.column;
    if (typeof field === 'string') {
      if (Object.hasOwn(diff, field)) changed.add(column.id);
    } else if (
      'setValue' in column.column &&
      typeof column.column.setValue === 'function' &&
      !sameValue(column.value(change.row), column.value(shown), column.dataType)
    ) {
      changed.add(column.id);
    }
  }
  const marks: RowMarks = { deleted: false, changed };
  marked.set(change, { columns, marks });
  return marks;
}

/**
 * The marks of a row some of whose cells a refused save named (`invalid`): the ones it has and the faults. The same
 * object while `base` and `invalid` are, as `rowMarks` makes the others, so an unrelated change draws no faulted row.
 */
export function faultedMarks(
  base: RowMarks | undefined,
  invalid: ReadonlyMap<string, string>,
): RowMarks {
  const root = base ?? NOT_CHANGED;
  let byFault = faultedOf.get(root);
  if (!byFault) {
    byFault = new WeakMap();
    faultedOf.set(root, byFault);
  }
  let marks = byFault.get(invalid);
  if (!marks) {
    marks = { ...root, invalid };
    byFault.set(invalid, marks);
  }
  return marks;
}

/**
 * The marks of a row whose change is being sent: the ones it has (none: a new row's) and `sending`. The same object
 * while `base` is, so a row draws again only when its marks move.
 */
export function sendingMarks(base: RowMarks | undefined): RowMarks {
  const root = base ?? NOT_CHANGED;
  let marks = sendingOf.get(root);
  if (!marks) {
    marks = { ...root, sending: true };
    sendingOf.set(root, marks);
  }
  return marks;
}

/** What a rejected save says: the words of the alert, and the cells it marks, by column id. */
export interface SaveFailure {
  message: string;
  fields: ReadonlyMap<string, string>;
}

/** What a rejected save of several rows says: the cells it marks are by row, then by column id. */
export interface BatchSaveFailure {
  message: string;
  faults: ReadonlyMap<DataGridKey, ReadonlyMap<string, string>>;
}

/** Whether `value` is a text with something in it. */
const isWords = (value: unknown): value is string => typeof value === 'string' && value !== '';

/**
 * What a rejected save of rows says (spec phase 6 §6.3 "Sửa dữ liệu"). The words are the error's `message` when it is a
 * text, else `saveFailed`. `fieldErrors` that name one of the cells a row draws (`rows`: the columns of each key; by
 * id, then by `field`) mark that cell, the first message of a cell winning; every other message (a field the row does
 * not draw, a row that is not there) is added to the words. Entries of another shape are left out, and so are the
 * properties an error only inherits.
 */
export function readBatchSaveError<TRow>(
  reason: unknown,
  rows: ReadonlyMap<DataGridKey, readonly ResolvedColumn<TRow>[]>,
  saveFailed: string,
): BatchSaveFailure {
  // A property of the reason; one that only a prototype gives is none, but `message`, which a class of errors
  // may well keep there. A getter that throws is no property.
  const own = (name: string): unknown => {
    if (typeof reason !== 'object' || reason === null) return undefined;
    try {
      return name === 'message' || Object.hasOwn(reason, name)
        ? (reason as Record<string, unknown>)[name]
        : undefined;
    } catch {
      return undefined;
    }
  };
  const message = own('message');
  const faults = new Map<DataGridKey, Map<string, string>>();
  const extra: string[] = [];
  const list = own('fieldErrors');
  for (const entry of Array.isArray(list) ? (list as unknown[]) : []) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { key: at, field, message: words } = entry as Record<string, unknown>;
    if (typeof field !== 'string' || !isWords(words)) continue;
    const columns = typeof at === 'string' || typeof at === 'number' ? rows.get(at) : undefined;
    const column = columns
      ? (columns.find((one) => one.id === field) ??
        columns.find((one) => one.column.field === field))
      : undefined;
    if (!column) {
      extra.push(words);
      continue;
    }
    const cells = faults.get(at as DataGridKey) ?? new Map<string, string>();
    if (!cells.has(column.id)) cells.set(column.id, words);
    faults.set(at as DataGridKey, cells);
  }
  return { message: [isWords(message) ? message : saveFailed, ...extra].join(' '), faults };
}

/**
 * What a rejected save of one row says: the words of the alert, and the cells it marks (see `readBatchSaveError`;
 * `columns` are the cells the row with this `key` draws).
 */
export function readSaveError<TRow>(
  reason: unknown,
  key: DataGridKey,
  columns: readonly ResolvedColumn<TRow>[],
  saveFailed: string,
): SaveFailure {
  const { message, faults } = readBatchSaveError(reason, new Map([[key, columns]]), saveFailed);
  return { message, fields: faults.get(key) ?? new Map() };
}

/**
 * Waits for the answer of `onSaving`: `ok` runs when it resolves, `fail` when it rejects or when its `then` throws
 * (a throw is a refusal, as one of `onSaving` itself is). Each runs at most once, and outside the chain: what `ok` or
 * `fail` throws is reported as an uncaught error from a microtask, never as an unhandled rejection of a promise the
 * grid made, which no one could catch.
 */
export function awaitAnswer(
  result: PromiseLike<unknown>,
  ok: () => void,
  fail: (reason: unknown) => void,
): void {
  let answered = false;
  const answer = (run: () => void): void => {
    if (answered) return;
    answered = true;
    try {
      run();
    } catch (error) {
      queueMicrotask(() => {
        throw error;
      });
    }
  };
  try {
    result.then(
      () => answer(ok),
      (reason: unknown) => answer(() => fail(reason)),
    );
  } catch (reason) {
    answer(() => fail(reason));
  }
}
