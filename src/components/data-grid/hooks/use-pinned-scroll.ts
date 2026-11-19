import type { RefObject } from 'react';
import { useIsoLayoutEffect } from '../../../internal/use-iso-layout-effect';

/** The custom property of the frame that holds how tall the shadow of a pinned zone is. */
export const VIEW_HEIGHT_PROPERTY = '--flg-data-grid-view-height';

const SCROLLED_LEFT = 'data-scrolled-left';
const SCROLLED_RIGHT = 'data-scrolled-right';

/**
 * How tall the part of the table that the frame shows is, from the top of the heading to the end of
 * the last row or the bottom of the frame, whichever is first: the shadow of a pinned zone is that
 * tall, so it never hangs below the last row into the empty part of a frame with a `height`. The
 * heading sticks to the top of the frame (a `striped` frame has padding, the heading sticks above
 * it), so the table starts at its own top or at the top of the frame, whichever is lower. Sizes in
 * layout pixels, which a transform does not change.
 */
function shownHeight(frame: HTMLElement, table: HTMLElement | null): number {
  const start = table?.offsetTop ?? 0;
  const top = Math.max(0, start - frame.scrollTop);
  const bottom = Math.min(frame.clientHeight, start + (table?.offsetHeight ?? 0) - frame.scrollTop);
  return Math.max(0, bottom - top);
}

/**
 * Tells the stylesheet which sides of the frame have columns scrolled under a pinned zone (spec
 * phase 6 §3.7): `data-scrolled-left` while the frame is scrolled from its left end, and
 * `data-scrolled-right` while it is not at its right end. A pinned cell is solid only on a scrolled
 * side, and the shadow of the edge of its zone is drawn only there, so a grid at rest draws neither.
 * With a side scrolled, the height of the shadow is written as `--flg-data-grid-view-height`.
 *
 * The attributes and the property are written on the frame directly, and only when a value changes:
 * a scroll draws no part of the grid. There is a listener and an observer only while a column is
 * pinned (`enabled`), and they and what they wrote go with the last pin and with the grid. Nothing is
 * measured of the table's height while no side is scrolled. After mount only: the server draws the
 * grid at rest.
 */
export function usePinnedScroll(
  frameRef: RefObject<HTMLElement | null>,
  tableRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useIsoLayoutEffect(() => {
    const frame = frameRef.current;
    if (!enabled || !frame) return undefined;
    let left = false;
    let right = false;
    let height: string | null = null;
    const set = (name: string, on: boolean) => {
      if (on) frame.setAttribute(name, '');
      else frame.removeAttribute(name);
    };
    const update = () => {
      const nextLeft = frame.scrollLeft > 0;
      // A pixel short of the end is the end: a fraction of a pixel is no scroll.
      const nextRight = frame.scrollLeft + frame.clientWidth < frame.scrollWidth - 1;
      if (nextLeft !== left) set(SCROLLED_LEFT, (left = nextLeft));
      if (nextRight !== right) set(SCROLLED_RIGHT, (right = nextRight));
      const next = left || right ? `${shownHeight(frame, tableRef.current)}px` : null;
      if (next === height) return;
      height = next;
      if (next === null) frame.style.removeProperty(VIEW_HEIGHT_PROPERTY);
      else frame.style.setProperty(VIEW_HEIGHT_PROPERTY, next);
    };
    update();
    frame.addEventListener('scroll', update, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
    observer?.observe(frame);
    if (tableRef.current) observer?.observe(tableRef.current);
    return () => {
      frame.removeEventListener('scroll', update);
      observer?.disconnect();
      frame.removeAttribute(SCROLLED_LEFT);
      frame.removeAttribute(SCROLLED_RIGHT);
      frame.style.removeProperty(VIEW_HEIGHT_PROPERTY);
    };
  }, [frameRef, tableRef, enabled]);
}
