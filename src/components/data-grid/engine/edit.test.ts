import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DataGridColumn, DataGridEditing, DataGridKey } from '../types';
import { actionsColumn, resolveColumns, selectColumn } from './columns';
import {
  applyChanges,
  awaitAnswer,
  canDelete,
  canEdit,
  drawsActions,
  editsCells,
  formColumns,
  formSpan,
  freshRow,
  hasEditButton,
  hasFormFields,
  mergeChange,
  overlayRows,
  readBatchSaveError,
  readSaveError,
  rowDiff,
  faultedMarks,
  rowMarks,
  savingChanges,
  sendingMarks,
  settleChanges,
  trimChange,
  withPinned,
} from './edit';
import type { FlatDataRow } from './flatten';
import type { PendingChange } from './edit';

interface Order {
  id: string;
  customer: string;
  qty: number;
  price: number;
  placed: string;
  at: number;
  note?: string;
}

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id' },
  { field: 'customer' },
  { field: 'qty', dataType: 'number' },
  { field: 'placed', dataType: 'date' },
  { field: 'at', dataType: 'datetime' },
  { id: 'total', dataType: 'number', value: (row) => row.qty * row.price },
];
const resolved = resolveColumns(COLUMNS, {
  locale: 'en-US',
  timeZone: 'UTC',
  yes: 'Yes',
  no: 'No',
  allowSorting: true,
  allowResizing: true,
  allowReordering: true,
  allowPinning: true,
  allowHiding: true,
  allowFiltering: true,
  allowHeaderFiltering: true,
  allowGrouping: true,
});

const SAVED: Order = {
  id: 'DH-1',
  customer: 'An',
  qty: 2,
  price: 10,
  placed: '2026-11-01',
  at: Date.UTC(2026, 10, 1, 8),
};
const OTHER: Order = { ...SAVED, id: 'DH-2', customer: 'Bình' };
const ROWS: readonly Order[] = [SAVED, OTHER, { ...SAVED, id: 'DH-3' }];
const rowKey = (row: Order) => row.id;

type Change = PendingChange<Order>;
const update = (data: Partial<Order>, row = SAVED, key: DataGridKey = row.id): Change => ({
  type: 'update',
  key,
  data,
  row,
});
const remove = (row = SAVED, data?: Partial<Order>): Change =>
  data ? { type: 'remove', key: row.id, row, data } : { type: 'remove', key: row.id, row };
const insert = (data: Partial<Order>, key = 'flg-new-1'): Change => ({ type: 'insert', key, data });
const mapOf = (...changes: Change[]) => new Map(changes.map((change) => [change.key, change]));

describe('mergeChange', () => {
  it('gives the change itself when there was none before, and nothing for an undo of nothing', () => {
    const change = update({ qty: 3 });
    expect(mergeChange(undefined, change)).toBe(change);
    expect(mergeChange(undefined, { type: 'undo' })).toBeNull();
  });

  it('merges the data of an update over an update, and keeps the row it was first made on', () => {
    const first = update({ qty: 3, customer: 'Chi' });
    const second = update({ qty: 4 }, { ...SAVED, qty: 3 });
    const merged = mergeChange(first, second);
    expect(merged).toEqual({
      type: 'update',
      key: 'DH-1',
      data: { qty: 4, customer: 'Chi' },
      row: SAVED,
    });
    expect(first.data).toEqual({ qty: 3, customer: 'Chi' });
  });

  it('keeps an insert an insert when it is updated, with the data merged', () => {
    const merged = mergeChange(insert({ customer: 'Dũng' }), {
      type: 'update',
      key: 'flg-new-1',
      data: { qty: 5 },
      row: {} as Order,
    });
    expect(merged).toEqual({
      type: 'insert',
      key: 'flg-new-1',
      data: { customer: 'Dũng', qty: 5 },
    });
  });

  it('forgets a row that was inserted and then removed: it was never saved', () => {
    expect(
      mergeChange(insert({ customer: 'Dũng' }), remove({ ...SAVED, id: 'flg-new-1' })),
    ).toBeNull();
  });

  it('makes a remove of an update that keeps its data, for an undo to restore', () => {
    const merged = mergeChange(update({ qty: 3 }), remove());
    expect(merged).toEqual({ type: 'remove', key: 'DH-1', row: SAVED, data: { qty: 3 } });
  });

  it('makes an undo of a remove the update it kept, or nothing when it kept none', () => {
    expect(mergeChange(remove(), { type: 'undo' })).toBeNull();
    expect(mergeChange(remove(SAVED, { qty: 3 }), { type: 'undo' })).toEqual({
      type: 'update',
      key: 'DH-1',
      data: { qty: 3 },
      row: SAVED,
    });
  });

  it('leaves a remove removed when it is removed again, and merges an update made on it into its data', () => {
    const removed = remove(SAVED, { qty: 3 });
    expect(mergeChange(removed, remove())).toEqual(removed);
    expect(mergeChange(removed, update({ customer: 'Chi' }))).toEqual({
      type: 'remove',
      key: 'DH-1',
      row: SAVED,
      data: { qty: 3, customer: 'Chi' },
    });
  });

  it('leaves an update or an insert as it was when an undo comes to it', () => {
    const changed = update({ qty: 3 });
    expect(mergeChange(changed, { type: 'undo' })).toBe(changed);
  });
});

