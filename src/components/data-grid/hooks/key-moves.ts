import { rowsThatFit } from '../engine/virtual';
import type { FlatRow } from '../engine/flatten';
import { listRows, rowAt, rowKind } from '../grid-dom';
import type { ActivePlace } from './grid-place';

/**
 * How many rows a page key moves by from the row at `from`: the rows that fit between the heading and the
 * footer (or the bottom of the frame), counted over their own heights (`rowsThatFit`: a group row is lower than a
 * data row), and at least one. The height of a data row and of a group row is read from a row of the kind
 * that is drawn; a kind that is not drawn (a virtual grid may draw no group row) has the height of the
 * other. A detail row is read from its own row: a grid with details draws every row, and its height is the
 * content's.
 */
export function pageStepRows<TRow>(
  table: HTMLTableElement,
  frame: HTMLElement | null,
  rows: readonly FlatRow<TRow>[],
  from: number,
  direction: 1 | -1,
): number {
  const drawn = listRows(table);
  const dataHeight = drawn.find((row) => rowKind(row) === 'data')?.offsetHeight ?? 0;
  const groupHeight = drawn.find((row) => rowKind(row) === 'group')?.offsetHeight ?? 0;
  const data = dataHeight || groupHeight;
  const group = groupHeight || dataHeight;
  if (!frame || data === 0) return 1;
  const room =
    frame.clientHeight - (table.tHead?.offsetHeight ?? 0) - (table.tFoot?.offsetHeight ?? 0);
  return rowsThatFit(
    (index) => {
      const kind = rows[index]?.kind;
      if (kind === 'group') return group;
      // A grid with details draws every row, so an open detail is read from its own row.
      if (kind === 'detail') return rowAt(table, index)?.offsetHeight || data;
      return data;
    },
    rows.length,
    from,
    direction,
    room,
  );
}

/** Where a key that moves the active cell takes it, or `null` for a key that does not. */
export function movedBy(
  key: string,
  mod: boolean,
  place: ActivePlace,
  rowCount: number,
  columnCount: number,
  headRows: number,
  page: (from: number, direction: 1 | -1) => number,
  footer: boolean,
): ActivePlace | null {
  const lastColumn = columnCount - 1;
  // `rowCount` counts the footer's row too; the keys that go to an end or by a page stop at the last row
  // of the body, and the footer is reached by `ArrowDown` and left by `ArrowUp` alone.
  const lastRow = footer ? rowCount - 2 : rowCount - 1;
  switch (key) {
    case 'ArrowLeft':
      return mod ? null : { ...place, column: Math.max(0, place.column - 1) };
    case 'ArrowRight':
      return mod ? null : { ...place, column: Math.min(lastColumn, place.column + 1) };
    case 'ArrowUp':
      return mod ? null : { ...place, row: Math.max(-headRows, place.row - 1) };
    case 'ArrowDown':
      if (mod) return null;
      // Down the heading rows to the first row; past the last row there is nowhere.
      return { ...place, row: Math.min(rowCount - 1, place.row + 1) };
    case 'Home':
      return mod ? (rowCount > 0 ? { row: 0, column: 0 } : place) : { ...place, column: 0 };
    case 'End':
      return mod
        ? lastRow >= 0
          ? { row: lastRow, column: lastColumn }
          : place
        : { ...place, column: lastColumn };
    case 'PageDown':
      if (mod) return null;
      // From the heading it is the page's worth of rows below it, which is at least the first. It stops
      // at the last row of the body and does nothing in the footer.
      return lastRow < 0 || place.row > lastRow
        ? place
        : { ...place, row: Math.min(lastRow, place.row + page(place.row, 1)) };
    case 'PageUp':
      if (mod) return null;
      return place.row < 0
        ? place
        : { ...place, row: Math.max(0, place.row - page(place.row, -1)) };
    default:
      return null;
  }
}
