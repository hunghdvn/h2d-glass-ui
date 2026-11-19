import { useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { px } from '../../../internal/number';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import type { TableVariant } from '../../table/Table';
import { resolveWidths } from '../engine/layout';
import type { WidthSpec } from '../engine/layout';
import type { DataGridDensity } from '../types';

/** The custom property of the frame that holds the width the columns share, for what spans them. */
export const FRAME_WIDTH_PROPERTY = '--flg-data-grid-frame-width';

// The room for the table: the frame without its scrollbar and its own padding (a `striped` frame
// has 6px). `clientWidth` is the layout size, which a transform does not change.
function roomOf(frame: HTMLElement): number {
  const style = getComputedStyle(frame);
  const padding = px(style.paddingLeft) + px(style.paddingRight);
  return Math.max(0, frame.clientWidth - padding);
}

// How round the end of a row is: the radius of the top right corner of the last cell of the first
// row of the body, which Table's stylesheet rounds in `striped` (8px with the default tokens) and
// not in `lined` or `minimal`. A computed radius is the length the stylesheet gives, not one cut
// down to the box. With no such row, or a radius that is not in pixels, it is 0. The physical
// corner is the one: the grid has no right-to-left layout (spec phase 6 §1).
function endRoundOf(frame: HTMLElement): number {
  const cell = frame.querySelector('.flg-table-body > .flg-table-row')?.lastElementChild;
  if (!cell) return 0;
  const radius = getComputedStyle(cell).borderTopRightRadius.split(' ')[0] ?? '';
  return radius.endsWith('px') ? px(radius) : 0;
}

/** How the grid lays its columns out. */
export interface ColumnLayout {
  /**
   * The width in pixels of each column, once the frame has been measured; `undefined` until then
   * and when every column has a width of its own.
   */
  widths: number[] | undefined;
  /** Whether there are columns and each has a width of its own: the table is as wide as they. */
  fixed: boolean;
  /**
   * Whether the rows end in a cell of the filler column, which takes what the frame has beyond the
   * columns: only when they are `fixed`, and the frame either has not been measured (the server,
   * the first render, a hidden grid) or has room enough beyond them to carry the end of a row, at
   * least 1px and at least the round of a row's end.
   */
  filler: boolean;
}

/**
 * How the columns share the frame. The frame is watched, with one `ResizeObserver`, when a column
 * is flexible (for the widths), when every column has a width (for the filler column), and while
 * something spans every column (`fullRow`: the words of an empty grid), which is as wide as the
 * frame shows; a grid with no column and nothing across it watches nothing. The room is written to
 * the frame as `--flg-data-grid-frame-width` while a column is flexible or something spans them,
 * which the stylesheet declares itself so a grid in a cell of another never takes the outer one's,
 * and is taken off again when neither is. Fixed columns keep their widths whatever is measured.
 *
 * The round of a row's end belongs to the look: it is read again when `variant` or `density`
 * changes, and when rows take the place of an empty grid's words or give it back, since the words
 * are no row to read it of. A frame that measures 0 is not measured (jsdom, a hidden grid): the
 * last answer stands.
 */
export function useColumnWidths(
  frameRef: RefObject<HTMLElement | null>,
  columns: readonly WidthSpec[],
  look: { fullRow: boolean; variant: TableVariant; density: DataGridDensity },
): ColumnLayout {
  const { fullRow, variant, density } = look;
  const flexible = columns.some((column) => column.width === undefined);
  const fixed = columns.length > 0 && !flexible;
  const spans = flexible || fullRow;
  const watching = spans || fixed;
  const [room, setRoom] = useState<number | undefined>(undefined);
  const [endRound, setEndRound] = useState(0);

  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!watching || !frame) return undefined;
    const measure = () => {
      const width = roomOf(frame);
      // Not measured (jsdom, a hidden grid): the columns keep what they have.
      if (width <= 0) return;
      if (spans) frame.style.setProperty(FRAME_WIDTH_PROPERTY, `${width}px`);
      setRoom(width);
    };
    measure();
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure);
    observer?.observe(frame);
    return () => {
      observer?.disconnect();
      frame.style.removeProperty(FRAME_WIDTH_PROPERTY);
    };
  }, [frameRef, watching, spans]);

  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (fixed && frame) setEndRound(endRoundOf(frame));
  }, [frameRef, fixed, fullRow, variant, density]);

  const widths = useMemo(
    () => (flexible && room !== undefined ? resolveWidths(columns, room) : undefined),
    [flexible, room, columns],
  );
  const sum = fixed ? columns.reduce((total, column) => total + (column.width ?? 0), 0) : 0;
  const filler = fixed && (room === undefined || room - sum >= Math.max(1, endRound));
  return { widths, fixed, filler };
}