describe('rowDiff', () => {
  it('gives the fields of the data that differ from the saved row, and {} when none do', () => {
    expect(rowDiff(SAVED, { customer: 'An', qty: 3, price: 10 }, resolved)).toEqual({ qty: 3 });
    expect(rowDiff(SAVED, { customer: 'An', qty: 2 }, resolved)).toEqual({});
    expect(rowDiff(SAVED, {}, resolved)).toEqual({});
  });

  it('takes two blanks for equal: null, undefined, an empty text and NaN', () => {
    const blank = { ...SAVED, note: '' };
    expect(rowDiff(blank, { note: undefined }, resolved)).toEqual({});
    expect(rowDiff(blank, { note: null as never }, resolved)).toEqual({});
    expect(rowDiff({ ...SAVED, qty: Number.NaN }, { qty: undefined }, resolved)).toEqual({});
    expect(rowDiff(blank, { note: 'x' }, resolved)).toEqual({ note: 'x' });
    // A blank against a value is a change, whichever side holds the value.
    expect(rowDiff(SAVED, { note: '' }, resolved)).toEqual({});
    expect(rowDiff({ ...SAVED, note: 'x' }, { note: '' }, resolved)).toEqual({ note: '' });
  });

  it('compares a date by its ISO day, a Date or a string alike', () => {
    const midnight = new Date(Date.UTC(2026, 10, 1));
    expect(rowDiff(SAVED, { placed: midnight as never }, resolved)).toEqual({});
    expect(
      rowDiff({ ...SAVED, placed: midnight as never }, { placed: '2026-11-01' }, resolved),
    ).toEqual({});
    const nextDay = new Date(Date.UTC(2026, 10, 2));
    expect(rowDiff(SAVED, { placed: nextDay as never }, resolved)).toEqual({ placed: nextDay });
    expect(rowDiff(SAVED, { placed: '2026-11-02' }, resolved)).toEqual({ placed: '2026-11-02' });
  });

  it('compares a datetime by its instant', () => {
    const same = new Date(Date.UTC(2026, 10, 1, 8));
    expect(rowDiff(SAVED, { at: same as never }, resolved)).toEqual({});
    const later = new Date(Date.UTC(2026, 10, 1, 9));
    expect(rowDiff(SAVED, { at: later as never }, resolved)).toEqual({ at: later });
  });

  it('compares anything else with Object.is, and a Date that no column reads by its instant', () => {
    expect(rowDiff(SAVED, { price: 10 }, resolved)).toEqual({});
    expect(rowDiff(SAVED, { price: 11 }, resolved)).toEqual({ price: 11 });
    const stamp = new Date(5);
    expect(
      rowDiff({ ...SAVED, note: stamp as never }, { note: new Date(5) as never }, resolved),
    ).toEqual({});
  });

  it('is not fooled by a field the data names that the saved row has not', () => {
    expect(rowDiff(SAVED, { note: 'new' }, resolved)).toEqual({ note: 'new' });
  });
});

describe('trimChange', () => {
  it('drops an update that changes nothing, and cuts the others down to what they change', () => {
    expect(trimChange(update({ qty: 2, customer: 'An' }), resolved)).toBeNull();
    expect(trimChange(update({ qty: 2, customer: 'Chi' }), resolved)).toEqual(
      update({ customer: 'Chi' }),
    );
  });

  it('leaves an insert and a remove as they are', () => {
    const added = insert({ qty: 1 });
    const removed = remove(SAVED, { qty: 3 });
    expect(trimChange(added, resolved)).toBe(added);
    expect(trimChange(removed, resolved)).toBe(removed);
  });
});

