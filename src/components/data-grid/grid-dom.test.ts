import { describe, expect, it } from 'vitest';
import {
  firstRowIndex,
  headRowAt,
  headRowCount,
  isFilterPlace,
  isTitlePlace,
  listIndexOf,
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
