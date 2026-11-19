import type { CSSProperties, HTMLAttributes, ReactNode, RefObject } from 'react';
import { pinOffsets } from '../engine/layout';
import type { WidthSpec } from '../engine/layout';
import { useLiveWidths } from '../hooks/use-live-widths';
import type { LiveWidthsStore } from '../hooks/use-live-widths';
import type { DataGridPin } from '../types';

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
  /** The zone of each of `columns`: `undefined` for the middle. */
  pins: readonly (DataGridPin | undefined)[];
  /** Where the filler column goes among `columns`: before the right zone, else at the end. */
  fillerAt: number;
  /** The widths of a column resize in flight, which this table alone reads. */
  live: LiveWidthsStore;
  /** The heading and the body. */
  children: ReactNode;
}

/**
 * The `<table>` of a grid with its `<colgroup>` and its width. It is where the widths of the columns
 * are written. The widths of a resize in flight come from the live store (`live`), which this table
 * and the resize guide alone read, so a move of the pointer renders this alone: `children` are the same
 * elements as before, and React does not render them again. The other widths come as props, and
 * render the grid as any change of its layout does.
 *
 * With a flexible column the table is as wide as its frame, and at least as wide as its columns
 * need, past which the frame scrolls; before the frame is measured, and where it cannot be, a
 * flexible column has no width and the stylesheet shares the room out. Without one every column is
 * as wide as it says, and a filler column at the end, which is no column of the grid, takes what the
 * frame has beyond them: the table is as wide as the columns and at least `100%` of the frame.
 * Spread over the columns, the widths would be proportions and not the widths (spec phase 6 §3.7,
 * option E of the owner).
 *
 * The offsets of the pinned columns are written here too (spec phase 6 §3.7): `--flg-data-grid-pin-<i>`
 * for the column at index `i` that is pinned, which its cells read as `left` or `right`, and the width
 * of each zone, which the cells of the middle keep clear of when they are scrolled into view. A
 * flexible column that is pinned counts its least width until the frame is measured, a lower bound,
 * so a cell never sticks to the right of where it rests in the HTML of the server. The frame says
 * how much of its padding a sticky cell sticks inside (`--flg-data-grid-pin-inset`: the 6px of a
 * `striped` or `minimal` frame), which the offsets take back so that no strip of scrolled cells shows
 * beside a zone. The width in pixels, and not `100%` with the columns as the least, is what
 * a grid in a box as wide as its content is sized by: Firefox gives a table of `width: 100%` no
 * width of its own there, and the frame would close to nothing.
 *
 * While a column is dragged, its width and those of the columns the first resize freezes come from
 * `live` and are the widths of the table: every column then has one, so the table is as wide as they
 * are, and the filler column stays as the committed layout has it (a column made narrower may end the
 * table short of the frame until the release).
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
  pins,
  fillerAt,
  live,
  children,
  ...attributes
}: GridTableProps) {
  const dragged = useLiveWidths(live)?.widths;
  const widthOf = (column: WidthSpec & { id: string }) => dragged?.[column.id] ?? column.width;
  const leastWidth = columns.reduce((sum, column) => sum + (widthOf(column) ?? column.minWidth), 0);
  const everyWidth = columns.every((column) => widthOf(column) !== undefined);
  const sticking = pins.some((pin) => pin !== undefined);
  const offsets: CSSProperties = {};
  if (sticking) {
    const sizes = columns.map(
      (column, index) => dragged?.[column.id] ?? widths?.[index] ?? column.width ?? column.minWidth,
    );
    const written = offsets as Record<string, string>;
    pinOffsets(sizes, pins).forEach((offset, index) => {
      if (offset !== undefined) {
        written[`--flg-data-grid-pin-${index}`] =
          `calc(${offset}px - var(--flg-data-grid-pin-inset))`;
      }
    });
    for (const side of ['left', 'right'] as const) {
      const zone = sizes.reduce((sum, size, index) => sum + (pins[index] === side ? size : 0), 0);
      if (zone > 0) written[`--flg-data-grid-pinned-${side}`] = `${zone}px`;
    }
  }
  const cols = columns.map((column, index) => (
    <col
      key={column.id}
      style={{ width: dragged?.[column.id] ?? (widths ? widths[index] : column.width) }}
    />
  ));
  if (filler) cols.splice(fillerAt, 0, <col key="flg:filler" />);
  return (
    <table
      ref={tableRef}
      className="flg-table flg-data-grid-table"
      role="grid"
      {...attributes}
      style={{
        width: fixed || (dragged !== undefined && everyWidth) ? leastWidth : undefined,
        minWidth: filler ? '100%' : leastWidth,
        ...offsets,
      }}
    >
      <colgroup>{cols}</colgroup>
      {children}
    </table>
  );
}