describe('applyChanges', () => {
  describe('with no change', () => {
    it('gives the same object every time, which shows every row as it is', () => {
      const first = applyChanges(ROWS, new Map(), rowKey);
      expect(applyChanges(ROWS, new Map(), rowKey)).toBe(first);
      expect(first.shown(SAVED, 'DH-1')).toBe(SAVED);
      expect(first.view(SAVED)).toBe(SAVED);
      expect(first.pinned.size).toBe(0);
      expect(first.deleted.size).toBe(0);
      expect(first.added).toEqual([]);
    });
  });

  describe('a changed row', () => {
    it('is shown as one new object with the fields of the change over it', () => {
      const shown = applyChanges(ROWS, mapOf(update({ qty: 5 })), rowKey);
      const row = shown.shown(SAVED, 'DH-1');
      expect(row).toEqual({ ...SAVED, qty: 5 });
      expect(row).not.toBe(SAVED);
      expect(SAVED.qty).toBe(2);
      // Every other row is the object it was.
      expect(shown.shown(OTHER, 'DH-2')).toBe(OTHER);
    });

    it('keeps the identity of the shown row until its change changes', () => {
      const change = update({ qty: 5 });
      const first = applyChanges(ROWS, mapOf(change), rowKey).shown(SAVED, 'DH-1');
      expect(applyChanges(ROWS, mapOf(change), rowKey).shown(SAVED, 'DH-1')).toBe(first);
      // Another change on another row leaves it alone.
      expect(
        applyChanges(ROWS, mapOf(change, update({ qty: 1 }, OTHER)), rowKey).shown(SAVED, 'DH-1'),
      ).toBe(first);
      const merged = mergeChange(change, update({ customer: 'Chi' }))!;
      expect(applyChanges(ROWS, mapOf(merged), rowKey).shown(SAVED, 'DH-1')).not.toBe(first);
    });

    it('is shown anew when the row of the data is, and keeps the change over it', () => {
      const change = update({ qty: 5 });
      const first = applyChanges(ROWS, mapOf(change), rowKey).shown(SAVED, 'DH-1');
      const edited = { ...SAVED, customer: 'Server' };
      const again = applyChanges([edited, OTHER], mapOf(change), rowKey).shown(edited, 'DH-1');
      expect(again).toEqual({ ...edited, qty: 5 });
      expect(again).not.toBe(first);
    });

    it('shows a computed column from the shown fields', () => {
      const row = applyChanges(ROWS, mapOf(update({ qty: 5 })), rowKey).shown(SAVED, 'DH-1');
      expect(resolved[5]!.value(row)).toBe(50);
    });

    it('is pinned, with the rows of the data that have its key', () => {
      const shown = applyChanges(ROWS, mapOf(update({ qty: 5 }), remove(OTHER)), rowKey);
      expect([...shown.pinned]).toEqual(['DH-1', 'DH-2']);
      expect([...shown.pinnedRows]).toEqual([SAVED, OTHER]);
    });

    it('is pinned with the keys the caller adds, the row being edited', () => {
      const shown = applyChanges(ROWS, mapOf(update({ qty: 5 })), rowKey, ['DH-3', 'DH-9']);
      expect([...shown.pinned].sort()).toEqual(['DH-1', 'DH-3', 'DH-9']);
      // A key that is no row of the data pins no row.
      expect([...shown.pinnedRows]).toEqual([SAVED, ROWS[2]]);
      // And with no change at all, a key to pin is still a result of its own.
      const editing = applyChanges(ROWS, new Map(), rowKey, ['DH-2']);
      expect([...editing.pinned]).toEqual(['DH-2']);
      expect(editing.shown(OTHER, 'DH-2')).toBe(OTHER);
    });
  });

  describe('a removed row', () => {
    it('is in deleted and pinned, and shown as it is unless it keeps data', () => {
      const shown = applyChanges(ROWS, mapOf(remove(OTHER)), rowKey);
      expect([...shown.deleted]).toEqual(['DH-2']);
      expect(shown.shown(OTHER, 'DH-2')).toBe(OTHER);
      const kept = applyChanges(ROWS, mapOf(remove(SAVED, { qty: 9 })), rowKey);
      expect(kept.shown(SAVED, 'DH-1')).toEqual({ ...SAVED, qty: 9 });
    });

    it('is no row to a reader of values for a total', () => {
      const shown = applyChanges(ROWS, mapOf(remove(OTHER), update({ qty: 5 })), rowKey);
      expect(shown.view(OTHER)).toBeNull();
      expect(shown.view(SAVED)).toEqual({ ...SAVED, qty: 5 });
      expect(shown.view(ROWS[2]!)).toBe(ROWS[2]);
    });
  });

  describe('an inserted row', () => {
    it('is added as a row of its data with its key, in the order the changes were made', () => {
      const shown = applyChanges(
        ROWS,
        mapOf(insert({ customer: 'Dũng' }, 'flg-new-2'), update({ qty: 5 }), insert({ qty: 1 })),
        rowKey,
      );
      expect(shown.added).toEqual([
        { key: 'flg-new-2', row: { customer: 'Dũng' } },
        { key: 'flg-new-1', row: { qty: 1 } },
      ]);
      expect(shown.pinned.has('flg-new-2')).toBe(true);
      expect(shown.deleted.size).toBe(0);
    });

    it('keeps the identity of its row until its data changes', () => {
      const change = insert({ customer: 'Dũng' });
      const first = applyChanges(ROWS, mapOf(change), rowKey).added[0]!.row;
      expect(applyChanges(ROWS, mapOf(change), rowKey).added[0]!.row).toBe(first);
      const merged = mergeChange(change, update({ qty: 5 }, {} as Order, 'flg-new-1'))!;
      expect(applyChanges(ROWS, mapOf(merged), rowKey).added[0]!.row).not.toBe(first);
    });
  });
});

describe('savingChanges', () => {
  it('gives one change for each row, in the order they were first made', () => {
    const changes = mapOf(
      insert({ customer: 'Dũng', qty: 1 }),
      update({ qty: 5, customer: 'An' }),
      remove(OTHER),
    );
    expect(savingChanges(changes, resolved)).toEqual([
      { type: 'insert', key: 'flg-new-1', data: { customer: 'Dũng', qty: 1 } },
      { type: 'update', key: 'DH-1', data: { qty: 5 }, row: SAVED },
      { type: 'remove', key: 'DH-2', row: OTHER },
    ]);
  });

  it('does not send an update that changes nothing, nor the data a remove kept', () => {
    const changes = mapOf(update({ qty: 2 }), remove(OTHER, { qty: 9 }));
    expect(savingChanges(changes, resolved)).toEqual([{ type: 'remove', key: 'DH-2', row: OTHER }]);
  });

  it('gives nothing for no changes', () => {
    expect(savingChanges(new Map(), resolved)).toEqual([]);
  });
});

