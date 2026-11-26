import { afterEach, describe, expect, it } from 'vitest';
import type { FlatRow } from '../engine/flatten';
import { movedBy, pageStepRows } from './key-moves';

// Where a key that moves the active cell takes it (spec phase 6 §3.6), and by how many rows a page key does.

const ROWS = 10;
const COLUMNS = 4;
const move = (
  key: string,
  place: { row: number; column: number },
  options: {
    mod?: boolean;
    rows?: number;
    headRows?: number;
    footer?: boolean;
    page?: number;
  } = {},
) =>
  movedBy(
    key,
    options.mod ?? false,
    place,
    options.rows ?? ROWS,
    COLUMNS,
    options.headRows ?? 1,
    () => options.page ?? 3,
    options.footer ?? false,
  );

describe('movedBy', () => {
  it('stops at the edges', () => {
    expect(move('ArrowLeft', { row: 2, column: 0 })).toEqual({ row: 2, column: 0 });
    expect(move('ArrowRight', { row: 2, column: 3 })).toEqual({ row: 2, column: 3 });
    expect(move('ArrowUp', { row: -1, column: 1 })).toEqual({ row: -1, column: 1 });
    expect(move('ArrowDown', { row: ROWS - 1, column: 1 })).toEqual({ row: ROWS - 1, column: 1 });
  });

  it('goes up into the filter row, and down from the heading to the first row', () => {
    expect(move('ArrowUp', { row: 0, column: 1 }, { headRows: 2 })).toEqual({ row: -1, column: 1 });
    expect(move('ArrowUp', { row: -1, column: 1 }, { headRows: 2 })).toEqual({
      row: -2,
      column: 1,
    });
    expect(move('ArrowUp', { row: -2, column: 1 }, { headRows: 2 })).toEqual({
      row: -2,
      column: 1,
    });
    expect(move('ArrowDown', { row: -1, column: 1 })).toEqual({ row: 0, column: 1 });
  });

  it('takes no arrow or page key with the modifier', () => {
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageDown', 'PageUp']) {
      expect(move(key, { row: 2, column: 1 }, { mod: true })).toBeNull();
    }
  });

  it('goes to the ends of the row with Home and End, and of the grid with the modifier', () => {
    expect(move('Home', { row: 4, column: 2 })).toEqual({ row: 4, column: 0 });
    expect(move('End', { row: 4, column: 2 })).toEqual({ row: 4, column: COLUMNS - 1 });
    expect(move('Home', { row: 4, column: 2 }, { mod: true })).toEqual({ row: 0, column: 0 });
    expect(move('End', { row: 4, column: 2 }, { mod: true })).toEqual({
      row: ROWS - 1,
      column: COLUMNS - 1,
    });
  });

  it('keeps the place with the modifier and no row', () => {
    const place = { row: -1, column: 2 };
    expect(move('Home', place, { mod: true, rows: 0 })).toEqual(place);
    expect(move('End', place, { mod: true, rows: 0 })).toEqual(place);
  });

  it('stops mod+End at the last row of the body, which the footer is not, and ArrowDown reaches it', () => {
    // 10 rows and the footer: the list is 11 places long.
    expect(move('End', { row: 2, column: 0 }, { mod: true, rows: 11, footer: true })).toEqual({
      row: 9,
      column: COLUMNS - 1,
    });
    expect(move('ArrowDown', { row: 9, column: 0 }, { rows: 11, footer: true })).toEqual({
      row: 10,
      column: 0,
    });
  });

  it('moves by a page, stops at the last row of the body, and does nothing in the footer', () => {
    expect(move('PageDown', { row: 2, column: 1 })).toEqual({ row: 5, column: 1 });
    expect(move('PageDown', { row: 8, column: 1 })).toEqual({ row: 9, column: 1 });
    expect(move('PageDown', { row: 8, column: 1 }, { rows: 11, footer: true })).toEqual({
      row: 9,
      column: 1,
    });
    expect(move('PageDown', { row: 10, column: 1 }, { rows: 11, footer: true })).toEqual({
      row: 10,
      column: 1,
    });
    expect(move('PageDown', { row: -1, column: 1 }, { rows: 0 })).toEqual({ row: -1, column: 1 });
    expect(move('PageUp', { row: 5, column: 1 })).toEqual({ row: 2, column: 1 });
    expect(move('PageUp', { row: 1, column: 1 })).toEqual({ row: 0, column: 1 });
    expect(move('PageUp', { row: -1, column: 1 })).toEqual({ row: -1, column: 1 });
  });

  it('asks for the page from the row the place is on, in the direction of the key', () => {
    const asked: [number, number][] = [];
    const page = (from: number, direction: 1 | -1) => {
      asked.push([from, direction]);
      return 2;
    };
    movedBy('PageDown', false, { row: 3, column: 0 }, ROWS, COLUMNS, 1, page, false);
    movedBy('PageUp', false, { row: 6, column: 0 }, ROWS, COLUMNS, 1, page, false);
    expect(asked).toEqual([
      [3, 1],
      [6, -1],
    ]);
  });

  it('is no move for any other key', () => {
    expect(move('a', { row: 1, column: 1 })).toBeNull();
    expect(move('Enter', { row: 1, column: 1 })).toBeNull();
  });
});

