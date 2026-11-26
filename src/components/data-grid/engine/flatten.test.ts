import { describe, expect, it, vi } from 'vitest';
import type { DataGridExpandedGroups, DataGridGroupItem, DataGridKey } from '../types';
import { resolveColumns } from './columns';
import { flattenRows, flattenTree, isGroupOpen, isSavedRow } from './flatten';
import type { FlatDataRow, FlatDetailRow, FlatFormRow, FlatGroupRow, FlatRow } from './flatten';
import { groupRows, groupedRows, rowPlaces } from './group';
import type { GroupNode } from './group';
import { createTextCache } from './values';

describe('flattenRows', () => {
  const rows = [{ id: 'DH-1' }, { id: 'DH-2' }, { id: 'DH-3' }];
  const NOT_GROUPED = { level: 1, groups: [], setsize: 0, posinset: 0 };

  it('makes one data row for each row, in order, at level 1 and in no group', () => {
    const flat = flattenRows(rows, (row) => row.id);
    expect(flat).toEqual([
      { kind: 'data', key: 'DH-1', row: rows[0], ...NOT_GROUPED },
      { kind: 'data', key: 'DH-2', row: rows[1], ...NOT_GROUPED },
      { kind: 'data', key: 'DH-3', row: rows[2], ...NOT_GROUPED },
    ]);
    expect(flat[1]!.row).toBe(rows[1]);
  });

  it('gives getKey the row and its index, once each', () => {
    const getKey = vi.fn((_row: { id: string }, index: number) => index * 10);
    expect(flattenRows(rows, getKey).map((entry) => entry.key)).toEqual([0, 10, 20]);
    expect(getKey).toHaveBeenCalledTimes(3);
    expect(getKey).toHaveBeenNthCalledWith(2, rows[1], 1);
  });

  it('gives back the list it made before from the same rows when every key is the same', () => {
    const before = flattenRows(rows, (row) => row.id);
    expect(flattenRows(rows, (row) => `${row.id}`, before)).toBe(before);
  });

  it('makes a new list when a key differs from the one before', () => {
    const before = flattenRows(rows, (row) => row.id);
    const after = flattenRows(rows, (row, index) => (index === 2 ? 'other' : row.id), before);
    expect(after).not.toBe(before);
    expect(after.map((entry) => entry.key)).toEqual(['DH-1', 'DH-2', 'other']);
  });

  it('keeps each row of a new list whose row object and key are the ones of before', () => {
    const before = flattenRows(rows, (row) => row.id);
    // An immutable edit of one row: a new array, a new object for the row that changed.
    const edited = rows.map((row) => (row.id === 'DH-2' ? { ...row } : row));
    const after = flattenRows(edited, (row) => row.id, before);
    expect(after).not.toBe(before);
    expect(after[0]).toBe(before[0]);
    expect(after[1]).not.toBe(before[1]);
    expect(after[1]!.row).toBe(edited[1]);
    expect(after[2]).toBe(before[2]);
  });

  it('gives back the list it made before for a new array of the same rows', () => {
    const before = flattenRows(rows, (row) => row.id);
    expect(flattenRows([...rows], (row) => row.id, before)).toBe(before);
  });

  it('finds a row of before by its key, so rows that moved are kept and only the list is new', () => {
    const before = flattenRows(rows, (row) => row.id);
    const after = flattenRows([rows[1]!, rows[0]!, rows[2]!], (row) => row.id, before);
    expect(after).not.toBe(before);
    expect(after[0]).toBe(before[1]);
    expect(after[1]).toBe(before[0]);
    expect(after[2]).toBe(before[2]);
  });

  it('puts each row where the places say, and makes a new row when its place is not the one of before', () => {
    const places = [
      { level: 2, groups: ['g'], setsize: 3, posinset: 1 },
      { level: 2, groups: ['g'], setsize: 3, posinset: 2 },
      { level: 2, groups: ['g'], setsize: 3, posinset: 3 },
    ];
    const before = flattenRows(rows, (row) => row.id, undefined, places);
    expect(before[1]).toEqual({ kind: 'data', key: 'DH-2', row: rows[1], ...places[1] });
    const same = places.map((place) => ({ ...place, groups: [...place.groups] }));
    expect(flattenRows(rows, (row) => row.id, before, same)).toBe(before);
    // A row leaves the group: the two that are left are a set of two, and their rows are new.
    const smaller = [
      { level: 2, groups: ['g'], setsize: 2, posinset: 1 },
      { level: 2, groups: ['g'], setsize: 2, posinset: 2 },
    ];
    const after = flattenRows([rows[0]!, rows[1]!], (row) => row.id, before, smaller);
    expect(after[0]).not.toBe(before[0]);
    expect(after[0]).toMatchObject({ setsize: 2, posinset: 1 });
    // Another group is a new row too.
    const moved = flattenRows(
      rows,
      (row) => row.id,
      before,
      places.map((place) => ({ ...place, groups: ['h'] })),
    );
    expect(moved[0]).not.toBe(before[0]);
  });

  it('gives an empty list for no rows, and does not change its input', () => {
    expect(flattenRows([], () => 0)).toEqual([]);
    const copy = [...rows];
    flattenRows(rows, (row) => row.id);
    expect(rows).toEqual(copy);
  });
});

