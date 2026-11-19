import type { HTMLAttributes, ReactNode, RefObject } from 'react';
import type { WidthSpec } from '../engine/layout';

export interface GridTableProps extends Pick<
  HTMLAttributes<HTMLTableElement>,
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby'
  | 'aria-busy'
  | 'aria-rowcount'
  | 'aria-multiselectable'
  | 'onKeyDown'
  | 'onFocus'
  | 'onBlur'
  | 'onMouseDown'
  | 'onDoubleClick'
> {
  tableRef: RefObject<HTMLTableElement | null>;
  /** The shown columns, in order: the box column first when rows can be chosen. */
  columns: readonly (WidthSpec & { id: string })[];
  /** The width of each column once the frame is measured; `undefined` before and when all are fixed. */
  widths: readonly number[] | undefined;
  /** Whether every column has a width of its own: the table is then as wide as they are. */
  fixed: boolean;
  /** Whether a filler column takes what the frame has beyond the columns. */
  filler: boolean;
  /** The heading and the body. */
  children: ReactNode;
}

/**
 * The `<table>` of a grid with its `<colgroup>` and its width. It is where the widths of the columns
 * are written, so a change of them renders this alone: `children` are the same elements as before,
 * and React does not render them again.
 *
 * With a flexible column the table is as wide as its frame, and at least as wide as its columns
 * need, past which the frame scrolls; before the frame is measured, and where it cannot be, a
 * flexible column has no width and the stylesheet shares the room out. Without one every column is
 * as wide as it says, and a filler column at the end, which is no column of the grid, takes what the
 * frame has beyond them: the table is as wide as the columns and at least `100%` of the frame.
 * Spread over the columns, the widths would be proportions and not the widths (spec phase 6 §3.7,
 * option E of the owner). The width in pixels, and not `100%` with the columns as the least, is what
 * a grid in a box as wide as its content is sized by: Firefox gives a table of `width: 100%` no
 * width of its own there, and the frame would close to nothing.
 *
 * The filler column is drawn only where it has room to carry the end of a row: the last cell of a
 * row gets Table's rules for that end (the round corners of `striped`, the right edge of a chosen row
 * with more contrast), and a filler of 0px or 2px would take them out of sight. So it is there while
 * the frame has not been measured (the server, the first render, a hidden grid: the same markup on
 * both sides), and then while the frame has at least 1px beyond the columns, and at least the round
 * of a row's end. Otherwise the table is as wide as its columns (`width` and `min-width` in pixels:
 * Table's `width: 100%` would spread what is left over them), it ends that much short of a wider
 * frame, and every `colspan` leaves the filler column out.
 */
export function GridTable({
  tableRef,
  columns,
  widths,
  fixed,
  filler,
  children,
  ...attributes
}: GridTableProps) {
  const leastWidth = columns.reduce((sum, column) => sum + (column.width ?? column.minWidth), 0);
  return (
    <table
      ref={tableRef}
      className="flg-table flg-data-grid-table"
      role="grid"
      {...attributes}
      style={{
        width: fixed ? leastWidth : undefined,
        minWidth: filler ? '100%' : leastWidth,
      }}
    >
      <colgroup>
        {columns.map((column, index) => (
          <col key={column.id} style={{ width: widths ? widths[index] : column.width }} />
        ))}
        {filler ? <col /> : null}
      </colgroup>
      {children}
    </table>
  );
}
