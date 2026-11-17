import { useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { px } from '../../../internal/number';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';
import { resolveWidths } from '../engine/layout';
import type { WidthSpec } from '../engine/layout';

/** The custom property of the frame that holds the width the columns share, for what spans them. */
export const FRAME_WIDTH_PROPERTY = '--flg-data-grid-frame-width';

// The room for the table: the frame without its scrollbar and its own padding (a `striped` frame
// has 6px). `clientWidth` is the layout size, which a transform does not change.
function roomOf(frame: HTMLElement): number {
  const style = getComputedStyle(frame);
  const padding = px(style.paddingLeft) + px(style.paddingRight);
  return Math.max(0, frame.clientWidth - padding);
}

/**
 * The width in pixels of each column, once the frame has been measured; `undefined` until then and
 * when every column has a width of its own. Only a grid with a flexible column watches its frame,
 * or one that shows something across every column (`fullRow`: the words of an empty grid), which
 * is as wide as the frame shows: with neither, nothing is observed and the widths are the
 * columns' own. The room is written to the frame as `--flg-data-grid-frame-width`, which the
 * stylesheet declares itself so a grid in a cell of another never takes the outer one's, and taken
 * off again when the watching stops. Fixed columns keep their widths whatever is measured.
 */
export function useColumnWidths(
  frameRef: RefObject<HTMLElement | null>,
  columns: readonly WidthSpec[],
  fullRow = false,
): number[] | undefined {
  const flexible = columns.some((column) => column.width === undefined);
  const watching = flexible || fullRow;
  const [room, setRoom] = useState<number | undefined>(undefined);

  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!watching || !frame) return undefined;
    const measure = () => {
      const width = roomOf(frame);
      // Not measured (jsdom, a hidden grid): the columns keep what the stylesheet gives them.
      if (width <= 0) return;
      frame.style.setProperty(FRAME_WIDTH_PROPERTY, `${width}px`);
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
  }, [frameRef, watching]);

  return useMemo(
    () => (flexible && room !== undefined ? resolveWidths(columns, room) : undefined),
    [flexible, room, columns],
  );
}
