import { describe, expect, it } from 'vitest';
import type { FlatRow } from '../engine/flatten';
import { groupKey } from '../engine/group';
import { groupsAbove, isRowOf, resolvePlace, samePlace, samePosition } from './grid-place';
import type { ActiveCell, Position } from './grid-place';

// Where the keyboard is, as a place in the rows and the columns (spec phase 6 §3.6): said by a row's kind
// and key and a column id, so a sort, a page or a window does not lose it.

const data = (key: number, groups: readonly string[] = []): FlatRow<unknown> => ({
  kind: 'data',
  key,
  row: { key },
  level: groups.length + 1,
  groups,
  setsize: 0,
  posinset: 0,
});
const step = (value: string) => ({ field: 'f', value });
const group = (path: readonly { field: string; value: unknown }[]): FlatRow<unknown> =>
  ({
    kind: 'group',
    key: groupKey(path as never),
    node: { path },
    level: path.length,
    expanded: true,
    setsize: 0,
    posinset: 0,
    continued: false,
  }) as unknown as FlatRow<unknown>;
const detail = (key: number): FlatRow<unknown> => ({ kind: 'detail', key, row: { key }, level: 1 });
const form = (key: number, groups: readonly string[] = [], added = false): FlatRow<unknown> => ({
  kind: 'form',
  key,
  row: { key },
  level: groups.length + 1,
  groups,
  added,
});

const COLUMNS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const body = (
  key: number,
  column = 'b',
  groups: readonly string[] = [],
  kind = 'data',
): ActiveCell => ({ area: 'body', key, kind, groups, column }) as ActiveCell;
const at = (cell: ActiveCell | null, index = 0, columnIndex = 0): Position => ({
  cell,
  index,
  columnIndex,
});

describe('resolvePlace', () => {
  const rows = [data(1), data(2), data(3)];

  it('finds a row by its key, at the index it was last seen at', () => {
    expect(resolvePlace(at(body(2), 1), rows, COLUMNS)).toEqual({ row: 1, column: 1 });
  });

  it('finds a row by its key when it moved from the index it was last seen at', () => {
    expect(resolvePlace(at(body(3), 0), rows, COLUMNS)).toEqual({ row: 2, column: 1 });
  });

  it('goes to the row now at the index when the key is gone', () => {
    expect(resolvePlace(at(body(9), 1), rows, COLUMNS)).toEqual({ row: 1, column: 1 });
    expect(resolvePlace(at(body(9), 7), rows, COLUMNS)).toEqual({ row: 2, column: 1 });
  });

  it('goes to the column now at the index when the column is gone', () => {
    expect(resolvePlace(at(body(2, 'gone'), 1, 2), rows, COLUMNS)).toEqual({ row: 1, column: 2 });
    expect(resolvePlace(at(body(2, 'gone'), 1, 9), rows, COLUMNS)).toEqual({ row: 1, column: 2 });
  });

  it('is nothing without columns', () => {
    expect(resolvePlace(at(body(1)), rows, [])).toBeNull();
  });

  it('finds a group row by its key, and does not take a data row of the same key for it', () => {
    const key = groupKey([step('x')] as never) as unknown as number;
    const list = [group([step('x')]), data(1), data(key)];
    expect(resolvePlace(at(body(key, 'a', [], 'group'), 0), list, COLUMNS)).toEqual({
      row: 0,
      column: 0,
    });
    // A data row with the same key is no group row: the index it was last seen at holds a group row.
    expect(resolvePlace(at(body(key, 'a', [], 'data'), 0), list, COLUMNS)).toEqual({
      row: 2,
      column: 0,
    });
  });

  it('goes to the nearest group still in the list when a group closes under the place', () => {
    const outer = group([step('x')]);
    const inner = group([step('x'), step('y')]);
    const keys = [outer, inner].map((row) => row.key as string);
    const place = at(body(5, 'a', keys), 3);
    expect(resolvePlace(place, [outer, inner], COLUMNS)).toEqual({ row: 1, column: 0 });
    expect(resolvePlace(place, [outer], COLUMNS)).toEqual({ row: 0, column: 0 });
  });

  it('goes to the master when a detail row is gone', () => {
    expect(resolvePlace(at(body(2, 'b', [], 'detail'), 2), rows, COLUMNS)).toEqual({
      row: 1,
      column: 1,
    });
  });

  it('keeps a title in the titles, and the filter row as the last heading row', () => {
    expect(resolvePlace(at({ area: 'header', column: 'c' }), rows, COLUMNS, false, 2)).toEqual({
      row: -2,
      column: 2,
    });
    expect(resolvePlace(at({ area: 'filter', column: 'c' }), rows, COLUMNS, false, 1)).toEqual({
      row: -1,
      column: 2,
    });
  });

  it('is the first cell of the first row before anything was chosen', () => {
    expect(resolvePlace(at(null), rows, COLUMNS)).toEqual({ row: 0, column: 0 });
  });

  it('is the empty cell of a grid whose filter keeps no row, and the title of one that has none', () => {
    expect(resolvePlace(at(body(1)), [], COLUMNS, true)).toEqual({ row: 0, column: 1 });
    expect(resolvePlace(at(body(1)), [], COLUMNS, false, 2)).toEqual({ row: -2, column: 1 });
  });

  it('puts the footer past the last row, or on the last row when the grid has none', () => {
    const footer = at({ area: 'footer', column: 'b' });
    expect(resolvePlace(footer, rows, COLUMNS, false, 1, true)).toEqual({ row: 3, column: 1 });
    expect(resolvePlace(footer, rows, COLUMNS, false, 1, false)).toEqual({ row: 2, column: 1 });
  });

  it('puts the empty cell back on the first cell once rows are back', () => {
    expect(resolvePlace(at({ area: 'empty', column: 'c' }), rows, COLUMNS)).toEqual({
      row: 0,
      column: 0,
    });
  });
});