describe('isGroupOpen', () => {
  it('is every group but the exceptions when all are expanded, and the exceptions when none are', () => {
    const open = { allExpanded: true, except: ['a'] };
    const closed = { allExpanded: false, except: ['a'] };
    expect([isGroupOpen(open, 'a'), isGroupOpen(open, 'b')]).toEqual([false, true]);
    expect([isGroupOpen(closed, 'a'), isGroupOpen(closed, 'b')]).toEqual([true, false]);
  });
});

interface Order {
  id: string;
  status: number;
  assignee: string;
}

const COLUMNS = resolveColumns<Order>(
  [
    { field: 'id' },
    {
      field: 'status',
      dataType: 'number',
      lookup: {
        items: [
          { code: 1, name: 'New' },
          { code: 2, name: 'Delivered' },
        ],
        valueField: 'code',
        displayField: 'name',
      },
    },
    { field: 'assignee' },
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
);

const ROWS: Order[] = [
  { id: 'a', status: 2, assignee: 'Bình' },
  { id: 'b', status: 1, assignee: 'An' },
  { id: 'c', status: 2, assignee: 'An' },
  { id: 'd', status: 1, assignee: 'Bình' },
  { id: 'e', status: 2, assignee: 'Bình' },
];

const read = createTextCache<Order>();
const STATUS_THEN_ASSIGNEE: DataGridGroupItem[] = [
  { field: 'status', direction: 'asc' },
  { field: 'assignee', direction: 'asc' },
];
const OPEN: DataGridExpandedGroups = { allExpanded: true, except: [] };

function treeOf(grouping: DataGridGroupItem[], rows: readonly Order[] = ROWS) {
  return groupRows(rows, grouping, COLUMNS, read, 'en-US');
}
function keyedOf(tree: readonly GroupNode<Order>[]) {
  return flattenRows(
    groupedRows(tree),
    (row) => row.id,
    undefined,
    rowPlaces(tree),
  ) as FlatDataRow<Order>[];
}
const hasDetail = (row: Order) => row.id !== 'b';

// The visible list as short words: `g1` is a group row of level 1, `d3` a data row of level 3, `x` a
// detail row.
function outline(flat: readonly FlatRow<Order>[]): string[] {
  return flat.map((row) =>
    row.kind === 'group'
      ? `g${row.level}:${row.node.text}${row.expanded ? '' : '(closed)'}`
      : row.kind === 'detail'
        ? `x:${String(row.key)}`
        : `d${row.level}:${String(row.key)}`,
  );
}

function flatten(
  tree: readonly GroupNode<Order>[] | null,
  options: {
    expanded?: DataGridExpandedGroups;
    expandedRows?: ReadonlySet<DataGridKey>;
    detail?: boolean;
    previous?: readonly FlatRow<Order>[];
    keyed?: readonly FlatDataRow<Order>[];
    added?: readonly FlatDataRow<Order>[];
    newRowPosition?: 'first' | 'last';
    form?: { key: DataGridKey; added: boolean } | null;
  } = {},
) {
  const keyed = options.keyed ?? (tree ? keyedOf(tree) : keyedOf([]));
  return flattenTree(
    {
      tree,
      keyed,
      expanded: options.expanded ?? OPEN,
      expandedRows: options.expandedRows ?? new Set(),
      hasDetail: options.detail ? hasDetail : undefined,
      added: options.added,
      newRowPosition: options.newRowPosition,
      form: options.form,
    },
    options.previous,
  );
}

describe('flattenTree without a tree', () => {
  const plain = flattenRows(ROWS, (row) => row.id) as FlatDataRow<Order>[];

  it('is the keyed rows themselves when there is no detail to add', () => {
    expect(flatten(null, { keyed: plain })).toBe(plain);
    // A detail that no open row asks for adds none either.
    expect(flatten(null, { keyed: plain, detail: true })).toBe(plain);
  });

  it('puts a detail row right after each data row whose key is expanded and that has a detail', () => {
    const flat = flatten(null, {
      keyed: plain,
      detail: true,
      // `b` has no detail, and `zzz` is the key of no row.
      expandedRows: new Set(['a', 'b', 'd', 'zzz']),
    });
    expect(outline(flat)).toEqual(['d1:a', 'x:a', 'd1:b', 'd1:c', 'd1:d', 'x:d', 'd1:e']);
    expect(flat[1]).toEqual({ kind: 'detail', key: 'a', row: ROWS[0], level: 1 });
    expect(flat[0]).toBe(plain[0]);
  });

  it('adds no detail row when the grid has no hasDetail', () => {
    expect(flatten(null, { keyed: plain, expandedRows: new Set(['a']) })).toBe(plain);
  });
});

describe('flattenTree with a tree', () => {
  const tree = treeOf(STATUS_THEN_ASSIGNEE);
  // Delivered (a, c, e): An (c), Bình (a, e); New (b, d): An (b), Bình (d).
  const delivered = tree[0]!;
  const keyed = keyedOf(tree);

  it('draws a group row for each group, open, with its groups or its data rows inside', () => {
    expect(outline(flatten(tree))).toEqual([
      'g1:Delivered',
      'g2:An',
      'd3:c',
      'g2:Bình',
      'd3:a',
      'd3:e',
      'g1:New',
      'g2:An',
      'd3:b',
      'g2:Bình',
      'd3:d',
    ]);
  });

  it('gives each data row the keyed object itself, and each group row its node, level and key', () => {
    const flat = flatten(tree, { keyed });
    expect(flat[0]).toMatchObject({
      kind: 'group',
      key: delivered.key,
      node: delivered,
      level: 1,
      expanded: true,
      continued: false,
    });
    expect(flat[2]).toBe(keyed[0]);
    expect(flat[4]).toBe(keyed[1]);
  });

  it('counts a group among the groups of its level, and a data row among the rows of its group', () => {
    const flat = flatten(tree);
    const groups = flat.filter((row): row is FlatGroupRow<Order> => row.kind === 'group');
    expect(groups.map((row) => [row.level, row.posinset, row.setsize])).toEqual([
      [1, 1, 2],
      [2, 1, 2],
      [2, 2, 2],
      [1, 2, 2],
      [2, 1, 2],
      [2, 2, 2],
    ]);
    const data = flat.filter((row): row is FlatDataRow<Order> => row.kind === 'data');
    expect(data.map((row) => [row.key, row.posinset, row.setsize])).toEqual([
      ['c', 1, 1],
      ['a', 1, 2],
      ['e', 2, 2],
      ['b', 1, 1],
      ['d', 1, 1],
    ]);
  });

  it('shows a closed group as its row alone', () => {
    const flat = flatten(tree, { expanded: { allExpanded: true, except: [delivered.key] } });
    expect(outline(flat).slice(0, 3)).toEqual(['g1:Delivered(closed)', 'g1:New', 'g2:An']);
    expect(flat.filter((row) => row.kind === 'data')).toHaveLength(2);
  });

  it('closes a group of the level below on its own when it is an exception', () => {
    const inner = delivered.children![0]!.key;
    const flat = flatten(tree, { expanded: { allExpanded: true, except: [inner] } });
    expect(outline(flat).slice(0, 5)).toEqual([
      'g1:Delivered',
      'g2:An(closed)',
      'g2:Bình',
      'd3:a',
      'd3:e',
    ]);
  });

  it('opens only the groups of the exceptions when not all are expanded', () => {
    const flat = flatten(tree, { expanded: { allExpanded: false, except: [delivered.key] } });
    // Delivered is open and its groups are not: each is in no exception.
    expect(outline(flat)).toEqual([
      'g1:Delivered',
      'g2:An(closed)',
      'g2:Bình(closed)',
      'g1:New(closed)',
    ]);
    expect(outline(flatten(tree, { expanded: { allExpanded: false, except: [] } }))).toEqual([
      'g1:Delivered(closed)',
      'g1:New(closed)',
    ]);
  });

  it('ignores a key in the exceptions that no group has', () => {
    const flat = flatten(tree, { expanded: { allExpanded: true, except: ['[["nope",1]]'] } });
    expect(flat).toHaveLength(11);
  });

  it('puts a detail row after its data row, at the level of that row, inside open groups only', () => {
    const flat = flatten(tree, { keyed, detail: true, expandedRows: new Set(['a', 'b']) });
    expect(outline(flat)).toEqual([
      'g1:Delivered',
      'g2:An',
      'd3:c',
      'g2:Bình',
      'd3:a',
      'x:a',
      'd3:e',
      'g1:New',
      'g2:An',
      'd3:b',
      'g2:Bình',
      'd3:d',
    ]);
    expect((flat[5] as FlatDetailRow<Order>).level).toBe(3);
    // The master's group closes and takes its detail with it.
    const closed = flatten(tree, {
      keyed,
      detail: true,
      expandedRows: new Set(['a']),
      expanded: { allExpanded: true, except: [delivered.key] },
    });
    expect(closed.some((row) => row.kind === 'detail')).toBe(false);
  });

  it('gives the list it made before when nothing is new', () => {
    const before = flatten(tree, { keyed });
    expect(flatten(tree, { keyed, previous: before })).toBe(before);
  });

  it('changes only the group that was toggled, and the rows that came or went', () => {
    const before = flatten(tree, { keyed });
    const after = flatten(tree, {
      keyed,
      previous: before,
      expanded: { allExpanded: true, except: [delivered.key] },
    });
    expect(after).not.toBe(before);
    // The group that was not toggled, and every row of it, are the objects they were.
    const rowOf = (list: readonly FlatRow<Order>[], key: DataGridKey) =>
      list.find((row) => row.key === key);
    expect(rowOf(after, tree[1]!.key)).toBe(rowOf(before, tree[1]!.key));
    for (const key of ['b', 'd']) expect(rowOf(after, key)).toBe(rowOf(before, key));
    expect(after[0]).not.toBe(before[0]);
    expect(after[0]).toMatchObject({ kind: 'group', expanded: false });
    // Opened again, the rows that come back are the keyed objects, and the list reads as before.
    const again = flatten(tree, { keyed, previous: after });
    expect(outline(again)).toEqual(outline(before));
    expect(again.filter((row) => row.kind === 'data')).toEqual(
      before.filter((row) => row.kind === 'data'),
    );
    expect(rowOf(again, 'c')).toBe(keyed[0]);
  });

  it('keeps a detail row while its row and key are the same', () => {
    const options = { keyed, detail: true, expandedRows: new Set(['a']) };
    const before = flatten(tree, options);
    const after = flatten(tree, {
      ...options,
      previous: before,
      expanded: { allExpanded: true, except: [tree[1]!.key] },
    });
    expect(after.find((row) => row.kind === 'detail')).toBe(
      before.find((row) => row.kind === 'detail'),
    );
  });

  it('numbers the groups of a new tree from what it holds', () => {
    const before = flatten(tree, { keyed });
    // The rows of Delivered An are out (a filter): the groups left are numbered as they stand.
    const fewer = treeOf(
      STATUS_THEN_ASSIGNEE,
      ROWS.filter((row) => row.id !== 'c'),
    );
    const after = flatten(fewer, { keyed: keyedOf(fewer), previous: before });
    const groups = after.filter((row): row is FlatGroupRow<Order> => row.kind === 'group');
    expect(groups.map((row) => [row.node.text, row.posinset, row.setsize])).toEqual([
      ['Delivered', 1, 2],
      ['Bình', 1, 1],
      ['New', 2, 2],
      ['An', 1, 2],
      ['Bình', 2, 2],
    ]);
  });

  it('does not change the tree, the keyed rows or the exceptions', () => {
    const except = [delivered.key];
    flatten(tree, { keyed, expanded: { allExpanded: true, except } });
    expect(except).toEqual([delivered.key]);
    expect(keyed.map((row) => row.key)).toEqual(['c', 'a', 'e', 'b', 'd']);
  });
});

describe('isSavedRow', () => {
  const data = flattenRows(ROWS, (row) => row.id)[0]!;

  it('is true for a data row that is not a new one, and false for every other row', () => {
    expect(isSavedRow(data)).toBe(true);
    expect(isSavedRow({ ...data, added: true })).toBe(false);
    const [group] = flatten(treeOf(STATUS_THEN_ASSIGNEE));
    expect(isSavedRow(group!)).toBe(false);
    const detail: FlatDetailRow<Order> = { kind: 'detail', key: 'a', row: ROWS[0]!, level: 1 };
    expect(isSavedRow(detail)).toBe(false);
    const form: FlatFormRow<Order> = {
      kind: 'form',
      key: 'a',
      row: ROWS[0]!,
      level: 1,
      groups: [],
      added: false,
    };
    expect(isSavedRow(form)).toBe(false);
  });
});

const fresh = (key: string): FlatDataRow<Order> => ({
  kind: 'data',
  key,
  row: { id: key, status: 1, assignee: '' },
  level: 1,
  groups: [],
  setsize: 0,
  posinset: 0,
  added: true,
});

describe('flattenTree with a form row', () => {
  const plain = flattenRows(ROWS, (row) => row.id) as FlatDataRow<Order>[];

  it('puts a form row in place of the data row of its key, with the row, its level and its groups', () => {
    const flat = flatten(null, { keyed: plain, form: { key: 'c', added: false } });
    expect(outline(flat)).toEqual(['d1:a', 'd1:b', 'd1:c', 'd1:d', 'd1:e']);
    expect(flat[2]).toEqual({
      kind: 'form',
      key: 'c',
      row: ROWS[2],
      level: 1,
      groups: [],
      added: false,
    });
    expect(flat[1]).toBe(plain[1]);
  });

  it('keeps the form row inside the groups of its row, at its level', () => {
    const tree = treeOf(STATUS_THEN_ASSIGNEE);
    const flat = flatten(tree, { form: { key: 'a', added: false } });
    const form = flat.find((row): row is FlatFormRow<Order> => row.kind === 'form')!;
    expect(form).toMatchObject({ key: 'a', level: 3 });
    expect(form.groups).toHaveLength(2);
    expect(flat.indexOf(form)).toBe(4);
    expect(flat.filter((row) => row.kind === 'data' && row.key === 'a')).toHaveLength(0);
  });

  it('draws no detail row under a row whose form is open', () => {
    const flat = flatten(null, {
      keyed: plain,
      detail: true,
      expandedRows: new Set(['a', 'c']),
      form: { key: 'a', added: false },
    });
    expect(outline(flat)).toEqual(['d1:a', 'd1:b', 'd1:c', 'x:c', 'd1:d', 'd1:e']);
    expect(flat[0]!.kind).toBe('form');
  });

  it('gives back the list it made before, form row included, when nothing about it changed', () => {
    const form = { key: 'c', added: false };
    const first = flatten(null, { keyed: plain, form });
    expect(flatten(null, { keyed: plain, form: { ...form }, previous: first })).toBe(first);
    const second = flatten(null, {
      keyed: plain,
      form: { key: 'd', added: false },
      previous: first,
    });
    expect(second).not.toBe(first);
    // The row of the form that closed is the data row again, the one that was kept.
    expect(second[2]).toBe(plain[2]);
  });

  it('keeps the form row object of the list before when its row, level and groups are the same', () => {
    const tree = treeOf(STATUS_THEN_ASSIGNEE);
    const keyed = keyedOf(tree);
    const first = flatten(tree, { keyed, form: { key: 'a', added: false } });
    const other = flatten(tree, {
      keyed,
      form: { key: 'a', added: false },
      expanded: { allExpanded: true, except: [tree[1]!.key] },
      previous: first,
    });
    const before = first.find((row) => row.kind === 'form');
    expect(before).toBeDefined();
    expect(other.find((row) => row.kind === 'form')).toBe(before);
  });
});

describe('flattenTree with new rows', () => {
  const plain = flattenRows(ROWS, (row) => row.id) as FlatDataRow<Order>[];
  const added = [fresh('flg-new-1'), fresh('flg-new-2')];

  it('puts them before the list by default and after it with newRowPosition last', () => {
    expect(outline(flatten(null, { keyed: plain, added }))).toEqual([
      'd1:flg-new-1',
      'd1:flg-new-2',
      'd1:a',
      'd1:b',
      'd1:c',
      'd1:d',
      'd1:e',
    ]);
    expect(
      outline(flatten(null, { keyed: plain, added, newRowPosition: 'last' })).slice(-3),
    ).toEqual(['d1:e', 'd1:flg-new-1', 'd1:flg-new-2']);
  });

  it('stands outside every group, at level 1, before the first group row or after the last row', () => {
    const tree = treeOf(STATUS_THEN_ASSIGNEE);
    const first = flatten(tree, { added: [added[0]!] });
    expect(first[0]).toBe(added[0]);
    expect(first[0]).toMatchObject({ level: 1, groups: [], added: true });
    expect(first[1]).toMatchObject({ kind: 'group', level: 1 });
    const last = flatten(tree, { added: [added[0]!], newRowPosition: 'last' });
    expect(last.at(-1)).toBe(added[0]);
    expect(last.at(-2)).toMatchObject({ kind: 'data', key: 'd' });
  });

  it('puts a detail row of an open saved row where it was, and none for a new row', () => {
    const flat = flatten(null, {
      keyed: plain,
      added,
      detail: true,
      expandedRows: new Set(['a', 'flg-new-1']),
    });
    expect(outline(flat)).toEqual([
      'd1:flg-new-1',
      'd1:flg-new-2',
      'd1:a',
      'x:a',
      'd1:b',
      'd1:c',
      'd1:d',
      'd1:e',
    ]);
  });

  it('puts the form row of a new row in its place among the new rows, marked added', () => {
    const flat = flatten(null, { keyed: plain, added, form: { key: 'flg-new-2', added: true } });
    expect(flat[1]).toMatchObject({ kind: 'form', key: 'flg-new-2', added: true, level: 1 });
    expect(flat[1]!.kind === 'form' && flat[1]!.row).toBe(added[1]!.row);
    expect(flat[0]).toBe(added[0]);
  });

  it('gives back the list it made before when the new rows are the same objects', () => {
    const first = flatten(null, { keyed: plain, added });
    expect(flatten(null, { keyed: plain, added: [...added], previous: first })).toBe(first);
    expect(flatten(null, { keyed: plain, added: [added[0]!], previous: first })).not.toBe(first);
  });

  it('is the keyed rows themselves when there are no new rows, no form and nothing to add', () => {
    expect(flatten(null, { keyed: plain, added: [] })).toBe(plain);
  });
});
