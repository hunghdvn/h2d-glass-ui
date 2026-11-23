import { afterEach, describe, expect, it, vi } from 'vitest';
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
  placeLine,
  rowAt,
  rowBlocks,
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

// Every box the line is placed from is the test's: jsdom has no layout.
const boxOf = (left: number, top: number, right: number, bottom: number) =>
  ({
    left,
    top,
    right,
    bottom,
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    toJSON: () => ({}),
  }) as DOMRect;

describe('placeLine', () => {
  afterEach(() => vi.restoreAllMocks());

  /** A line in a main box at (20, 10), 400 by 300 and drawn at its own size, over a frame inside it. */
  function lineIn(scale = 1) {
    const main = document.createElement('div');
    const frame = document.createElement('div');
    const line = document.createElement('div');
    main.append(frame, line);
    document.body.append(main);
    vi.spyOn(main, 'getBoundingClientRect').mockReturnValue(boxOf(20, 10, 20 + 400 * scale, 310));
    vi.spyOn(main, 'offsetWidth', 'get').mockReturnValue(400);
    // The frame starts 2px inside the main box, with a 1px border, and shows 380 by 200.
    vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue(boxOf(22, 12, 405, 215));
    vi.spyOn(frame, 'clientLeft', 'get').mockReturnValue(1);
    vi.spyOn(frame, 'clientTop', 'get').mockReturnValue(1);
    vi.spyOn(frame, 'clientWidth', 'get').mockReturnValue(380);
    vi.spyOn(frame, 'clientHeight', 'get').mockReturnValue(200);
    return { line, frame, main };
  }

  it('places a vertical line from its start to the bottom of what the frame shows, centred on x', () => {
    const { line, frame, main } = lineIn();
    const inside = placeLine(line, frame, 100, 40, 3);
    expect(line.style.left).toBe('78.5px');
    expect(line.style.top).toBe('30px');
    // The frame shows down to 12 + 1 + 200 = 213: the line is 213 - 40 = 173px tall.
    expect(line.style.height).toBe('173px');
    expect(inside).toBe(true);
    // x outside what the frame shows sideways (23..403) says so.
    expect(placeLine(line, frame, 10, 40, 3)).toBe(false);
    expect(placeLine(line, frame, 404, 40, 3, 'x')).toBe(false);
    main.remove();
  });

  it('places a horizontal line from its start to the right edge of what the frame shows, centred on y', () => {
    const { line, frame, main } = lineIn();
    const inside = placeLine(line, frame, 100, 23, 3, 'y');
    expect(line.style.left).toBe('3px');
    expect(line.style.top).toBe('88.5px');
    // The frame shows 23..403 sideways: from 23 the line is 380px wide.
    expect(line.style.width).toBe('380px');
    expect(inside).toBe(true);
    // y outside what the frame shows vertically (13..213) says so.
    expect(placeLine(line, frame, 12, 23, 3, 'y')).toBe(false);
    expect(placeLine(line, frame, 214, 23, 3, 'y')).toBe(false);
    main.remove();
  });

  it('writes layout pixels, scaled back by the one the grid is drawn at', () => {
    const { line, frame, main } = lineIn(0.5);
    placeLine(line, frame, 120, 23, 3, 'y');
    // Drawn at half its size: the main box is 200px wide on the screen, and 400 in layout.
    expect(line.style.top).toBe(`${(120 - 10) * 2 - 1.5}px`);
    expect(line.style.left).toBe(`${(23 - 20) * 2}px`);
    expect(line.style.width).toBe(`${(403 - 23) * 2}px`);
    main.remove();
  });

  it('places nothing and says no for a line that is in no box', () => {
    const line = document.createElement('div');
    expect(placeLine(line, document.createElement('div'), 1, 2, 3)).toBe(false);
    expect(line.style.left).toBe('');
  });
});

describe('rowBlocks', () => {
  afterEach(() => vi.restoreAllMocks());

  function bodyOf(kinds: ('data' | 'detail' | 'group' | 'spacer')[], virtualFrom?: number) {
    const table = document.createElement('table');
    const body = table.createTBody();
    const boxes = new Map<HTMLTableRowElement, DOMRect>();
    let top = 50;
    kinds.forEach((kind, at) => {
      const row = body.insertRow();
      row.className =
        kind === 'data'
          ? 'flg-data-grid-row'
          : kind === 'detail'
            ? 'flg-data-grid-detail-row'
            : kind === 'group'
              ? 'flg-data-grid-group-row'
              : 'flg-data-grid-spacer';
      if (virtualFrom !== undefined && kind !== 'spacer') {
        row.setAttribute('aria-rowindex', String(virtualFrom + at));
      }
      const height = kind === 'detail' ? 80 : 30;
      boxes.set(row, boxOf(0, top, 100, top + height));
      top += height;
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return boxes.get(this as HTMLTableRowElement) ?? boxOf(0, 0, 0, 0);
    });
    return table;
  }

  it('measures each data row with its key, and ends a row that has its detail open at the detail', () => {
    const table = bodyOf(['data', 'data', 'detail', 'data']);
    expect(rowBlocks(table, (index) => `k${index}`)).toEqual([
      { key: 'k0', top: 50, middle: 65, bottom: 80 },
      { key: 'k1', top: 80, middle: 95, bottom: 190 },
      { key: 'k3', top: 190, middle: 205, bottom: 220 },
    ]);
  });

  it('leaves out the rows that have no key, the group rows and the spacers', () => {
    const table = bodyOf(['spacer', 'group', 'data', 'data']);
    // The spacer is no row of the list: the group row is the first (0), then the data rows 1 and 2.
    expect(rowBlocks(table, (index) => (index === 2 ? 'x' : undefined))).toEqual([
      { key: 'x', top: 140, middle: 155, bottom: 170 },
    ]);
  });

  it('gives the place in the list of a row of a virtual window, by its aria-rowindex', () => {
    // The first data row of the list is aria-rowindex 2: this window draws the rows from the 41st.
    const table = bodyOf(['data', 'data'], 42);
    const asked: number[] = [];
    rowBlocks(table, (index) => {
      asked.push(index);
      return index;
    });
    expect(asked).toEqual([40, 41]);
  });
});