describe('withPinned', () => {
  it('gives back what the step kept when it kept every pinned row, or none is pinned', () => {
    const kept = [ROWS[0]!];
    expect(withPinned(ROWS, kept, new Set())).toBe(kept);
    expect(withPinned(ROWS, kept, new Set([ROWS[0]!]))).toBe(kept);
    expect(withPinned(ROWS, ROWS, new Set([ROWS[1]!]))).toBe(ROWS);
  });

  it('adds the pinned rows the step dropped, in the order of the source', () => {
    const kept = [ROWS[2]!];
    expect(withPinned(ROWS, kept, new Set([ROWS[1]!, ROWS[0]!]))).toEqual([
      ROWS[0],
      ROWS[1],
      ROWS[2],
    ]);
    // A pinned row that is not in the source is not added.
    expect(withPinned(ROWS, kept, new Set([{ ...SAVED, id: 'gone' }]))).toBe(kept);
  });
});

describe('overlayRows', () => {
  const keyed = ROWS.map((row): FlatDataRow<Order> => ({
    kind: 'data',
    key: row.id,
    row,
    level: 1,
    groups: [],
    setsize: 0,
    posinset: 0,
  }));

  it('is the list itself without changes, and when no pinned row is shown otherwise', () => {
    expect(overlayRows(keyed, null, undefined)).toBe(keyed);
    expect(overlayRows(keyed, applyChanges(ROWS, new Map(), rowKey, ['DH-2']), undefined)).toBe(
      keyed,
    );
    expect(overlayRows(keyed, applyChanges(ROWS, mapOf(remove(OTHER)), rowKey), undefined)).toBe(
      keyed,
    );
  });

  it('shows each changed row as a new flat row with the shown row, and leaves the others as they are', () => {
    const list = overlayRows(
      keyed,
      applyChanges(ROWS, mapOf(update({ qty: 5 })), rowKey),
      undefined,
    );
    expect(list).not.toBe(keyed);
    expect(list[0]).toMatchObject({ key: 'DH-1', row: { qty: 5 } });
    expect(list[1]).toBe(keyed[1]);
    expect(list[2]).toBe(keyed[2]);
  });

  it('keeps the flat row of a change while its shown row is the same, and the list it made before', () => {
    const change = update({ qty: 5 });
    const first = overlayRows(keyed, applyChanges(ROWS, mapOf(change), rowKey), undefined);
    const again = overlayRows(keyed, applyChanges(ROWS, mapOf(change), rowKey), first);
    expect(again).toBe(first);
    const other = overlayRows(keyed, applyChanges(ROWS, mapOf(update({ qty: 6 })), rowKey), first);
    expect(other[0]).not.toBe(first[0]);
  });
});

describe('freshRow', () => {
  it('makes a data row of a new row: added, at level 1, in no group, the same object for the same row', () => {
    const added = { key: 'flg-new-1', row: { customer: 'Dũng' } as Order };
    const flat = freshRow(added);
    expect(flat).toEqual({
      kind: 'data',
      key: 'flg-new-1',
      row: added.row,
      level: 1,
      groups: [],
      setsize: 0,
      posinset: 0,
      added: true,
    });
    expect(freshRow({ ...added })).toBe(flat);
    expect(freshRow({ key: 'flg-new-2', row: added.row })).not.toBe(flat);
  });
});

describe('readSaveError', () => {
  const column = (id: string) => resolved.find((one) => one.id === id)!;
  const drawn = [column('customer'), column('qty'), column('total')];
  const FAILED = 'The changes could not be saved.';

  it('says the words of the error when they are a text, else the default words', () => {
    expect(readSaveError({ message: 'Server is busy' }, 'a', drawn, FAILED).message).toBe(
      'Server is busy',
    );
    expect(readSaveError(new Error('Offline'), 'a', drawn, FAILED).message).toBe('Offline');
    for (const reason of [undefined, null, 'no', 42, {}, { message: '' }, { message: 3 }]) {
      expect(readSaveError(reason, 'a', drawn, FAILED).message).toBe(FAILED);
    }
  });

  it('marks the cell of a column the row draws, found by id and then by field', () => {
    const { fields, message } = readSaveError(
      {
        fieldErrors: [
          { key: 'a', field: 'customer', message: 'Taken' },
          { key: 'a', field: 'total', message: 'Too big' },
        ],
      },
      'a',
      drawn,
      FAILED,
    );
    expect([...fields]).toEqual([
      ['customer', 'Taken'],
      ['total', 'Too big'],
    ]);
    expect(message).toBe(FAILED);
    const byField = readSaveError(
      { fieldErrors: [{ key: 'a', field: 'qty', message: 'Odd' }] },
      'a',
      drawn,
      FAILED,
    );
    expect([...byField.fields]).toEqual([['qty', 'Odd']]);
  });

  it('adds the message of a field the row does not draw, or of another row, to the words of the alert', () => {
    const { fields, message } = readSaveError(
      {
        message: 'Refused.',
        fieldErrors: [
          { key: 'a', field: 'placed', message: 'Order date is in the past' },
          { key: 'b', field: 'customer', message: 'Taken' },
        ],
      },
      'a',
      drawn,
      FAILED,
    );
    expect(fields.size).toBe(0);
    expect(message).toBe('Refused. Order date is in the past Taken');
    expect(
      readSaveError({ fieldErrors: [{ key: 'a', field: 'x', message: 'Why' }] }, 'a', [], FAILED)
        .message,
    ).toBe(`${FAILED} Why`);
  });

  it('leaves out what is not a field error: a list that is not one, entries of another shape', () => {
    for (const fieldErrors of [
      'x',
      null,
      {},
      [
        null,
        3,
        { key: 'a' },
        { key: 'a', field: 'customer' },
        { key: 'a', field: 3, message: 'x' },
      ],
      [{ key: 'a', field: 'customer', message: '' }],
    ]) {
      const read = readSaveError({ fieldErrors }, 'a', drawn, FAILED);
      expect(read.fields.size).toBe(0);
      expect(read.message).toBe(FAILED);
    }
  });

  it('keeps the first message of a cell, and reads an inherited field as no field', () => {
    const { fields } = readSaveError(
      {
        fieldErrors: [
          { key: 'a', field: 'customer', message: 'First' },
          { key: 'a', field: 'customer', message: 'Second' },
        ],
      },
      'a',
      drawn,
      FAILED,
    );
    expect([...fields]).toEqual([['customer', 'First']]);
    const inherited = Object.create({
      fieldErrors: [{ key: 'a', field: 'customer', message: 'x' }],
    });
    expect(readSaveError(inherited, 'a', drawn, FAILED).fields.size).toBe(0);
  });
});

