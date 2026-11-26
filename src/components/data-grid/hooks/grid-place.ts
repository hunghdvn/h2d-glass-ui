import { clamp } from '../../../internal/number';
import type { FlatRow } from '../engine/flatten';
import { groupKey } from '../engine/group';
import { sameList } from '../engine/selection';
import type { DataGridKey } from '../types';

/**
 * Where the keyboard is in the grid: a column title, a cell of the filter row, a cell of a data row or a
 * group row, or the empty cell of a grid whose filter keeps no row, said by what they are and not by where
 * they are drawn (a row's kind and key, and a column id), so a sort, a page, a window or a filter row that
 * comes or goes does not lose the place. A body place holds the keys of the groups its row is inside (for a
 * group row, the groups above it): when its row goes because one of them closed, the place goes to the
 * nearest of them that is still in the list.
 */
export type ActiveCell =
  | { area: 'header'; column: string }
  | { area: 'filter'; column: string }
  | {
      area: 'body';
      key: DataGridKey;
      kind: FlatRow<unknown>['kind'];
      groups: readonly string[];
      column: string;
    }
  | { area: 'empty'; column: string }
  | { area: 'footer'; column: string };

/**
 * The keys of the groups the row at `index` is inside, the outermost first; for a group row, the groups
 * above it, for a detail row, those of its master, the row before it, and for a form row those of the row it
 * stands for.
 */
export function groupsAbove(rows: readonly FlatRow<unknown>[], index: number): readonly string[] {
  const row = rows[index]!;
  if (row.kind === 'data' || row.kind === 'form') return row.groups;
  if (row.kind === 'detail') {
    const master = rows[index - 1];
    return master?.kind === 'data' ? master.groups : [];
  }
  const { path } = row.node;
  return Array.from({ length: path.length - 1 }, (_, at) => groupKey(path.slice(0, at + 1)));
}

// A form row stands in the place of its data row: the two are one row of a place, so a place stays on its
// row when the form opens and when it closes.
const placeKind = (kind: string) => (kind === 'form' ? 'data' : kind);

/**
 * A row of the list is the row of a place when its kind and its key are: a group key is no data key, and
 * the form row of a key is the data row of that key.
 */
export const isRowOf = (
  row: FlatRow<unknown> | undefined,
  cell: { key: DataGridKey; kind: string },
) => row !== undefined && placeKind(row.kind) === placeKind(cell.kind) && row.key === cell.key;

/**
 * The active cell as places in the drawn grid: `row` counts the heading rows up from the body (-1 the last
 * heading row, the filter row when there is one, else the titles; -2 the titles when there is a filter row:
 * `isTitlePlace` and `isFilterPlace` say which), else it is an index of `rows`; a grid with no row whose
 * filter is the reason has the one place 0 in its body, its empty cell. The row of the footer is the place
 * just past the last row of the list: `rows.length`.
 */
export interface ActivePlace {
  row: number;
  column: number;
}

export interface Position {
  /** What was chosen, or `null` before anything was: the first cell of the first row. */
  cell: ActiveCell | null;
  /** The index its row had when last seen, which is where the place goes when the row leaves. */
  index: number;
  /** The index its column had when last seen, which is where the place goes when the column leaves. */
  columnIndex: number;
}

export function samePlace(a: ActivePlace | null, b: ActivePlace | null): boolean {
  return a === b || (a !== null && b !== null && a.row === b.row && a.column === b.column);
}

/** Two positions are one when they say the same place, the groups of a body place included. */
export function samePosition(a: Position, b: Position): boolean {
  if (
    a.index !== b.index ||
    a.columnIndex !== b.columnIndex ||
    a.cell?.area !== b.cell?.area ||
    a.cell?.column !== b.cell?.column
  ) {
    return false;
  }
  return (
    a.cell?.area !== 'body' ||
    (b.cell?.area === 'body' &&
      a.cell.key === b.cell.key &&
      a.cell.kind === b.cell.kind &&
      sameList(a.cell.groups, b.cell.groups))
  );
}

/**
 * The place the position has now. A row that is gone leaves the place at the same index, as far as
 * the rows reach, and at the title of its column when none is left, or at the empty cell when the
 * grid is empty because of its filter (`emptyCell`: the button that clears it is the one place of
 * the body); a column that is gone leaves it at the column now at the index it had, as far as the
 * columns reach (spec phase 6 §3.6). A place in the titles stays in them when a filter row comes or
 * goes, and one in the filter row, when it goes, is the title of its column (`headRows` is how many
 * heading rows there are). Nothing chosen yet is the first cell of the first row, or the empty
 * cell, or the first title; a position at the empty cell, once rows are back, is the first cell of
 * the first row. The row at the index last seen is the one when it has the key: of two rows with
 * the same key (the grid warns), the second is then not taken for the first, which would leave its
 * keys to nobody. A detail row that is gone (its detail closed, or its master left) leaves the place on its
 * master row, at the column the place remembers, when the master is still in the list. A row that is gone
 * because a group closed leaves the place at the nearest of its groups that is still in the list, which is
 * that group's row. A place in the footer (`footer`: the grid
 * has one and a row to stand over) is the place past the last row; with no footer, or no row, it is the
 * last row, or the title when there is none.
 */
export function resolvePlace(
  position: Position,
  rows: readonly FlatRow<unknown>[],
  columns: readonly { id: string }[],
  emptyCell = false,
  headRows = 1,
  footer = false,
): ActivePlace | null {
  if (columns.length === 0) return null;
  const { cell } = position;
  const at = columns.findIndex((candidate) => candidate.id === cell?.column);
  const column = at >= 0 ? at : clamp(position.columnIndex, 0, columns.length - 1);
  if (cell?.area === 'header') return { row: -headRows, column };
  // The filter row is the last heading row; without one that row is the titles, where the place stays.
  if (cell?.area === 'filter') return { row: -1, column };
  if (rows.length === 0) return { row: emptyCell ? 0 : -headRows, column };
  if (cell === null) return { row: 0, column };
  if (cell.area === 'footer') return { row: footer ? rows.length : rows.length - 1, column };
  // The empty cell has no column of its own: the rows that come back start at their first cell.
  if (cell.area === 'empty') return { row: 0, column: 0 };
  if (isRowOf(rows[position.index], cell)) return { row: position.index, column };
  const found = rows.findIndex((row) => isRowOf(row, cell));
  if (found >= 0) return { row: found, column };
  if (cell.kind === 'detail') {
    const master = rows.findIndex((row) => isRowOf(row, { key: cell.key, kind: 'data' }));
    if (master >= 0) return { row: master, column };
  }
  for (let at = cell.groups.length - 1; at >= 0; at--) {
    const group = rows.findIndex((row) => row.kind === 'group' && row.key === cell.groups[at]);
    if (group >= 0) return { row: group, column };
  }
  return { row: Math.min(position.index, rows.length - 1), column };
}
