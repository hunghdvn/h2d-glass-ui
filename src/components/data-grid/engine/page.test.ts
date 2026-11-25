import { describe, expect, it } from 'vitest';
import type { DataGridGroupItem, DataGridKey } from '../types';
import { resolveColumns } from './columns';
import { flattenRows, flattenTree } from './flatten';
import type { FlatDataRow, FlatFormRow, FlatGroupRow, FlatRow } from './flatten';
import { groupRows, groupedRows, rowPlaces } from './group';
import { clampPageIndex, countRows, fallbackPage, pageCount, pageRows } from './page';
import { createTextCache } from './values';

function flat(count: number): FlatRow<{ n: number }>[] {
  return flattenRows(
    Array.from({ length: count }, (_, index) => ({ n: index })),
    (row) => row.n,
  ).slice();
}

describe('pageCount', () => {
  it('rounds up', () => {
    expect(pageCount(135, 12)).toBe(12);
    expect(pageCount(120, 12)).toBe(10);
    expect(pageCount(121, 12)).toBe(11);
    expect(pageCount(1, 20)).toBe(1);
  });

  it('is at least 1, even with no rows', () => {
    expect(pageCount(0, 20)).toBe(1);
  });

  it('is 1 for a size that is not a number above 0', () => {
    for (const size of [0, -5, Number.NaN, Infinity]) expect(pageCount(50, size)).toBe(1);
  });

  it('reads a fractional size as its whole part', () => {
    expect(pageCount(10, 2.9)).toBe(5);
  });
});

describe('clampPageIndex', () => {
  it('keeps an index that is in range', () => {
    expect(clampPageIndex(0, 135, 12)).toBe(0);
    expect(clampPageIndex(5, 135, 12)).toBe(5);
    expect(clampPageIndex(11, 135, 12)).toBe(11);
  });

  it('brings an index past the end back to the last page, and one below 0 to 0', () => {
    expect(clampPageIndex(12, 135, 12)).toBe(11);
    expect(clampPageIndex(1000, 135, 12)).toBe(11);
    expect(clampPageIndex(-3, 135, 12)).toBe(0);
  });

  it('gives a whole number: a fraction is cut, anything not finite is 0', () => {
    expect(clampPageIndex(2.8, 135, 12)).toBe(2);
    for (const index of [Number.NaN, Infinity, -Infinity]) {
      expect(clampPageIndex(index, 135, 12)).toBe(0);
    }
  });

  it('is 0 when there are no rows', () => {
    expect(clampPageIndex(4, 0, 12)).toBe(0);
  });
});