describe('readBatchSaveError', () => {
  const column = (id: string) => resolved.find((one) => one.id === id)!;
  const FAILED = 'The changes could not be saved.';
  const rows = new Map([
    ['a', [column('customer'), column('qty')]],
    ['flg-new-1', [column('customer')]],
  ]);

  it('marks the cells each row draws, by row, and says the rest in the words', () => {
    const { faults, message } = readBatchSaveError(
      {
        message: 'Not saved.',
        fieldErrors: [
          { key: 'a', field: 'qty', message: 'Odd' },
          { key: 'flg-new-1', field: 'customer', message: 'Taken' },
          { key: 'a', field: 'hidden', message: 'Not drawn' },
          { key: 'b', field: 'customer', message: 'Other row' },
          { key: 'a', field: 'qty', message: 'Second' },
        ],
      },
      rows,
      FAILED,
    );
    expect([...faults].map(([key, cells]) => [key, [...cells]])).toEqual([
      ['a', [['qty', 'Odd']]],
      ['flg-new-1', [['customer', 'Taken']]],
    ]);
    expect(message).toBe('Not saved. Not drawn Other row');
  });

  it('says the default words, marks nothing and keeps every message for a reason with no field errors', () => {
    const { faults, message } = readBatchSaveError(undefined, rows, FAILED);
    expect(faults.size).toBe(0);
    expect(message).toBe(FAILED);
  });
});

describe('canDelete', () => {
  const ROW: Order = { id: 'a', customer: 'An', qty: 2, price: 5, placed: '2026-11-05', at: 0 };
  const editing = (more: Partial<DataGridEditing<Order>> = {}): DataGridEditing<Order> => ({
    mode: 'row',
    ...more,
  });

  it('is no unless allowDeleting says yes, and no without editing', () => {
    expect(canDelete(ROW, editing())).toBe(false);
    expect(canDelete(ROW, editing({ allowDeleting: false }))).toBe(false);
    expect(canDelete(ROW, editing({ allowDeleting: true }))).toBe(true);
    expect(canDelete(ROW, null)).toBe(false);
  });

  it('asks the function by row, and counts only a true answer', () => {
    expect(canDelete(ROW, editing({ allowDeleting: (row) => row.id === 'a' }))).toBe(true);
    expect(canDelete(ROW, editing({ allowDeleting: (row) => row.id === 'b' }))).toBe(false);
    expect(canDelete(ROW, editing({ allowDeleting: () => undefined as unknown as boolean }))).toBe(
      false,
    );
  });
});

describe('drawsActions', () => {
  it('is yes when updating is not switched off, or deleting can be allowed', () => {
    expect(drawsActions({ mode: 'row' })).toBe(true);
    expect(drawsActions({ mode: 'row', allowUpdating: false })).toBe(false);
    expect(drawsActions({ mode: 'row', allowUpdating: false, allowDeleting: false })).toBe(false);
    expect(drawsActions({ mode: 'row', allowUpdating: false, allowDeleting: true })).toBe(true);
    expect(drawsActions({ mode: 'row', allowUpdating: false, allowDeleting: () => false })).toBe(
      true,
    );
    expect(drawsActions({ mode: 'row', allowUpdating: () => false })).toBe(true);
  });

  it('is yes in a mode that edits a cell only for deleting: it has no Edit button', () => {
    expect(drawsActions({ mode: 'cell' })).toBe(false);
    expect(drawsActions({ mode: 'cell', allowDeleting: true })).toBe(true);
    expect(drawsActions({ mode: 'cell', allowDeleting: () => false })).toBe(true);
  });
});