describe('pageStepRows', () => {
  const tables: HTMLTableElement[] = [];
  afterEach(() => {
    for (const table of tables.splice(0)) table.remove();
  });

  // The room for the rows is the frame less the heading: 200px here.
  const ROOM = 200;
  const asRows = (kinds: readonly string[]) =>
    kinds.map((kind, key) => ({ kind, key }) as unknown as FlatRow<unknown>);

  // jsdom has no layout: the heights are given to the elements the step reads them from.
  function drawn(kinds: readonly ('data' | 'group')[], heights: { data: number; group: number }) {
    const table = document.createElement('table');
    const head = table.createTHead();
    head.insertRow();
    Object.defineProperty(head, 'offsetHeight', { value: 40 });
    const body = table.createTBody();
    for (const kind of kinds) {
      const row = body.insertRow();
      row.className = kind === 'data' ? 'flg-data-grid-row' : 'flg-data-grid-group-row';
      Object.defineProperty(row, 'offsetHeight', { value: heights[kind] });
    }
    document.body.append(table);
    tables.push(table);
    const frame = document.createElement('div');
    Object.defineProperty(frame, 'clientHeight', { value: 40 + ROOM });
    return { table, frame, rows: asRows(kinds) };
  }

  it('counts the rows that fit between the heading and the bottom of the frame', () => {
    const { table, frame, rows } = drawn(Array(20).fill('data'), { data: 40, group: 30 });
    expect(pageStepRows(table, frame, rows, 0, 1)).toBe(5);
    expect(pageStepRows(table, frame, rows, 10, -1)).toBe(5);
  });

  it('counts a group row by its own, lower height: a page is more rows where there are groups', () => {
    const kinds = ['group', 'group', 'group', 'data', 'data', 'data', 'data'] as const;
    const { table, frame, rows } = drawn(kinds, { data: 40, group: 20 });
    // Three groups of 20px and three data rows of 40px are 180px, and the fourth data row is over 200px.
    expect(pageStepRows(table, frame, rows, 0, 1)).toBe(6);
    const same = drawn(Array(7).fill('data'), { data: 40, group: 20 });
    expect(pageStepRows(same.table, same.frame, same.rows, 0, 1)).toBe(5);
  });

  it('is one row with no frame, and with no row drawn', () => {
    const { table, rows } = drawn(Array(5).fill('data'), { data: 40, group: 30 });
    expect(pageStepRows(table, null, rows, 0, 1)).toBe(1);
    const none = drawn([], { data: 40, group: 30 });
    expect(pageStepRows(none.table, none.frame, none.rows, 0, 1)).toBe(1);
  });

  it('takes the height of the other kind for a kind that is not drawn', () => {
    // Only data rows are drawn (a virtual window), and the list holds group rows: they are 40px too.
    const { table, frame } = drawn(Array(5).fill('data'), { data: 40, group: 30 });
    const rows = asRows(Array(7).fill('group'));
    expect(pageStepRows(table, frame, rows, 0, 1)).toBe(5);
  });
});
