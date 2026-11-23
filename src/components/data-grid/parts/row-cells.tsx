import type { ReactElement } from 'react';
import { isPlaceColumn } from '../engine/columns';
import type { ResolvedColumn } from '../engine/columns';
import { FillerCell } from './FillerCell';

/** One column of the layout, as a row asks for its cell. */
export interface RowCell<TRow> {
  readonly column: ResolvedColumn<TRow>;
  /** The index in `layoutColumns`: where the column's zone (`layoutPins`) is read. */
  readonly index: number;
  /**
   * The place of the keyboard, counted over the columns that are one (the indents of the groups are
   * not), which is the column of the active cell; -1 for an indent.
   */
  readonly place: number;
  /** Whether the column is an indent of a group, which is no place of the keyboard. */
  readonly indent: boolean;
}

/**
 * The cells of one row: `render` is called for each column of `layoutColumns`, in order, with its
 * layout index and its place of the keyboard, and gives the cell of the column, none (`null` or
 * `[]`), or several. A row that draws the indents as one cell (the heading, the footer) gives that
 * cell at the first indent and none at the others, so it never counts the cells it left out.
 *
 * The filler column goes where the layout says (`fillerAt`, an index of `layoutColumns`: the first
 * column of the right zone, else the end) and is placed by that index, before the cell of that
 * column, so no row works out an offset of its own for the cells it merged. Its key is a `flg:` id,
 * which no column has. `head` draws it as a title.
 */
export function rowCells<TRow>(
  columns: readonly ResolvedColumn<TRow>[],
  fillerAt: number,
  filler: boolean,
  head: boolean,
  render: (cell: RowCell<TRow>) => ReactElement | readonly ReactElement[] | null,
): ReactElement[] {
  const cells: ReactElement[] = [];
  const fill = () => {
    if (filler) cells.push(<FillerCell key="flg:filler" head={head} />);
  };
  let place = -1;
  columns.forEach((column, index) => {
    if (index === fillerAt) fill();
    const indent = !isPlaceColumn(column);
    if (!indent) place++;
    const made = render({ column, index, place: indent ? -1 : place, indent });
    if (made === null) return;
    if (Array.isArray(made)) cells.push(...made);
    else cells.push(made as ReactElement);
  });
  if (fillerAt >= columns.length) fill();
  return cells;
}