describe('canEdit', () => {
  const editing = (more: Partial<DataGridEditing<Order>> = {}): DataGridEditing<Order> => ({
    mode: 'row',
    ...more,
  });
  const ROW: Order = { id: 'a', customer: 'An', qty: 2, price: 5, placed: '2026-11-05', at: 0 };
  const column = (id: string) => resolved.find((one) => one.id === id)!;
  const resolvedFor = (columns: DataGridColumn<Order>[]) =>
    resolveColumns(columns, {
      locale: 'en-US',
      timeZone: 'UTC',
      yes: 'Yes',
      no: 'No',
      allowSorting: true,
      allowResizing: true,
      allowReordering: true,
      allowPinning: true,
      allowHiding: true,
      allowFiltering: true,
      allowHeaderFiltering: true,
      allowGrouping: true,
    });

  it('is yes for a field column of a row that may be updated', () => {
    expect(canEdit(column('customer'), ROW, editing())).toBe(true);
  });

  it('is no without editing', () => {
    expect(canEdit(column('customer'), ROW, null)).toBe(false);
  });

  it('follows allowUpdating, a boolean or a function of the row, which is true when it is left out', () => {
    expect(canEdit(column('customer'), ROW, editing({ allowUpdating: false }))).toBe(false);
    expect(canEdit(column('customer'), ROW, editing({ allowUpdating: () => false }))).toBe(false);
    expect(
      canEdit(column('customer'), ROW, editing({ allowUpdating: (row) => row.id === 'a' })),
    ).toBe(true);
  });

  it('lets a new row be edited whatever allowUpdating says', () => {
    expect(canEdit(column('customer'), ROW, editing({ allowUpdating: false }), true)).toBe(true);
  });

  it('follows the allowEditing of the column, which is true when it is left out', () => {
    const [off, fn] = resolvedFor([
      { field: 'customer', allowEditing: false },
      { field: 'qty', dataType: 'number', allowEditing: (row) => row.qty > 5 },
    ]);
    expect(canEdit(off!, ROW, editing())).toBe(false);
    expect(canEdit(fn!, ROW, editing())).toBe(false);
    expect(canEdit(fn!, { ...ROW, qty: 6 }, editing())).toBe(true);
  });

  it('is no for a column that is no data column', () => {
    expect(canEdit(selectColumn<Order>(), ROW, editing())).toBe(false);
    expect(canEdit(actionsColumn<Order>(), ROW, editing())).toBe(false);
  });

  it('is no for a computed column without setValue, and yes with one', () => {
    expect(canEdit(column('total'), ROW, editing())).toBe(false);
    const [withSet] = resolvedFor([
      {
        id: 'total',
        dataType: 'number',
        value: (row) => row.qty * row.price,
        setValue: (row, value) => ({ ...row, qty: (value ?? 0) / 5 }),
      },
    ]);
    expect(canEdit(withSet!, ROW, editing())).toBe(true);
  });

  it('is no for a datetime unless the column has an editor', () => {
    expect(canEdit(column('at'), ROW, editing())).toBe(false);
    const [own] = resolvedFor([{ field: 'at', dataType: 'datetime', editor: () => null }]);
    expect(canEdit(own!, ROW, editing())).toBe(true);
  });

  it('is no for a multiline column in the modes that edit in the cell', () => {
    const [multi] = resolvedFor([{ field: 'customer', multiline: true }]);
    expect(canEdit(multi!, ROW, editing())).toBe(false);
  });
});

describe('editsCells', () => {
  it('is yes for the two modes whose editor is one cell: cell and batch', () => {
    expect(editsCells('cell')).toBe(true);
    expect(editsCells('batch')).toBe(true);
    expect(editsCells('row')).toBe(false);
  });
});

describe('batch mode, as the modes that edit a cell have it', () => {
  it('has no Edit button, and draws the column of buttons for deleting only', () => {
    expect(drawsActions({ mode: 'batch' })).toBe(false);
    expect(drawsActions({ mode: 'batch', allowDeleting: true })).toBe(true);
  });

  it('leaves a multiline column to the form and the popup', () => {
    const [column] = resolveColumns<Order>([{ field: 'note', multiline: true }], {
      locale: 'en-US',
      timeZone: 'UTC',
      yes: 'Yes',
      no: 'No',
      allowSorting: true,
      allowResizing: true,
      allowReordering: true,
      allowPinning: true,
      allowHiding: true,
      allowFiltering: true,
      allowHeaderFiltering: true,
      allowGrouping: true,
    });
    expect(canEdit(column!, SAVED, { mode: 'batch' })).toBe(false);
  });
});