describe('resolvePlace with a form row', () => {
  it('stays on the row when its form opens: the data row and the form row of a key are one row', () => {
    const rows = [data(1), form(2), data(3)];
    expect(resolvePlace(at(body(2), 1), rows, COLUMNS)).toEqual({ row: 1, column: 1 });
    // The row moved while the form was open: found by its key, whichever of the two it is now.
    expect(resolvePlace(at(body(2), 0), rows, COLUMNS)).toEqual({ row: 1, column: 1 });
  });

  it('stays on the row when its form closes, for a place that was made on the form row', () => {
    const rows = [data(1), data(2), data(3)];
    expect(resolvePlace(at(body(2, 'b', [], 'form'), 1), rows, COLUMNS)).toEqual({
      row: 1,
      column: 1,
    });
    expect(resolvePlace(at(body(3, 'b', [], 'form'), 0), rows, COLUMNS)).toEqual({
      row: 2,
      column: 1,
    });
  });

  it('does not take the form of one key for the row of another', () => {
    const rows = [data(1), form(2), data(3)];
    expect(resolvePlace(at(body(9), 2), rows, COLUMNS)).toEqual({ row: 2, column: 1 });
  });

  it('keeps the place inside the groups the form row is in', () => {
    const rows = [form(2, ['g'])];
    expect(resolvePlace(at(body(2, 'a', ['g']), 0), rows, COLUMNS)).toEqual({ row: 0, column: 0 });
  });
});

describe('samePosition', () => {
  const base = at(body(1, 'b', ['g1']), 3, 1);

  it('is true for the same place', () => {
    expect(samePosition(base, at(body(1, 'b', ['g1']), 3, 1))).toBe(true);
  });

  it('is false when any one field differs, the groups too', () => {
    expect(samePosition(base, at(body(1, 'b', ['g1']), 4, 1))).toBe(false);
    expect(samePosition(base, at(body(1, 'b', ['g1']), 3, 2))).toBe(false);
    expect(samePosition(base, at(body(2, 'b', ['g1']), 3, 1))).toBe(false);
    expect(samePosition(base, at(body(1, 'c', ['g1']), 3, 1))).toBe(false);
    expect(samePosition(base, at(body(1, 'b', ['g1'], 'group'), 3, 1))).toBe(false);
    expect(samePosition(base, at(body(1, 'b', ['g2']), 3, 1))).toBe(false);
    expect(samePosition(base, at(body(1, 'b', ['g1', 'g1/x']), 3, 1))).toBe(false);
    expect(samePosition(base, at({ area: 'header', column: 'b' }, 3, 1))).toBe(false);
    expect(samePosition(base, at(null, 3, 1))).toBe(false);
  });

  it('compares the groups in order', () => {
    expect(samePosition(at(body(1, 'b', ['g1', 'g2'])), at(body(1, 'b', ['g2', 'g1'])))).toBe(
      false,
    );
  });
});

describe('samePlace', () => {
  it('is true for the same row and column, or for none', () => {
    expect(samePlace(null, null)).toBe(true);
    expect(samePlace({ row: 1, column: 2 }, { row: 1, column: 2 })).toBe(true);
    expect(samePlace({ row: 1, column: 2 }, { row: 1, column: 3 })).toBe(false);
    expect(samePlace({ row: 1, column: 2 }, null)).toBe(false);
  });
});

describe('isRowOf', () => {
  it('compares the kind and the key: a group key is no data key', () => {
    expect(isRowOf(data(1), { key: 1, kind: 'data' })).toBe(true);
    expect(isRowOf(data(1), { key: 1, kind: 'group' })).toBe(false);
    expect(isRowOf(undefined, { key: 1, kind: 'data' })).toBe(false);
  });

  it('takes the data row and the form row of one key for one row, whichever the place says', () => {
    expect(isRowOf(form(1), { key: 1, kind: 'data' })).toBe(true);
    expect(isRowOf(data(1), { key: 1, kind: 'form' })).toBe(true);
    expect(isRowOf(form(1), { key: 1, kind: 'form' })).toBe(true);
    expect(isRowOf(form(1), { key: 2, kind: 'data' })).toBe(false);
    expect(isRowOf(form(1), { key: 1, kind: 'group' })).toBe(false);
    expect(isRowOf(form(1), { key: 1, kind: 'detail' })).toBe(false);
  });
});

describe('groupsAbove', () => {
  it('is the groups of a data row, and of the master of a detail row', () => {
    const rows = [data(1, ['g1', 'g1/y']), detail(1)];
    expect(groupsAbove(rows, 0)).toEqual(['g1', 'g1/y']);
    expect(groupsAbove(rows, 1)).toEqual(['g1', 'g1/y']);
  });

  it('is the groups of a form row, as of the data row it stands for', () => {
    expect(groupsAbove([form(1, ['g1', 'g1/y'])], 0)).toEqual(['g1', 'g1/y']);
  });

  it('is the groups above a group row: none for the first level', () => {
    expect(groupsAbove([group([step('x')])], 0)).toEqual([]);
    expect(groupsAbove([group([step('x'), step('y')])], 0)).toEqual([
      groupKey([step('x')] as never),
    ]);
  });
});
