import { describe, expect, it } from 'vitest';
import {
  cellsOf,
  dataRows,
  firstRowIndex,
  headRowAt,
  homeOf,
  headRowCount,
  isFilterPlace,
  isTitlePlace,
  listIndexOf,
  listRows,
  rowAt,
  rowKind,
  titleRow,
} from './grid-dom';

// The rows of the heading and where the keyboard counts them from (spec phase 6 §3.6): the places of the
// heading count up from the body, so -1 is the last heading row, which is the filter row when there is one.

function tableOf(headRows: number, withIndex: boolean) {
  const table = document.createElement('table');
  const head = table.createTHead();
  for (let index = 0; index < headRows; index++) head.insertRow();
  const body = table.createTBody();
  const row = body.insertRow();
  if (withIndex) row.setAttribute('aria-rowindex', String(firstRowIndex(headRows) + 4));
  return { table, row };
}

describe('the heading rows', () => {
  it('are one, or two with a filter row', () => {
    expect(headRowCount(false)).toBe(1);
    expect(headRowCount(true)).toBe(2);
  });

  it('are counted before the rows of data in aria-rowindex', () => {
    expect(firstRowIndex(1)).toBe(2);
    expect(firstRowIndex(2)).toBe(3);
  });

  it('tell the titles from the filter row by the place and the number of heading rows', () => {
    // One heading row: -1 is the titles and there is no filter row.
    expect(isTitlePlace(-1, 1)).toBe(true);
    expect(isFilterPlace(-1, 1)).toBe(false);
    // Two: -2 is the titles, -1 the filter row.
    expect(isTitlePlace(-2, 2)).toBe(true);
    expect(isTitlePlace(-1, 2)).toBe(false);
    expect(isFilterPlace(-1, 2)).toBe(true);
    expect(isFilterPlace(-2, 2)).toBe(false);
    // A row of the body is neither.
    expect(isTitlePlace(0, 1)).toBe(false);
    expect(isFilterPlace(0, 2)).toBe(false);
  });

  it('give the row at a place of the heading, and the titles are always the first', () => {
    const one = tableOf(1, false).table;
    expect(headRowAt(one, -1)).toBe(one.tHead!.rows[0]);
    expect(titleRow(one)).toBe(one.tHead!.rows[0]);
    const two = tableOf(2, false).table;
    expect(headRowAt(two, -2)).toBe(two.tHead!.rows[0]);
    expect(headRowAt(two, -1)).toBe(two.tHead!.rows[1]);
    expect(titleRow(two)).toBe(two.tHead!.rows[0]);
    expect(headRowAt(one, -2)).toBeUndefined();
    expect(titleRow(null)).toBeNull();
    expect(titleRow(document.createElement('table'))).toBeNull();
  });

  it('are read from the table by the place a row says it has in the list', () => {
    expect(listIndexOf(tableOf(1, true).row, 0)).toBe(4);
    expect(listIndexOf(tableOf(2, true).row, 0)).toBe(4);
    // A row that says nothing is where it is drawn.
    expect(listIndexOf(tableOf(2, false).row, 7)).toBe(7);
  });
});

// The three kinds of row of the body, and the cells of a row that are places of the keyboard.
function bodyOf(spec: string[]) {
  const table = document.createElement('table');
  const body = table.createTBody();
  for (const classes of spec) {
    const row = body.insertRow();
    if (classes) row.className = classes;
  }
  return table;
}

describe('the kinds of row', () => {
  const SPEC = [
    'flg-data-grid-group-row',
    'flg-data-grid-row',
    'flg-data-grid-detail-row',
    'flg-data-grid-spacer',
    'flg-data-grid-row',
  ];

  it('are told apart once, by the class of the row; a spacer is none', () => {
    const rows = Array.from(bodyOf(SPEC).tBodies[0]!.rows);
    expect(rows.map(rowKind)).toEqual(['group', 'data', 'detail', null, 'data']);
  });

  it('are all in listRows, in order, and only the data rows in dataRows', () => {
    const table = bodyOf(SPEC);
    expect(listRows(table).map(rowKind)).toEqual(['group', 'data', 'detail', 'data']);
    expect(dataRows(table).map(rowKind)).toEqual(['data', 'data']);
  });

  it('count every kind in the place of a row, which is its place in the list', () => {
    const table = bodyOf(SPEC);
    const [group, data, detail, , last] = Array.from(table.tBodies[0]!.rows);
    expect(rowAt(table, 0)).toBe(group);
    expect(rowAt(table, 1)).toBe(data);
    expect(rowAt(table, 2)).toBe(detail);
    expect(rowAt(table, 3)).toBe(last);
    expect(rowAt(table, 4)).toBeUndefined();
  });
});

describe('homeOf', () => {
  const cellWith = (attributes: Record<string, string>, inner: string) => {
    const cell = document.createElement('td');
    for (const [name, value] of Object.entries(attributes)) cell.setAttribute(name, value);
    cell.innerHTML = inner;
    return cell;
  };

  it('is the box of a service cell of boxes and the button of a service cell of details', () => {
    const box = cellWith({ 'data-service': 'select' }, '<input type="checkbox" />');
    expect(homeOf(box)).toBe(box.querySelector('input'));
    const toggle = cellWith({ 'data-service': 'detail' }, '<button type="button"></button>');
    expect(homeOf(toggle)).toBe(toggle.querySelector('button'));
  });

  it('is the cell for a service cell with nothing in it, or with its control disabled', () => {
    const none = cellWith({ 'data-service': 'detail' }, '');
    expect(homeOf(none)).toBe(none);
    const off = cellWith({ 'data-service': 'detail' }, '<button type="button" disabled></button>');
    expect(homeOf(off)).toBe(off);
  });

  it('is the cell itself for a cell of data, whatever controls it holds', () => {
    const cell = cellWith({}, '<button type="button"></button>');
    expect(homeOf(cell)).toBe(cell);
  });
});

describe('cellsOf', () => {
  it('leaves out the filler column and the indents of the groups, which are no place of the keyboard', () => {
    const row = document.createElement('tr');
    const make = (classes: string) => {
      const cell = row.insertCell();
      cell.className = classes;
      return cell;
    };
    make('flg-table-cell flg-data-grid-indent');
    make('flg-table-cell flg-data-grid-indent');
    const first = make('flg-table-cell flg-data-grid-cell');
    make('flg-table-cell flg-data-grid-filler');
    const last = make('flg-table-cell flg-data-grid-cell');
    expect(cellsOf(row)).toEqual([first, last]);
  });
});