describe('rowMarks', () => {
  const columnIds = (marks: ReturnType<typeof rowMarks>) => [...marks.changed].sort();

  it('marks the cells whose field the change holds, and not a row that is deleted', () => {
    const marks = rowMarks(update({ customer: 'Hoa', qty: 5 }), resolved);
    expect(marks.deleted).toBe(false);
    expect(columnIds(marks)).toEqual(['customer', 'qty']);
    expect(rowMarks(remove(SAVED, { customer: 'Hoa' }), resolved)).toEqual({
      deleted: true,
      changed: new Set(),
    });
  });

  it('does not mark a field that holds what the saved row holds, or a date that is the same day', () => {
    expect(columnIds(rowMarks(update({ customer: 'An', qty: 3 }), resolved))).toEqual(['qty']);
    expect(columnIds(rowMarks(update({ placed: '2026-11-01' }), resolved))).toEqual([]);
    expect(columnIds(rowMarks(update({ placed: '2026-11-02' }), resolved))).toEqual(['placed']);
  });

  it('marks a computed column that has a setValue when its value changed, and one that has none never', () => {
    const [total] = resolveColumns<Order>(
      [
        {
          id: 'total',
          dataType: 'number',
          value: (row) => row.qty * row.price,
          setValue: (_row, value) => ({ qty: Number(value) / 10 }),
        },
        { field: 'qty', dataType: 'number' },
      ],
      {
        locale: 'en-US',
        timeZone: 'UTC',
        yes: 'Yes',
        no: 'No',
        allowSorting: true,
        allowResizing: true,
        allowReordering: true,
        allowPinning: true,
        allowHiding: true,
        allowFiltering: true,
        allowHeaderFiltering: true,
        allowGrouping: true,
      },
    ).slice(0, 1);
    expect(columnIds(rowMarks(update({ qty: 4 }), [total!]))).toEqual(['total']);
    expect(columnIds(rowMarks(update({ qty: 2 }), [total!]))).toEqual([]);
    // The `total` of the shared columns reads `qty` and has no setValue: it is no cell the user changed.
    expect(columnIds(rowMarks(update({ qty: 4 }), resolved))).toEqual(['qty']);
  });
});

describe('form mode', () => {
  const options = {
    locale: 'en-US',
    timeZone: 'UTC',
    yes: 'Yes',
    no: 'No',
    allowSorting: true,
    allowResizing: true,
    allowReordering: true,
    allowPinning: true,
    allowHiding: true,
    allowFiltering: true,
    allowHeaderFiltering: true,
    allowGrouping: true,
  };
  const FORM: DataGridColumn<Order>[] = [
    { field: 'id' },
    { field: 'customer' },
    { field: 'note', multiline: true },
    { field: 'qty', dataType: 'number', form: { visible: false } },
    { field: 'price', dataType: 'number', form: { span: 2 } },
  ];
  const columns = resolveColumns(FORM, options);
  const column = (id: string) => columns.find((one) => one.id === id)!;

  it('has the fields of a form in the form and the popup modes, and in no other', () => {
    expect(hasFormFields('form')).toBe(true);
    expect(hasFormFields('popup')).toBe(true);
    for (const mode of ['row', 'cell', 'batch'] as const) expect(hasFormFields(mode)).toBe(false);
  });

  it('has an Edit button and a column of buttons in the popup as in the form, and edits a multiline column', () => {
    expect(hasEditButton('popup')).toBe(true);
    expect(editsCells('popup')).toBe(false);
    expect(drawsActions({ mode: 'popup' })).toBe(true);
    expect(drawsActions({ mode: 'popup', allowUpdating: false })).toBe(false);
    expect(drawsActions({ mode: 'popup', allowUpdating: false, allowAdding: true })).toBe(false);
    expect(canEdit(column('note'), SAVED, { mode: 'popup' })).toBe(true);
  });

  it('has an Edit button and a column of buttons, as row mode has', () => {
    expect(hasEditButton('form')).toBe(true);
    expect(editsCells('form')).toBe(false);
    expect(drawsActions({ mode: 'form' })).toBe(true);
    expect(drawsActions({ mode: 'form', allowUpdating: false })).toBe(false);
    expect(drawsActions({ mode: 'form', allowUpdating: false, allowDeleting: true })).toBe(true);
    // A new row has its own form, with its own buttons: adding needs no column.
    expect(drawsActions({ mode: 'form', allowUpdating: false, allowAdding: true })).toBe(false);
  });

  it('edits a multiline column in the form, which the modes that edit in the cell do not', () => {
    expect(canEdit(column('note'), SAVED, { mode: 'form' })).toBe(true);
    expect(canEdit(column('note'), SAVED, { mode: 'row' })).toBe(false);
  });

  it('lists the data columns in the order given, hidden ones too, but those that say form.visible false', () => {
    const order = ['price', 'qty', 'id', 'flg:actions', 'note', 'customer', 'gone'];
    const all = [...columns, actionsColumn<Order>()];
    expect(formColumns(all, order).map((one) => one.id)).toEqual([
      'price',
      'id',
      'note',
      'customer',
    ]);
  });

  it('spans two columns for a multiline string column and for form.span 2, one otherwise', () => {
    expect(formSpan(column('note'))).toBe(2);
    expect(formSpan(column('price'))).toBe(2);
    expect(formSpan(column('customer'))).toBe(1);
    const [number] = resolveColumns<Order>(
      [{ field: 'qty', dataType: 'number', multiline: true }],
      options,
    );
    expect(formSpan(number!)).toBe(1);
  });
});

/** A thenable made of a `then` that is given the resolve callback. */
const thenable = (then: (yes: () => void) => void): PromiseLike<void> =>
  ({ then }) as unknown as PromiseLike<void>;

