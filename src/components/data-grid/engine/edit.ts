import type { DataGridChange, DataGridDataType, DataGridKey } from '../types';
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