describe('pageRows of data rows', () => {
  it('cuts the rows of a page', () => {
    const page = pageRows(flat(30), { index: 1, size: 12 });
    expect(page).toHaveLength(12);
    expect(page[0]!.key).toBe(12);
    expect(page.at(-1)!.key).toBe(23);
  });

  it('gives a short last page', () => {
    expect(pageRows(flat(30), { index: 2, size: 12 })).toHaveLength(6);
  });

  it('cuts the clamped page, so a page past the end shows the last one', () => {
    expect(pageRows(flat(30), { index: 9, size: 12 })[0]!.key).toBe(24);
    expect(pageRows(flat(30), { index: -1, size: 12 })[0]!.key).toBe(0);
  });

  it('gives nothing for no rows', () => {
    expect(pageRows([], { index: 3, size: 10 })).toEqual([]);
  });

  it('gives every row for a size that is not a number above 0', () => {
    expect(pageRows(flat(5), { index: 0, size: 0 })).toHaveLength(5);
    expect(pageRows(flat(5), { index: 2, size: Number.NaN })).toHaveLength(5);
  });

  it('does not change what it is given', () => {
    const rows = flat(30);
    pageRows(rows, { index: 1, size: 12 });
    expect(rows).toHaveLength(30);
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
const GROUPING: DataGridGroupItem[] = [
  { field: 'status', direction: 'asc' },
  { field: 'assignee', direction: 'asc' },
];

// The whole list, all groups open: Delivered (An: c; Bình: a, e), New (An: b; Bình: d) is 6 group
// rows and 5 data rows. `details` are the keys whose detail row is open.
function grouped(details: DataGridKey[] = []): FlatRow<Order>[] {
  const tree = groupRows(ROWS, GROUPING, COLUMNS, createTextCache<Order>(), 'en-US');
  const keyed = flattenRows(
    groupedRows(tree),
    (row) => row.id,
    undefined,
    rowPlaces(tree),
  ) as FlatDataRow<Order>[];
  return flattenTree(
    {
      tree,
      keyed,
      expanded: { allExpanded: true, except: [] },
      expandedRows: new Set(details),
      hasDetail: () => true,
    },
    undefined,
  ).slice();
}

// A page as short words: `g1:Delivered*` is a repeated group row, `d` a data row, `x` a detail row.
function outline(rows: readonly FlatRow<Order>[]): string[] {
  return rows.map((row) =>
    row.kind === 'group'
      ? `g${row.level}:${row.node.text}${row.continued ? '*' : ''}`
      : row.kind === 'detail'
        ? `x:${String(row.key)}`
        : `d:${String(row.key)}`,
  );
}

describe('countRows', () => {
  it('counts the data rows and the group rows, and neither a detail row nor a repeated group row', () => {
    expect(countRows(grouped())).toBe(11);
    expect(countRows(grouped(['a', 'd']))).toBe(11);
    expect(countRows(pageRows(grouped(), { index: 1, size: 4 }))).toBe(4);
    expect(countRows([])).toBe(0);
    expect(countRows(flat(7))).toBe(7);
  });
});

describe('pageRows of groups and details', () => {
  it('cuts by the rows it counts, group rows included', () => {
    const rows = grouped();
    expect(outline(pageRows(rows, { index: 0, size: 4 }))).toEqual([
      'g1:Delivered',
      'g2:An',
      'd:c',
      'g2:Bình',
    ]);
  });

  it('repeats the groups a page starts inside, first, marked as continued', () => {
    const rows = grouped();
    expect(outline(pageRows(rows, { index: 1, size: 4 }))).toEqual([
      'g1:Delivered*',
      'g2:Bình*',
      'd:a',
      'd:e',
      'g1:New',
      'g2:An',
    ]);
    expect(outline(pageRows(rows, { index: 2, size: 4 }))).toEqual([
      'g1:New*',
      'g2:An*',
      'd:b',
      'g2:Bình',
      'd:d',
    ]);
  });

  it('repeats the groups above a page that starts on a group row, and none when it starts on level 1', () => {
    const rows = grouped();
    expect(outline(pageRows(rows, { index: 1, size: 3 }))).toEqual([
      'g1:Delivered*',
      'g2:Bình',
      'd:a',
      'd:e',
    ]);
    expect(outline(pageRows(rows, { index: 1, size: 6 }))[0]).toBe('g1:New');
  });

  it('makes the repeated group a new object of the same group, with the same place and count', () => {
    const rows = grouped();
    const page = pageRows(rows, { index: 1, size: 4 });
    const repeated = page[0] as FlatGroupRow<Order>;
    const original = rows[0] as FlatGroupRow<Order>;
    expect(repeated).not.toBe(original);
    expect(repeated).toEqual({ ...original, continued: true });
    expect(repeated.node).toBe(original.node);
  });

  it('keeps a detail row with its master, even when the master is the last row counted', () => {
    const rows = grouped(['a']);
    expect(outline(pageRows(rows, { index: 0, size: 5 }))).toEqual([
      'g1:Delivered',
      'g2:An',
      'd:c',
      'g2:Bình',
      'd:a',
      'x:a',
    ]);
    // The next page does not start on the detail row, and does not hold it twice.
    expect(outline(pageRows(rows, { index: 1, size: 5 }))).toEqual([
      'g1:Delivered*',
      'g2:Bình*',
      'd:e',
      'g1:New',
      'g2:An',
      'd:b',
      'g2:Bình',
    ]);
  });

  it('does not count a detail row in the size of a page', () => {
    const rows = grouped(['a', 'e']);
    const page = pageRows(rows, { index: 1, size: 4 });
    expect(outline(page)).toEqual([
      'g1:Delivered*',
      'g2:Bình*',
      'd:a',
      'x:a',
      'd:e',
      'x:e',
      'g1:New',
      'g2:An',
    ]);
    expect(countRows(page)).toBe(4);
  });

  it('cuts the clamped page, so a page past the end shows the last one', () => {
    const rows = grouped();
    expect(outline(pageRows(rows, { index: 99, size: 4 }))).toEqual(
      outline(pageRows(rows, { index: 2, size: 4 })),
    );
    expect(outline(pageRows(rows, { index: -1, size: 4 }))[0]).toBe('g1:Delivered');
  });

  it('gives the whole list for a size that is not a number above 0', () => {
    expect(pageRows(grouped(['a']), { index: 3, size: 0 })).toHaveLength(12);
  });

  it('gives the same page for the same list, and does not change the list', () => {
    const rows = grouped(['a']);
    const copy = [...rows];
    expect(outline(pageRows(rows, { index: 1, size: 4 }))).toEqual(
      outline(pageRows(rows, { index: 1, size: 4 })),
    );
    expect(rows).toEqual(copy);
  });
});

describe('fallbackPage', () => {
  const rows = grouped();
  const group = (text: string, level: number, under: string) => {
    const found = rows.find(
      (row): row is FlatGroupRow<Order> =>
        row.kind === 'group' &&
        row.node.text === text &&
        row.level === level &&
        (level === 1 || row.node.path[0]!.value === (under === 'Delivered' ? 2 : 1)),
    )!;
    return found;
  };
  const delivered = group('Delivered', 1, '');
  const nextNew = group('New', 1, '');
  const bình = group('Bình', 2, 'Delivered');
  const data = (key: string) => rows.find((row) => row.kind === 'data' && row.key === key)!;
  const dataPlace = (key: string) => {
    const row = data(key) as FlatDataRow<Order>;
    return { kind: 'data' as const, key, groups: row.groups };
  };

  // Four counted rows a page: Delivered, An, c, Bình | a, e, New, An | b, Bình, d.
  it('is the page of the closing group row, for a place on a row of it on another page', () => {
    expect(fallbackPage(rows, dataPlace('e'), delivered.key, 4)).toBe(0);
    expect(fallbackPage(rows, dataPlace('e'), bình.key, 4)).toBe(0);
    expect(fallbackPage(rows, dataPlace('b'), nextNew.key, 4)).toBe(1);
  });

  it('is the page of the group row for a place on a group row, too', () => {
    const place = { kind: 'group' as const, key: bình.key, groups: [delivered.key] };
    expect(fallbackPage(rows, place, bình.key, 4)).toBe(0);
    expect(fallbackPage(rows, place, delivered.key, 4)).toBe(0);
  });

  it('is null when the place is not inside the group that closes', () => {
    expect(fallbackPage(rows, dataPlace('e'), nextNew.key, 4)).toBeNull();
    expect(fallbackPage(rows, dataPlace('e'), 'no such group', 4)).toBeNull();
  });

  it('goes to the outermost group of the place when every group closes', () => {
    expect(fallbackPage(rows, dataPlace('d'), null, 4)).toBe(1);
    expect(fallbackPage(rows, dataPlace('e'), null, 4)).toBe(0);
    const place = { kind: 'group' as const, key: nextNew.key, groups: [] };
    expect(fallbackPage(rows, place, null, 4)).toBe(1);
  });

  it('is null for a list with no group, and 0 for a size that makes one page', () => {
    expect(fallbackPage(flat(5), { kind: 'data', key: 2, groups: [] }, null, 2)).toBeNull();
    expect(fallbackPage(rows, dataPlace('d'), null, 0)).toBe(0);
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
const formOf = (row: FlatDataRow<Order>, added = false): FlatFormRow<Order> => ({
  kind: 'form',
  key: row.key,
  row: row.row,
  level: row.level,
  groups: row.groups,
  added,
});

describe('a form row', () => {
  const rows = ROWS.map((row, at): FlatDataRow<Order> => ({
    kind: 'data',
    key: row.id,
    row,
    level: 1,
    groups: [],
    setsize: 0,
    posinset: at,
  }));

  it("is counted as the row it stands for, and a new row's form is not counted", () => {
    const withForm = [rows[0]!, formOf(rows[1]!), ...rows.slice(2)];
    expect(countRows(withForm)).toBe(5);
    expect(countRows([formOf(fresh('flg-new-1'), true), ...rows])).toBe(5);
  });

  it('takes the place of its row in a page: the page cuts the rows it counts as before', () => {
    const list = rows.map((row, at) => (at === 3 ? formOf(row) : row));
    const page = pageRows(list, { index: 1, size: 3 });
    expect(page.map((row) => row.kind)).toEqual(['form', 'data']);
  });
});

describe('new rows', () => {
  const [one, two] = [fresh('flg-new-1'), fresh('flg-new-2')] as [
    FlatDataRow<Order>,
    FlatDataRow<Order>,
  ];

  it('are not counted: a list of them alone counts none', () => {
    expect(countRows([one, two])).toBe(0);
    expect(countRows([one, ...grouped(), two])).toBe(11);
  });

  it('stand at the top of every page when they are first in the list, before its continued groups', () => {
    const rows = [one, two, ...grouped()];
    expect(outline(pageRows(rows, { index: 0, size: 4 }))).toEqual([
      'd:flg-new-1',
      'd:flg-new-2',
      'g1:Delivered',
      'g2:An',
      'd:c',
      'g2:Bình',
    ]);
    expect(outline(pageRows(rows, { index: 1, size: 4 }))).toEqual([
      'd:flg-new-1',
      'd:flg-new-2',
      'g1:Delivered*',
      'g2:Bình*',
      'd:a',
      'd:e',
      'g1:New',
      'g2:An',
    ]);
  });

  it('stand at the bottom of every page when they are last in the list', () => {
    const rows = [...flat(30), one, two] as FlatRow<{ n: number }>[];
    const page = pageRows(rows, { index: 1, size: 12 });
    expect(page.map((row) => row.key).slice(0, 2)).toEqual([12, 13]);
    expect(page.slice(-2).map((row) => row.key)).toEqual(['flg-new-1', 'flg-new-2']);
    expect(page).toHaveLength(14);
    const last = pageRows(rows, { index: 2, size: 12 });
    expect(last).toHaveLength(8);
    expect(last.slice(-2).map((row) => row.key)).toEqual(['flg-new-1', 'flg-new-2']);
  });

  it('take no place in the page: the rows a page counts are the same with and without them', () => {
    const rows = flat(30);
    const bare = pageRows(rows, { index: 1, size: 12 }).map((row) => row.key);
    const withNew = pageRows([one, two, ...rows] as FlatRow<{ n: number }>[], {
      index: 1,
      size: 12,
    });
    expect(withNew.slice(2).map((row) => row.key)).toEqual(bare);
  });

  it('are the whole page of a list with no other row, and come with a whole list', () => {
    expect(pageRows([one, two], { index: 0, size: 5 })).toEqual([one, two]);
    expect(
      pageRows([one, ...flat(3)] as FlatRow<{ n: number }>[], { index: 0, size: 0 }),
    ).toHaveLength(4);
  });
});