describe('awaitAnswer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('runs ok when the answer resolves, and fail when it rejects', async () => {
    const ok = vi.fn();
    const fail = vi.fn();
    awaitAnswer(Promise.resolve(), ok, fail);
    awaitAnswer(Promise.reject(new Error('no')), ok, fail);
    await Promise.resolve();
    await Promise.resolve();
    expect(ok).toHaveBeenCalledTimes(1);
    expect(fail).toHaveBeenCalledTimes(1);
  });

  it('takes a then that throws for a refusal, once', () => {
    const ok = vi.fn();
    const fail = vi.fn();
    const reason = new Error('then threw');
    awaitAnswer(
      thenable(() => {
        throw reason;
      }),
      ok,
      fail,
    );
    expect(fail).toHaveBeenCalledExactlyOnceWith(reason);
    expect(ok).not.toHaveBeenCalled();
  });

  it('does not run a second callback of a then that answers and then throws', () => {
    const ok = vi.fn();
    const fail = vi.fn();
    awaitAnswer(
      thenable((yes) => {
        yes();
        throw new Error('late');
      }),
      ok,
      fail,
    );
    expect(ok).toHaveBeenCalledTimes(1);
    expect(fail).not.toHaveBeenCalled();
  });

  it('reports what a callback throws from a microtask, not as a rejection of the grid chain', () => {
    const queued: (() => void)[] = [];
    vi.spyOn(globalThis, 'queueMicrotask').mockImplementation((run) => void queued.push(run));
    const boom = new Error('done threw');
    awaitAnswer(
      thenable((yes) => yes()),
      () => {
        throw boom;
      },
      () => {},
    );
    expect(queued).toHaveLength(1);
    expect(queued[0]).toThrow(boom);
  });
});

describe('sendingMarks', () => {
  it('adds sending to the marks a row has, the same object while they are the same', () => {
    const change: PendingChange<Order> = {
      type: 'update',
      key: 'DH-1',
      data: { qty: 9 },
      row: SAVED,
    };
    const base = rowMarks(change, resolved);
    const marks = sendingMarks(base);
    expect(marks).toMatchObject({ deleted: false, sending: true });
    expect(marks.changed).toBe(base.changed);
    expect(sendingMarks(base)).toBe(marks);
    expect(base).not.toHaveProperty('sending');
  });

  it('gives a row with no marks (a new row) its own', () => {
    expect(sendingMarks(undefined)).toMatchObject({ deleted: false, sending: true });
    expect(sendingMarks(undefined)).toBe(sendingMarks(undefined));
  });
});

describe('settleChanges', () => {
  const update = (data: Partial<Order>): PendingChange<Order> => ({
    type: 'update',
    key: 'DH-1',
    data,
    row: SAVED,
  });
  const remove = (): PendingChange<Order> => ({ type: 'remove', key: 'DH-1', row: SAVED });

  it('leaves nothing of a change that is the one that was sent', () => {
    const sent = update({ qty: 9 });
    expect(settleChanges(new Map([['DH-1', sent]]), new Map([['DH-1', sent]]), resolved).size).toBe(
      0,
    );
  });

  it('keeps a change of another row, as it is', () => {
    const other: PendingChange<Order> = { ...update({ qty: 9 }), key: 'DH-2' };
    const rest = settleChanges(new Map([['DH-2', other]]), new Map(), resolved);
    expect(rest.get('DH-2')).toBe(other);
  });

  it('keeps only what was changed again after the update was sent, over the row as saved now', () => {
    const sent = update({ customer: 'Hoa' });
    const again = update({ customer: 'Hoa', qty: 9 });
    const rest = settleChanges(new Map([['DH-1', again]]), new Map([['DH-1', sent]]), resolved);
    expect(rest.get('DH-1')).toMatchObject({
      type: 'update',
      data: { qty: 9 },
      row: { customer: 'Hoa', qty: SAVED.qty },
    });
  });

  it('settles a remove that was sent by its type: a remove made anew is the same delete', () => {
    const rest = settleChanges(
      new Map([['DH-1', remove()]]),
      new Map([['DH-1', remove()]]),
      resolved,
    );
    expect(rest.size).toBe(0);
  });
});

describe('faultedMarks', () => {
  it('adds the faults to the marks a row has, the same object while both are', () => {
    const change: PendingChange<Order> = {
      type: 'update',
      key: 'DH-1',
      data: { qty: 9 },
      row: SAVED,
    };
    const base = rowMarks(change, resolved);
    const invalid = new Map([['customer', 'Taken']]);
    const marks = faultedMarks(base, invalid);
    expect(marks).toMatchObject({ deleted: false, invalid });
    expect(marks.changed).toBe(base.changed);
    expect(faultedMarks(base, invalid)).toBe(marks);
    expect(faultedMarks(base, new Map(invalid))).not.toBe(marks);
    expect(sendingMarks(marks)).toBe(sendingMarks(marks));
  });

  it('gives a row with no marks the faults alone', () => {
    const invalid = new Map([['customer', 'Taken']]);
    expect(faultedMarks(undefined, invalid)).toMatchObject({ deleted: false, invalid });
    expect(faultedMarks(undefined, invalid)).toBe(faultedMarks(undefined, invalid));
  });
});
